from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, Response, make_response, request
from flask_jwt_extended import jwt_required
from sqlalchemy import asc, desc

from app.extensions import db, limiter
from app.models.core import Alert, AuditLog, BlockchainTransaction, Device, Incident, IocFeed, NetworkTraffic, Permission, Setting, Threat
from app.services.ai_engine import analyze_signal
from app.services.blockchain import build_tx_hash, verify_tx_integrity
from app.services.reports import build_csv_bytes, build_json_bytes, build_pdf_report_bytes
from app.utils.decorators import requires_roles
from app.utils.responses import fail, ok

bp = Blueprint("core", __name__, url_prefix="/api/v1")


def _pagination(model, serializer=None):
    page = max(int(request.args.get("page", 1)), 1)
    per_page = min(max(int(request.args.get("per_page", 20)), 1), 100)
    query = model.query
    search = (request.args.get("search") or "").strip()
    if search:
        if model is Device:
            query = query.filter((Device.device_name.ilike(f"%{search}%")) | (Device.ip_address.ilike(f"%{search}%")) | (Device.location.ilike(f"%{search}%")))
        elif model is Alert:
            query = query.filter((Alert.title.ilike(f"%{search}%")) | (Alert.message.ilike(f"%{search}%")))
        elif model is Threat:
            query = query.filter((Threat.threat_classification.ilike(f"%{search}%")) | (Threat.device_name.ilike(f"%{search}%")))
        elif model is IocFeed:
            query = query.filter((IocFeed.ioc_value.ilike(f"%{search}%")) | (IocFeed.ioc_type.ilike(f"%{search}%")))
    sort = request.args.get("sort", "created_at")
    direction = request.args.get("direction", "desc")
    sort_column = getattr(model, sort, getattr(model, "created_at", None))
    if sort_column is not None:
        query = query.order_by(desc(sort_column) if direction != "asc" else asc(sort_column))
    page_obj = query.paginate(page=page, per_page=per_page, error_out=False)
    items = [serializer(item).to_dict() if serializer else item.to_dict() for item in page_obj.items]
    return {
        "items": items,
        "page": page_obj.page,
        "per_page": page_obj.per_page,
        "total": page_obj.total,
        "pages": page_obj.pages,
    }


def _upsert_setting(category: str, key: str, value: dict, description: str | None = None):
    setting = Setting.query.filter_by(category=category, key=key).first()
    if setting:
        setting.value = value
        setting.description = description or setting.description
    else:
        setting = Setting(category=category, key=key, value=value, description=description)
        db.session.add(setting)
    db.session.add(AuditLog(entity_type="setting", entity_id=f"{category}:{key}", action="save_setting", actor="system", details={"value": value}))
    db.session.commit()
    return setting


@bp.get("/health")
def health():
    return ok({"service": "SecureNet AI API", "status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()})


@bp.get("/dashboard/summary")
@jwt_required(optional=True)
def dashboard_summary():
    return ok(
        {
            "total_devices": Device.query.count(),
            "active_devices": Device.query.filter(Device.threat_status == "healthy").count(),
            "threats_detected": Threat.query.count(),
            "blocked_attacks": Alert.query.filter(Alert.status == "resolved").count(),
            "blockchain_transactions": BlockchainTransaction.query.count(),
            "ai_accuracy": 96.8,
        }
    )


@bp.get("/dashboard/traffic")
@jwt_required(optional=True)
def dashboard_traffic():
    buckets = NetworkTraffic.query.order_by(NetworkTraffic.created_at.asc()).all()
    return ok({"items": [bucket.to_dict() for bucket in buckets]})


@bp.post("/traffic/report")
def report_traffic_statistics():
    payload = request.get_json(silent=True) or {}
    inbound = int(payload.get("inbound", 0))
    outbound = int(payload.get("outbound", 0))
    anomalies = int(payload.get("anomalies", 0))
    protocol_breakdown = payload.get("protocol_breakdown", {})

    bucket_label = datetime.now(timezone.utc).strftime("%H:%M:%S")

    traffic = NetworkTraffic(
        bucket=bucket_label,
        inbound=inbound,
        outbound=outbound,
        anomalies=anomalies,
        protocol_breakdown=protocol_breakdown
    )
    db.session.add(traffic)

    # Maintain maximum of 30 items
    count = NetworkTraffic.query.count()
    if count > 30:
        oldest = NetworkTraffic.query.order_by(NetworkTraffic.created_at.asc()).first()
        if oldest:
            db.session.delete(oldest)

    db.session.commit()
    return ok({"traffic": traffic.to_dict()}, "Traffic statistics recorded")



@bp.get("/devices")
@jwt_required()
def list_devices():
    return ok(_pagination(Device))


@bp.post("/devices")
@requires_roles("Admin", "Network Engineer")
def create_device():
    payload = request.get_json(silent=True) or {}
    required = ["device_name", "device_type", "device_id", "mac_address", "ip_address"]
    missing = [field for field in required if not payload.get(field)]
    if missing:
        return fail("Missing required fields", 422, missing)
    device = Device(
        device_name=payload["device_name"],
        device_type=payload["device_type"],
        device_id=payload["device_id"],
        mac_address=payload["mac_address"],
        ip_address=payload["ip_address"],
        location=payload.get("location"),
        owner=payload.get("owner"),
        firmware_version=payload.get("firmware_version"),
        risk_score=int(payload.get("risk_score", 0)),
        threat_status=payload.get("threat_status", "healthy"),
        last_seen=payload.get("last_seen"),
            extra_data=payload.get("metadata", {}),
    )
    db.session.add(device)
    db.session.add(AuditLog(entity_type="device", entity_id=device.device_id, action="register_device", actor=payload.get("actor"), details=device.to_dict()))
    tx = BlockchainTransaction(tx_hash=build_tx_hash("DeviceRegistration", device.to_dict()), event_type="DeviceRegistration", payload=device.to_dict(), block_number=47284, gas_used=54000)
    db.session.add(tx)
    db.session.commit()
    return ok({"device": device.to_dict()}, "Device registered", 201)


@bp.put("/devices/<int:device_pk>")
@requires_roles("Admin", "Network Engineer")
def update_device(device_pk: int):
    device = Device.query.get_or_404(device_pk)
    payload = request.get_json(silent=True) or {}
    for field in ["device_name", "device_type", "mac_address", "ip_address", "location", "owner", "firmware_version", "last_seen"]:
        if field in payload:
            setattr(device, field, payload[field])
    if "risk_score" in payload:
        device.risk_score = int(payload["risk_score"])
    if "threat_status" in payload:
        device.threat_status = payload["threat_status"]
        if "metadata" in payload:
            device.extra_data = payload["metadata"]
    db.session.add(AuditLog(entity_type="device", entity_id=device.device_id, action="update_device", actor=payload.get("actor"), details=payload))
    db.session.commit()
    return ok({"device": device.to_dict()})


@bp.delete("/devices/<int:device_pk>")
@requires_roles("Admin")
def delete_device(device_pk: int):
    device = Device.query.get_or_404(device_pk)
    db.session.add(AuditLog(entity_type="device", entity_id=device.device_id, action="delete_device", actor=request.args.get("actor"), details=device.to_dict()))
    db.session.delete(device)
    db.session.commit()
    return ok(None, "Device deleted")


@bp.post("/devices/<int:device_pk>/block")
@requires_roles("Admin", "Security Analyst", "Network Engineer")
def sdn_block_device(device_pk: int):
    device = Device.query.get_or_404(device_pk)
    device.threat_status = "blocked"
    device.risk_score = 100
    
    import requests
    import os
    ryu_url = os.getenv("RYU_API_URL", "http://ryu:8080")
    try:
        requests.post(f"{ryu_url}/sdn/block", json={"mac": device.mac_address, "ip": device.ip_address}, timeout=2)
    except Exception as e:
        print(f"[Ryu SDN] Warning: Failed to send block command to Ryu: {e}")

    from app.services.blockchain import create_audit_record_on_chain
    tx_info = create_audit_record_on_chain("device", device.device_id, "block", "system", device.to_dict())
    
    tx = BlockchainTransaction(
        tx_hash=tx_info["tx_hash"],
        event_type="DeviceBlocking",
        payload=device.to_dict(),
        block_number=tx_info["block_number"],
        gas_used=tx_info["gas_used"],
        verified=True
    )
    db.session.add(tx)
    db.session.add(AuditLog(entity_type="device", entity_id=device.device_id, action="block_device", actor="system", details=device.to_dict()))
    db.session.commit()
    return ok({"device": device.to_dict(), "blockchain_tx": tx_info}, "Device blocked")


@bp.post("/devices/<int:device_pk>/allow")
@requires_roles("Admin", "Network Engineer")
def sdn_allow_device(device_pk: int):
    device = Device.query.get_or_404(device_pk)
    device.threat_status = "healthy"
    device.risk_score = 0

    import requests
    import os
    ryu_url = os.getenv("RYU_API_URL", "http://ryu:8080")
    try:
        requests.post(f"{ryu_url}/sdn/allow", json={"mac": device.mac_address, "ip": device.ip_address}, timeout=2)
    except Exception as e:
        print(f"[Ryu SDN] Warning: Failed to send allow command to Ryu: {e}")

    from app.services.blockchain import create_audit_record_on_chain
    tx_info = create_audit_record_on_chain("device", device.device_id, "allow", "system", device.to_dict())

    tx = BlockchainTransaction(
        tx_hash=tx_info["tx_hash"],
        event_type="DeviceAllowance",
        payload=device.to_dict(),
        block_number=tx_info["block_number"],
        gas_used=tx_info["gas_used"],
        verified=True
    )
    db.session.add(tx)
    db.session.add(AuditLog(entity_type="device", entity_id=device.device_id, action="allow_device", actor="system", details=device.to_dict()))
    db.session.commit()
    return ok({"device": device.to_dict(), "blockchain_tx": tx_info}, "Device allowed")


@bp.post("/devices/<int:device_pk>/quarantine")
@requires_roles("Admin", "Security Analyst")
def sdn_quarantine_device(device_pk: int):
    device = Device.query.get_or_404(device_pk)
    device.threat_status = "compromised"
    device.risk_score = 75

    import requests
    import os
    ryu_url = os.getenv("RYU_API_URL", "http://ryu:8080")
    try:
        requests.post(f"{ryu_url}/sdn/quarantine", json={"mac": device.mac_address, "ip": device.ip_address}, timeout=2)
    except Exception as e:
        print(f"[Ryu SDN] Warning: Failed to send quarantine command to Ryu: {e}")

    from app.services.blockchain import create_audit_record_on_chain
    tx_info = create_audit_record_on_chain("device", device.device_id, "quarantine", "system", device.to_dict())

    tx = BlockchainTransaction(
        tx_hash=tx_info["tx_hash"],
        event_type="DeviceQuarantine",
        payload=device.to_dict(),
        block_number=tx_info["block_number"],
        gas_used=tx_info["gas_used"],
        verified=True
    )
    db.session.add(tx)
    db.session.add(AuditLog(entity_type="device", entity_id=device.device_id, action="quarantine_device", actor="system", details=device.to_dict()))
    db.session.commit()
    return ok({"device": device.to_dict(), "blockchain_tx": tx_info}, "Device quarantined")


@bp.post("/devices/<int:device_pk>/monitor")
@requires_roles("Admin", "Security Analyst", "Network Engineer")
def sdn_monitor_device(device_pk: int):
    device = Device.query.get_or_404(device_pk)
    device.threat_status = "warning"
    device.risk_score = 40

    import requests
    import os
    ryu_url = os.getenv("RYU_API_URL", "http://ryu:8080")
    try:
        requests.post(f"{ryu_url}/sdn/monitor", json={"mac": device.mac_address, "ip": device.ip_address}, timeout=2)
    except Exception as e:
        print(f"[Ryu SDN] Warning: Failed to send monitor command to Ryu: {e}")

    from app.services.blockchain import create_audit_record_on_chain
    tx_info = create_audit_record_on_chain("device", device.device_id, "monitor", "system", device.to_dict())

    tx = BlockchainTransaction(
        tx_hash=tx_info["tx_hash"],
        event_type="DeviceMonitoring",
        payload=device.to_dict(),
        block_number=tx_info["block_number"],
        gas_used=tx_info["gas_used"],
        verified=True
    )
    db.session.add(tx)
    db.session.add(AuditLog(entity_type="device", entity_id=device.device_id, action="monitor_device", actor="system", details=device.to_dict()))
    db.session.commit()
    return ok({"device": device.to_dict(), "blockchain_tx": tx_info}, "Device monitoring active")


@bp.get("/alerts")
@jwt_required()
def list_alerts():
    return ok(_pagination(Alert))


@bp.post("/alerts/<int:alert_pk>/acknowledge")
@requires_roles("Admin", "Security Analyst")
def acknowledge_alert(alert_pk: int):
    alert = Alert.query.get_or_404(alert_pk)
    alert.status = "acknowledged"
    db.session.add(AuditLog(entity_type="alert", entity_id=alert.alert_id, action="acknowledge", actor=request.args.get("actor"), details={}))
    db.session.commit()
    return ok({"alert": alert.to_dict()})


@bp.post("/alerts/<int:alert_pk>/resolve")
@requires_roles("Admin", "Security Analyst")
def resolve_alert(alert_pk: int):
    alert = Alert.query.get_or_404(alert_pk)
    alert.status = "resolved"
    db.session.add(AuditLog(entity_type="alert", entity_id=alert.alert_id, action="resolve", actor=request.args.get("actor"), details={}))
    db.session.add(BlockchainTransaction(tx_hash=build_tx_hash("ThreatResolution", alert.to_dict()), event_type="ThreatResolution", payload=alert.to_dict(), block_number=47285, gas_used=49000))
    db.session.commit()
    return ok({"alert": alert.to_dict()})


@bp.get("/incidents")
@jwt_required()
def list_incidents():
    return ok(_pagination(Incident))


@bp.post("/incidents")
@requires_roles("Admin", "Security Analyst")
def create_incident():
    payload = request.get_json(silent=True) or {}
    required = ["incident_id", "title", "severity"]
    if any(not payload.get(field) for field in required):
        return fail("incident_id, title, and severity are required", 422)
    incident = Incident(
        incident_id=payload["incident_id"],
        title=payload["title"],
        severity=payload["severity"],
        status=payload.get("status", "open"),
        assigned_to=payload.get("assigned_to"),
        timeline=payload.get("timeline", []),
        comments=payload.get("comments", []),
        summary=payload.get("summary"),
    )
    db.session.add(incident)
    db.session.add(AuditLog(entity_type="incident", entity_id=incident.incident_id, action="create_incident", actor=payload.get("actor"), details=incident.to_dict()))
    db.session.commit()
    return ok({"incident": incident.to_dict()}, "Incident created", 201)


@bp.get("/threats")
@jwt_required()
def list_threats():
    return ok(_pagination(Threat))


@bp.post("/threats/analyze")
@requires_roles("Admin", "Security Analyst")
def analyze_threat():
    payload = request.get_json(silent=True) or {}
    signal = payload.get("signal") or payload.get("message") or ""
    result = analyze_signal(signal)
    threat = Threat(
        threat_id=payload.get("threat_id") or f"THR-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        threat_classification=result["threat_classification"],
        ai_confidence=result["confidence_score"],
        risk_score=payload.get("risk_score", 80),
        status="open",
        device_name=payload.get("device_name"),
        recommendation=result["recommendation"],
    )
    db.session.add(threat)
    db.session.add(AuditLog(entity_type="threat", entity_id=threat.threat_id, action="detect_threat", actor=payload.get("actor"), details=result))
    db.session.commit()
    return ok({"analysis": result, "threat": threat.to_dict()}, "Threat analyzed", 201)


@bp.post("/threats/retrain")
@requires_roles("Admin", "Security Analyst")
def retrain_model_api():
    from app.services.ai_engine import retrain_model_on_demand
    accuracy = retrain_model_on_demand()
    db.session.add(AuditLog(entity_type="model", entity_id="threat_classifier", action="retrain", actor=request.args.get("actor", "system"), details={"accuracy": accuracy}))
    db.session.commit()
    return ok({"accuracy": accuracy}, "AI model retrained successfully")



@bp.get("/audit-logs")
@jwt_required()
def list_audit_logs():
    return ok(_pagination(AuditLog))


@bp.get("/blockchain/transactions")
@jwt_required()
def list_transactions():
    return ok(_pagination(BlockchainTransaction))


@bp.post("/blockchain/verify")
@requires_roles("Admin", "Auditor")
def verify_blockchain():
    payload = request.get_json(silent=True) or {}
    tx_hash = payload.get("tx_hash") or ""
    verified = verify_tx_integrity(tx_hash, payload.get("payload", {}))
    return ok({"verified": verified})


@bp.get("/ioc")
@jwt_required()
def list_ioc():
    return ok(_pagination(IocFeed))


@bp.post("/ioc")
@requires_roles("Admin", "Security Analyst")
def create_ioc():
    payload = request.get_json(silent=True) or {}
    ioc = IocFeed(
        ioc_value=payload.get("ioc_value", ""),
        ioc_type=payload.get("ioc_type", "ip"),
        severity=payload.get("severity", "medium"),
        source=payload.get("source"),
        status=payload.get("status", "active"),
    )
    db.session.add(ioc)
    db.session.add(AuditLog(entity_type="ioc", entity_id=ioc.ioc_value, action="create_ioc", actor=payload.get("actor"), details=ioc.to_dict()))
    db.session.commit()
    return ok({"ioc": ioc.to_dict()}, "IOC created", 201)


@bp.get("/settings")
@jwt_required()
def list_settings():
    return ok(_pagination(Setting))


@bp.put("/settings")
@requires_roles("Admin")
def save_settings():
    payload = request.get_json(silent=True) or {}
    settings = payload.get("settings") or []
    saved = []
    for item in settings:
        saved.append(_upsert_setting(item.get("category", "general"), item.get("key", "unknown"), item.get("value", {}), item.get("description")))
    return ok({"settings": [setting.to_dict() for setting in saved]})


@bp.get("/reports/history")
@jwt_required()
def report_history():
    payload = [
        {"id": "RPT-001", "type": "full", "format": "pdf", "generated_at": "2026-06-15T14:21:00Z"},
        {"id": "RPT-002", "type": "compliance", "format": "csv", "generated_at": "2026-06-15T08:12:00Z"},
    ]
    return ok({"items": payload})


@bp.post("/reports/generate")
@jwt_required()
def generate_report():
    payload = request.get_json(silent=True) or {}
    report_type = payload.get("type", "full")
    fmt = payload.get("format", "pdf")
    sections = [
        ("Summary", f"Generated report type: {report_type}"),
        ("KPIs", "Devices, alerts, threats, and blockchain integrity overview"),
    ]
    if fmt == "csv":
        response = make_response(build_csv_bytes([{"type": report_type, "status": "generated"}]))
        response.headers["Content-Type"] = "text/csv"
        response.headers["Content-Disposition"] = 'attachment; filename="securenet-report.csv"'
        return response
    if fmt == "json":
        response = make_response(build_json_bytes({"type": report_type, "status": "generated"}))
        response.headers["Content-Type"] = "application/json"
        response.headers["Content-Disposition"] = 'attachment; filename="securenet-report.json"'
        return response
    response = make_response(build_pdf_report_bytes("SecureNet AI Report", sections))
    response.headers["Content-Type"] = "application/pdf"
    response.headers["Content-Disposition"] = 'attachment; filename="securenet-report.pdf"'
    return response
