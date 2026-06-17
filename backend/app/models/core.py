from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class User(db.Model, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    wallet_address: Mapped[str] = mapped_column(String(42), unique=True, nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "wallet_address": self.wallet_address,
            "created_at": self.created_at.isoformat(),
        }


class Device(db.Model, TimestampMixin):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    device_name: Mapped[str] = mapped_column(String(100), nullable=False)
    mac_address: Mapped[str] = mapped_column(String(17), unique=True, nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(15))
    status: Mapped[str] = mapped_column(String(50), default="pending") # pending, verified, blocked, quarantined
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "device_name": self.device_name,
            "mac_address": self.mac_address,
            "ip_address": self.ip_address,
            "status": self.status,
            "last_seen": self.last_seen.isoformat() if self.last_seen else None,
            "created_at": self.created_at.isoformat(),
        }


class Alert(db.Model, TimestampMixin):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    threat_id: Mapped[int] = mapped_column(ForeignKey("threats.id"))
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str | None] = mapped_column(String(50)) # low, medium, high, critical
    status: Mapped[str] = mapped_column(String(50), default="new") # new, in_progress, resolved

    threat = relationship("Threat")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "threat_id": self.threat_id,
            "description": self.description,
            "severity": self.severity,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }


class Incident(db.Model, TimestampMixin):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    alert_id: Mapped[int] = mapped_column(ForeignKey("alerts.id"))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="open") # open, under_investigation, closed
    assigned_to_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    alert = relationship("Alert")
    assigned_to = relationship("User")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "alert_id": self.alert_id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "assigned_to": self.assigned_to.username if self.assigned_to else None,
            "created_at": self.created_at.isoformat(),
        }


class Threat(db.Model, TimestampMixin):
    __tablename__ = "threats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    threat_type: Mapped[str] = mapped_column(String(100), nullable=False) # DDoS, ARP Spoofing, etc.
    source_ip: Mapped[str | None] = mapped_column(String(15))
    destination_ip: Mapped[str | None] = mapped_column(String(15))
    details: Mapped[dict | None] = mapped_column(JSON)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "threat_type": self.threat_type,
            "source_ip": self.source_ip,
            "destination_ip": self.destination_ip,
            "details": self.details or {},
            "created_at": self.created_at.isoformat(),
        }


class AuditLog(db.Model, TimestampMixin):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    device_id: Mapped[int | None] = mapped_column(ForeignKey("devices.id"))
    details: Mapped[str | None] = mapped_column(Text)
    transaction_hash: Mapped[str | None] = mapped_column(String(66), unique=True)
    block_number: Mapped[int | None] = mapped_column(Integer)

    user = relationship("User")
    device = relationship("Device")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "event_type": self.event_type,
            "user": self.user.username if self.user else None,
            "device": self.device.device_name if self.device else None,
            "details": self.details,
            "transaction_hash": self.transaction_hash,
            "block_number": self.block_number,
            "timestamp": self.created_at.isoformat(),
        }


class NetworkTraffic(db.Model):
    __tablename__ = "network_traffic"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_ip: Mapped[str | None] = mapped_column(String(15))
    destination_ip: Mapped[str | None] = mapped_column(String(15))
    protocol: Mapped[str | None] = mapped_column(String(10))
    port: Mapped[int | None] = mapped_column(Integer)
    packet_size: Mapped[int | None] = mapped_column(Integer)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "source_ip": self.source_ip,
            "destination_ip": self.destination_ip,
            "protocol": self.protocol,
            "port": self.port,
            "packet_size": self.packet_size,
            "timestamp": self.timestamp.isoformat(),
        }


class Setting(db.Model, TimestampMixin):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    setting_key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    setting_value: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "setting_key": self.setting_key,
            "setting_value": self.setting_value,
            "description": self.description,
        }


class Permission(db.Model):
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    resource: Mapped[str] = mapped_column(String(100), nullable=False)
    can_create: Mapped[bool] = mapped_column(Boolean, default=False)
    can_read: Mapped[bool] = mapped_column(Boolean, default=False)
    can_update: Mapped[bool] = mapped_column(Boolean, default=False)
    can_delete: Mapped[bool] = mapped_column(Boolean, default=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "role": self.role,
            "resource": self.resource,
            "can_create": self.can_create,
            "can_read": self.can_read,
            "can_update": self.can_update,
            "can_delete": self.can_delete,
        }


class IocFeed(db.Model, TimestampMixin):
    __tablename__ = "ioc_feeds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    feed_name: Mapped[str | None] = mapped_column(String(100))
    ioc_type: Mapped[str | None] = mapped_column(String(50)) # ip, domain, hash
    value: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    source_url: Mapped[str | None] = mapped_column(Text)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "feed_name": self.feed_name,
            "ioc_type": self.ioc_type,
            "value": self.value,
            "source_url": self.source_url,
            "added_at": self.created_at.isoformat(),
        }
