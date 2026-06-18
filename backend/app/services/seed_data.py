"""Seed PostgreSQL / Supabase with platform demo data."""

from __future__ import annotations

from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models.core import (
    Alert,
    AuditLog,
    BlockchainTransaction,
    Device,
    Incident,
    Role,
    Setting,
    Threat,
    User,
)


DEMO_PASSWORDS = {
    "k.singh@secnet.ai": "admin123",
    "a.rahman@secnet.ai": "analyst123",
    "s.ivanova@secnet.ai": "engineer123",
    "p.nair@secnet.ai": "auditor123",
}


def seed_database(force: bool = False) -> None:
    """Populate empty tables with demo data migrated from the frontend mock dataset."""
    if not force and User.query.first():
        return

    roles = _ensure_roles()
    _seed_users(roles)
    _seed_devices()
    _seed_alerts()
    _seed_threats()
    _seed_incidents()
    _seed_audit_logs()
    _seed_blockchain_transactions()
    _seed_settings()
    db.session.commit()


def _ensure_roles() -> dict[str, Role]:
    specs = [
        ("Admin", "Full platform access", {"all": True}),
        ("Security Analyst", "Threat analysis and response", {"alerts": ["view", "acknowledge", "resolve"]}),
        ("Network Engineer", "Network and device operations", {"devices": ["view", "create", "update"]}),
        ("Auditor", "Read-only compliance role", {"audit": ["view", "export"]}),
    ]
    roles: dict[str, Role] = {}
    for name, desc, perms in specs:
        role = Role.query.filter_by(name=name).first()
        if not role:
            role = Role(name=name, description=desc, permissions=perms)
            db.session.add(role)
        roles[name] = role
    db.session.flush()
    return roles


def _seed_users(roles: dict[str, Role]) -> None:
    users = [
        ("k.singh@secnet.ai", "Kamran Singh", "Admin", "0x807b242b3494a8b68cA0dE01C323fFB0511eDF73"),
        ("a.rahman@secnet.ai", "Ahmad Rahman", "Security Analyst", "0xF04F38311C4115D4BF9b06D294A39047aCe7760c"),
        ("s.ivanova@secnet.ai", "Sasha Ivanova", "Network Engineer", "0x61E22c36CDca807Dfa1d9E5561949049AfA329CF"),
        ("p.nair@secnet.ai", "Priya Nair", "Auditor", "0x3dF2dCA8d92f5A16b754BE60097E05440f30f794"),
    ]
    for email, name, role_name, eth in users:
        user = User.query.filter_by(email=email).first()
        pwd = DEMO_PASSWORDS.get(email, "changeme123")
        if user:
            if not user.password_hash:
                user.password_hash = generate_password_hash(pwd)
            continue
        db.session.add(
            User(
                email=email,
                full_name=name,
                password_hash=generate_password_hash(pwd),
                eth_address=eth.lower(),
                role=roles[role_name],
                mfa_enabled=True,
            )
        )


def _seed_devices() -> None:
    if Device.query.first():
        return
    devices = [
        ("SDN-Controller-01", "controller", "DEV-001", "00:1A:2B:3C:4D:5E", "10.0.0.1", "Data Center A", "OpenFlow 1.5", 0, "healthy"),
        ("Core-SW-01", "switch", "DEV-002", "00:2B:3C:4D:5E:6F", "10.0.1.1", "DC Rack B3", "Cisco IOS 16.9", 5, "healthy"),
        ("Core-SW-02", "switch", "DEV-003", "00:3C:4D:5E:6F:7A", "10.0.1.2", "DC Rack B4", "Cisco IOS 16.9", 42, "warning"),
        ("Edge-SW-03", "switch", "DEV-004", "00:4D:5E:6F:7A:8B", "10.0.2.3", "Building C - Floor 2", "Cisco IOS 15.2", 94, "compromised"),
        ("SVR-Web-01", "server", "DEV-005", "00:5E:6F:7A:8B:9C", "10.0.3.1", "DC Rack A1", "Ubuntu 22.04 LTS", 18, "healthy"),
        ("SVR-DB-02", "server", "DEV-006", "00:6F:7A:8B:9C:0D", "10.0.3.2", "DC Rack A2", "RHEL 9.2", 11, "healthy"),
        ("PC-Finance-03", "pc", "DEV-007", "00:7A:8B:9C:0D:1E", "192.168.1.23", "Finance Dept - 3F", "Windows 11 Pro", 68, "warning"),
        ("IoT-Sensor-48", "iot", "DEV-008", "00:8B:9C:0D:1E:2F", "172.16.5.48", "Building A - Rooftop", "FW v2.1.3", 97, "compromised"),
        ("IoT-Camera-12", "iot", "DEV-009", "00:9C:0D:1E:2F:3A", "172.16.5.12", "Building B - Lobby", "FW v3.0.1", 55, "warning"),
        ("PC-DevOps-07", "pc", "DEV-010", "00:AD:1B:2C:3D:4E", "192.168.2.17", "Engineering - 5F", "macOS Ventura 13.4", 22, "healthy"),
    ]
    for name, dtype, did, mac, ip, loc, fw, risk, status in devices:
        db.session.add(
            Device(
                device_name=name,
                device_type=dtype,
                device_id=did,
                mac_address=mac,
                ip_address=ip,
                location=loc,
                owner="Network Team",
                firmware_version=fw,
                risk_score=risk,
                threat_status=status,
                last_seen="Active",
                extra_data={"connType": "Fiber 10G" if "SW" in name or "SVR" in name else "Ethernet 1G"},
            )
        )


def _seed_alerts() -> None:
    if Alert.query.first():
        return
    rows = [
        ("ALT-001", "critical", "DDoS Attack Detected", "Volumetric attack on Edge-SW-03 — 4.2 Gbps spike", "new", "Edge-SW-03", 97),
        ("ALT-002", "critical", "Botnet C2 Communication", "IoT-Sensor-48 communicating with known C2 server", "new", "IoT-Sensor-48", 94),
        ("ALT-003", "high", "Credential Stuffing Attack", "550 failed login attempts on finance portal", "acknowledged", "PC-Finance-03", 91),
        ("ALT-004", "high", "ARP Spoofing Detected", "MITM attack on IoT network segment", "investigating", "IoT Cluster", 89),
        ("ALT-005", "high", "Unauthorized SSH Access", "SSH brute force from 103.88.45.201", "acknowledged", "SVR-Web-01", 88),
        ("ALT-006", "medium", "SSL Certificate Expiry", "Certificate expires in 7 days", "new", "Web-Proxy-02", 60),
        ("ALT-007", "medium", "Firmware Outdated", "24 IoT devices running vulnerable firmware", "acknowledged", "IoT Cluster", 55),
        ("ALT-008", "medium", "Port Scan Activity", "Systematic port scan from Tor exit node", "resolved", "Perimeter FW", 50),
        ("ALT-009", "low", "New Device Connected", "Unrecognized device pending approval", "new", "172.16.5.48", 30),
        ("ALT-010", "low", "Backup Completed", "Full system configuration backup completed", "resolved", "SDN Controller", 10),
    ]
    for aid, sev, title, msg, status, device, conf in rows:
        db.session.add(Alert(alert_id=aid, severity=sev, title=title, message=msg, status=status, device_name=device, ai_confidence=conf))


def _seed_threats() -> None:
    if Threat.query.first():
        return
    rows = [
        ("THR-001", "Botnet C2 Communication", 94, 97, "active", "IoT-Sensor-48", "Block Device"),
        ("THR-002", "Credential Stuffing", 91, 88, "active", "PC-Finance-03", "Quarantine"),
        ("THR-003", "ARP Spoofing Attack", 89, 82, "quarantined", "Edge-SW-03", "Quarantine"),
        ("THR-004", "SQL Injection Probe", 96, 74, "active", "SVR-Web-01", "Investigate"),
        ("THR-005", "Lateral Movement", 85, 71, "active", "PC-DevOps-07", "Investigate"),
        ("THR-006", "Firmware Exploit", 78, 66, "active", "IoT-Camera-12", "Quarantine"),
        ("THR-007", "Phishing Click Detected", 99, 54, "active", "PC-HR-02", "Educate User"),
        ("THR-008", "Port Scan Activity", 87, 41, "blocked", "SVR-DB-02", "Monitor"),
        ("THR-009", "Privilege Escalation Attempt", 72, 35, "safe", "PC-Admin-01", "Monitor"),
    ]
    for tid, cls, conf, risk, status, device, rec in rows:
        db.session.add(Threat(threat_id=tid, threat_classification=cls, ai_confidence=conf, risk_score=risk, status=status, device_name=device, recommendation=rec))


def _seed_incidents() -> None:
    if Incident.query.first():
        return
    db.session.add_all([
        Incident(
            incident_id="INC-2026-0041",
            title="DDoS Attack on Edge Router ER-04",
            severity="P1",
            status="open",
            assigned_to="Unassigned",
            summary="Edge-SW-03 DDoS traffic spike",
            timeline=[
                {"time": "14:23", "action": "Incident created — DDoS traffic spike detected", "actor": "AI Engine"},
                {"time": "14:24", "action": "Automated rate limiting applied", "actor": "SDN Controller"},
            ],
            comments=[{"author": "SOC System", "time": "14:25", "text": "Traffic signature matches Mirai botnet variant."}],
        ),
        Incident(
            incident_id="INC-2026-0040",
            title="Credential Stuffing on Finance Portal",
            severity="P2",
            status="assigned",
            assigned_to="A. Rahman",
            summary="Finance portal brute force",
            timeline=[{"time": "13:58", "action": "550 failed login attempts", "actor": "AI Engine"}],
            comments=[{"author": "A. Rahman", "time": "14:15", "text": "No successful logins confirmed."}],
        ),
    ])


def _seed_audit_logs() -> None:
    if AuditLog.query.first():
        return
    db.session.add_all([
        AuditLog(entity_type="device", entity_id="DEV-004", action="quarantine", actor="k.singh@secnet.ai", details={"reason": "DDoS source"}),
        AuditLog(entity_type="alert", entity_id="ALT-001", action="acknowledge", actor="a.rahman@secnet.ai", details={}),
        AuditLog(entity_type="user", entity_id="k.singh@secnet.ai", action="login", actor="k.singh@secnet.ai", details={"method": "password"}),
    ])


def _seed_blockchain_transactions() -> None:
    if BlockchainTransaction.query.first():
        return
    db.session.add_all([
        BlockchainTransaction(tx_hash="0x7f3a9c2e1b4d8e6f0a2c5b9d3e7f1a4c8b6d2e0", event_type="audit_log", payload={"alert": "ALT-001"}, block_number=47291, verified=True, gas_used=21000),
        BlockchainTransaction(tx_hash="0x3e8f1a2b5c7d9e0f4a6b8c1d3e5f7a9b2c4d6e8", event_type="user_register", payload={"email": "k.singh@secnet.ai"}, block_number=47290, verified=True, gas_used=85000),
    ])


def _seed_settings() -> None:
    if Setting.query.first():
        return
    defaults = {
        "platform_name": "SecureNet AI — SDN Security Platform",
        "organization": "CyberDefense Corp",
        "timezone": "UTC+08:00 (MYT)",
        "refresh_rate": "10 seconds",
        "session_timeout": "30 minutes",
        "network_name": "SecureNet-SDN-01",
        "auto_block": True,
        "ai_detection": True,
        "blockchain": True,
        "mfa_required": True,
    }
    for key, val in defaults.items():
        category = "general" if key in {"platform_name", "organization", "timezone", "refresh_rate", "session_timeout"} else "security"
        stored = val if isinstance(val, dict) else {"value": val}
        db.session.add(Setting(category=category, key=key, value=stored, description=f"Platform setting: {key}"))
