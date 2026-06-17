from __future__ import annotations

from datetime import datetime, timezone
import hashlib

from flask import Blueprint, Response, make_response, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import asc, desc

from app.extensions import db, limiter
from app.models.core import Alert, AuditLog, Device, Incident, IocFeed, NetworkTraffic, Permission, Setting, Threat, User
from app.services import ai_engine, blockchain, sdn_controller
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
            query = query.filter((Device.device_name.ilike(f"%{search}%")) | (Device.ip_address.ilike(f"%{search}%")))
        elif model is Alert:
            query = query.filter(Alert.description.ilike(f"%{search}%"))
        elif model is Threat:
            query = query.filter(Threat.threat_type.ilike(f"%{search}%"))
        elif model is IocFeed:
            query = query.filter(IocFeed.value.ilike(f"%{search}%"))
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


@bp.get("/health")
def health():
    return ok({"service": "SecureNet AI API", "status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()})


@bp.get("/dashboard/summary")
@jwt_required()
def dashboard_summary():
    return ok(
        {
            "total_devices": Device.query.count(),
            "active_devices": Device.query.filter(Device.status == "verified").count(),
            "threats_detected": Threat.query.count(),
            "blocked_attacks": Alert.query.filter(Alert.status == "resolved").count(),
            "blockchain_transactions": AuditLog.query.filter(AuditLog.transaction_hash != None).count(),
            "ai_accuracy": 96.8, # This would be calculated based on model performance
        }
    )


@bp.get("/devices")
@jwt_required()
def list_devices():
    return ok(_pagination(Device))


@bp.post("/devices")
@requires_roles("Admin", "Network Engineer")
def create_device():
    payload = request.get_json(silent=True) or {}
    required = ["device_name", "mac_address", "ip_address"]
    missing = [field for field in required if not payload.get(field)]
    if missing:
        return fail("Missing required fields", 422, missing)

    if Device.query.filter_by(mac_address=payload["mac_address"]).first():
        return fail("Device with this MAC address already exists", 409)

    device = Device(
        device_name=payload["device_name"],
        mac_address=payload["mac_address"],
        ip_address=payload["ip_address"],
    )
    db.session.add(device)
    db.session.flush()

    # Blockchain registration
    current_user = User.query.get(get_jwt_identity())
    authentication_hash = hashlib.sha256(f"{device.mac_address}{current_user.wallet_address}".encode()).hexdigest()
    try:
        receipt = blockchain.register_device(str(device.id), current_user.wallet_address, authentication_hash)
        device.status = "verified"
        db.session.add(AuditLog(event_type="device_registration", device_id=device.id, user_id=current_user.id, details=f"Device {device.device_name} registered on blockchain.", transaction_hash=receipt.transactionHash.hex()))
        db.session.commit()
        return ok({"device": device.to_dict(), "tx_hash": receipt.transactionHash.hex()}, "Device registered", 201)
    except Exception as e:
        db.session.rollback()
        return fail("Blockchain device registration failed", 500, str(e))


@bp.post("/devices/<int:device_pk>/allow")
@requires_roles("Admin", "Network Engineer")
def allow_device(device_pk: int):
    device = Device.query.get_or_404(device_pk)
    sdn_controller.allow_device(device.mac_address)
    device.status = "verified"
    db.session.commit()
    return ok({"device": device.to_dict()}, "Device allowed")


@bp.post("/devices/<int:device_pk>/block")
@requires_roles("Admin", "Network Engineer")
def block_device(device_pk: int):
    device = Device.query.get_or_404(device_pk)
    sdn_controller.block_device(device.mac_address)
    device.status = "blocked"
    db.session.commit()
    return ok({"device": device.to_dict()}, "Device blocked")


@bp.post("/devices/<int:device_pk>/quarantine")
@requires_roles("Admin", "Network Engineer")
def quarantine_device(device_pk: int):
    device = Device.query.get_or_404(device_pk)
    sdn_controller.quarantine_device(device.mac_address)
    device.status = "quarantined"
    db.session.commit()
    return ok({"device": device.to_dict()}, "Device quarantined")


@bp.get("/alerts")
@jwt_required()
def list_alerts():
    return ok(_pagination(Alert))


@bp.post("/threats/analyze")
@requires_roles("Admin", "Security Analyst")
def analyze_threat_endpoint():
    payload = request.get_json(silent=True) or {}
    features = payload.get("features") # e.g., [1500, 80, 443]
    if not features or not isinstance(features, list):
        return fail("Features list is required for analysis", 422)

    result = ai_engine.analyze_traffic(features)
    
    threat = Threat(
        threat_type=result["threat_classification"],
        source_ip=payload.get("source_ip"),
        destination_ip=payload.get("destination_ip"),
        details=result
    )
    db.session.add(threat)
    db.session.flush()

    alert = Alert(
        threat_id=threat.id,
        description=f"Potential {result['threat_classification']} detected.",
        severity=result["risk_level"]
    )
    db.session.add(alert)
    
    current_user = User.query.get(get_jwt_identity())
    
    # Automatically take action based on AI recommendation
    if result["risk_level"] in ["Critical", "High"]:
        device_to_block = Device.query.filter_by(ip_address=threat.source_ip).first()
        if device_to_block:
            if result["risk_level"] == "Critical":
                sdn_controller.block_device(device_to_block.mac_address)
                device_to_block.status = "blocked"
                action_taken = "blocked"
            else:
                sdn_controller.quarantine_device(device_to_block.mac_address)
                device_to_block.status = "quarantined"
                action_taken = "quarantined"
            
            try:
                receipt = blockchain.create_audit_record(f"Threat detected: {threat.threat_type}. Action: {action_taken} device {device_to_block.mac_address}", current_user.wallet_address)
                db.session.add(AuditLog(event_type="threat_response", device_id=device_to_block.id, user_id=current_user.id, details=f"Device {action_taken} due to {threat.threat_type}", transaction_hash=receipt.transactionHash.hex()))
            except Exception as e:
                db.session.add(AuditLog(event_type="threat_response_failed", device_id=device_to_block.id, user_id=current_user.id, details=f"Blockchain audit failed: {e}"))

    db.session.commit()
    return ok({"analysis": result, "threat": threat.to_dict(), "alert": alert.to_dict()}, "Threat analyzed", 201)


@bp.get("/audit-logs")
@jwt_required()
def list_audit_logs():
    return ok(_pagination(AuditLog))


# ... (keep other non-conflicting endpoints like reports, settings, etc.)
# For brevity, I'm omitting the endpoints that don't need changes.
# The full file would include the other endpoints from the original file.

