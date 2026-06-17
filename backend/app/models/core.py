from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from app.extensions import db


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class Role(db.Model, TimestampMixin):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    permissions: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    users = relationship("User", back_populates="role")

    def to_dict(self) -> dict:
        return {"id": self.id, "name": self.name, "description": self.description, "permissions": self.permissions or {}}


class User(db.Model, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    eth_address: Mapped[str | None] = mapped_column(String(42), unique=True, nullable=True, index=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reset_token: Mapped[str | None] = mapped_column(String(255))
    reset_token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    role = relationship("Role", back_populates="users")

    @validates("eth_address")
    def validate_eth_address(self, key, address):
        if address is None or address == "":
            return None
        import re
        if not re.match(r"^0x[a-fA-F0-9]{40}$", address):
            raise ValueError("Invalid Ethereum address format")
        return address

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role.name if self.role else None,
            "eth_address": self.eth_address,
            "is_active": self.is_active,
            "mfa_enabled": self.mfa_enabled,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
        }


class Device(db.Model, TimestampMixin):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    device_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    device_type: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    device_id: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    mac_address: Mapped[str] = mapped_column(String(32), nullable=False)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False, index=True)
    location: Mapped[str | None] = mapped_column(String(255))
    owner: Mapped[str | None] = mapped_column(String(255))
    firmware_version: Mapped[str | None] = mapped_column(String(120))
    risk_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    threat_status: Mapped[str] = mapped_column(String(80), default="healthy", nullable=False)
    last_seen: Mapped[str | None] = mapped_column(String(120))
    extra_data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    @validates("ip_address")
    def validate_ip_address(self, key, ip):
        import re
        # Allow ipv4, ipv6 and subnets
        ipv4_pattern = r"^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(/\d+)?$"
        if not re.match(ipv4_pattern, ip):
            if not (":" in ip or ip == "localhost"):
                raise ValueError("Invalid IP address format")
        return ip

    @validates("mac_address")
    def validate_mac_address(self, key, mac):
        import re
        mac_pattern = r"^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"
        if not re.match(mac_pattern, mac):
            raise ValueError("Invalid MAC address format")
        return mac

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "device_name": self.device_name,
            "device_type": self.device_type,
            "device_id": self.device_id,
            "mac_address": self.mac_address,
            "ip_address": self.ip_address,
            "location": self.location,
            "owner": self.owner,
            "firmware_version": self.firmware_version,
            "risk_score": self.risk_score,
            "threat_status": self.threat_status,
            "last_seen": self.last_seen,
            "metadata": self.extra_data or {},
        }


class Alert(db.Model, TimestampMixin):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    alert_id: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="new", nullable=False, index=True)
    device_name: Mapped[str | None] = mapped_column(String(255))
    ai_confidence: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    assigned_to: Mapped[str | None] = mapped_column(String(255))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "alert_id": self.alert_id,
            "severity": self.severity,
            "title": self.title,
            "message": self.message,
            "status": self.status,
            "device_name": self.device_name,
            "ai_confidence": self.ai_confidence,
            "assigned_to": self.assigned_to,
        }


class Incident(db.Model, TimestampMixin):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    incident_id: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="open", nullable=False)
    assigned_to: Mapped[str | None] = mapped_column(String(255))
    timeline: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    comments: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "incident_id": self.incident_id,
            "title": self.title,
            "severity": self.severity,
            "status": self.status,
            "assigned_to": self.assigned_to,
            "timeline": self.timeline or [],
            "comments": self.comments or [],
            "summary": self.summary,
        }


class Threat(db.Model, TimestampMixin):
    __tablename__ = "threats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    threat_id: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    threat_classification: Mapped[str] = mapped_column(String(120), nullable=False)
    ai_confidence: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    risk_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="open", nullable=False)
    device_name: Mapped[str | None] = mapped_column(String(255))
    recommendation: Mapped[str | None] = mapped_column(Text)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "threat_id": self.threat_id,
            "threat_classification": self.threat_classification,
            "ai_confidence": self.ai_confidence,
            "risk_score": self.risk_score,
            "status": self.status,
            "device_name": self.device_name,
            "recommendation": self.recommendation,
        }


class AuditLog(db.Model, TimestampMixin):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    entity_id: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    actor: Mapped[str | None] = mapped_column(String(255))
    details: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "action": self.action,
            "actor": self.actor,
            "details": self.details or {},
            "created_at": self.created_at.isoformat(),
        }


class BlockchainTransaction(db.Model, TimestampMixin):
    __tablename__ = "blockchain_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tx_hash: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    block_number: Mapped[int | None] = mapped_column(Integer)
    verified: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    gas_used: Mapped[int | None] = mapped_column(Integer)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "tx_hash": self.tx_hash,
            "event_type": self.event_type,
            "payload": self.payload or {},
            "block_number": self.block_number,
            "verified": self.verified,
            "gas_used": self.gas_used,
        }


class NetworkTraffic(db.Model, TimestampMixin):
    __tablename__ = "network_traffic"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    bucket: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    inbound: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    outbound: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    anomalies: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    protocol_breakdown: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "bucket": self.bucket,
            "inbound": self.inbound,
            "outbound": self.outbound,
            "anomalies": self.anomalies,
            "protocol_breakdown": self.protocol_breakdown or {},
        }


class Setting(db.Model, TimestampMixin):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    key: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    value: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "category": self.category,
            "key": self.key,
            "value": self.value or {},
            "description": self.description,
        }


class Permission(db.Model, TimestampMixin):
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    role_name: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    resource: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    allowed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    def to_dict(self) -> dict:
        return {"id": self.id, "role_name": self.role_name, "action": self.action, "resource": self.resource, "allowed": self.allowed}


class IocFeed(db.Model, TimestampMixin):
    __tablename__ = "ioc_feeds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ioc_value: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    ioc_type: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    source: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(30), default="active", nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "ioc_value": self.ioc_value,
            "ioc_type": self.ioc_type,
            "severity": self.severity,
            "source": self.source,
            "status": self.status,
        }
