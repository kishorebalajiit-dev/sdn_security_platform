from __future__ import annotations

from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from sqlalchemy.exc import SQLAlchemyError

from app.config import DevelopmentConfig
from app.extensions import cors, db, jwt, limiter, migrate
from app.models.core import (
    Alert,
    AuditLog,
    BlockchainTransaction,
    Device,
    Incident,
    IocFeed,
    NetworkTraffic,
    Permission,
    Role,
    Setting,
    Threat,
    User,
)
from app.routes.admin import bp as admin_bp
from app.routes.auth import bp as auth_bp
from app.routes.core import bp as core_bp
from app.utils.responses import fail


def create_app(config_object: type[DevelopmentConfig] = DevelopmentConfig) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_object)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(auth_bp)
    app.register_blueprint(core_bp)
    app.register_blueprint(admin_bp)

    @app.errorhandler(404)
    def not_found(_):
        return fail("Route not found", 404)

    @app.errorhandler(405)
    def method_not_allowed(_):
        return fail("Method not allowed", 405)

    @app.errorhandler(SQLAlchemyError)
    def handle_db_error(error):
        db.session.rollback()
        return fail("Database error", 500, str(error))

    @app.get("/")
    def root():
        return jsonify({"service": "SecureNet AI API", "version": "v1", "status": "running"})

    if app.config.get("AUTO_CREATE_TABLES"):
        with app.app_context():
            db.create_all()
            _seed_defaults()

    return app


def _seed_defaults() -> None:
    if not Role.query.filter_by(name="Admin").first():
        admin = Role(name="Admin", description="Full platform access", permissions={"all": True})
        analyst = Role(name="Security Analyst", description="Threat analysis and response", permissions={"alerts": ["view", "acknowledge", "resolve"]})
        engineer = Role(name="Network Engineer", description="Network and device operations", permissions={"devices": ["view", "create", "update"]})
        auditor = Role(name="Auditor", description="Read-only compliance role", permissions={"audit": ["view", "export"]})
        db.session.add_all([admin, analyst, engineer, auditor])
    if not Device.query.first():
        db.session.add_all([
            Device(device_name="SDN-Controller-01", device_type="controller", device_id="DEV-001", mac_address="00:1A:2B:3C:4D:5E", ip_address="10.0.0.1", location="Data Center A", owner="Network Team", firmware_version="OpenFlow 1.5", risk_score=0, threat_status="healthy", last_seen="Active"),
            Device(device_name="Core-SW-02", device_type="switch", device_id="DEV-002", mac_address="00:2B:3C:4D:5E:6F", ip_address="10.0.1.2", location="DC Rack B4", owner="Network Team", firmware_version="Cisco IOS 16.9", risk_score=42, threat_status="warning", last_seen="Active"),
        ])
    if not Alert.query.first():
        db.session.add(Alert(alert_id="ALT-001", severity="critical", title="DDoS attack detected", message="Edge router traffic exceeded threshold", status="new", device_name="ER-04", ai_confidence=97))
    if not Threat.query.first():
        db.session.add(Threat(threat_id="THR-001", threat_classification="DDoS", ai_confidence=97, risk_score=99, status="open", device_name="ER-04", recommendation="Block source IP ranges"))
    if not NetworkTraffic.query.first():
        db.session.add_all([
            NetworkTraffic(bucket="1H", inbound=88, outbound=62, anomalies=3, protocol_breakdown={"TCP": 61, "UDP": 31, "ICMP": 8}),
            NetworkTraffic(bucket="6H", inbound=142, outbound=96, anomalies=12, protocol_breakdown={"TCP": 74, "UDP": 20, "ICMP": 6}),
        ])
    if not Setting.query.first():
        db.session.add(Setting(category="general", key="platform_name", value={"value": "SecureNet AI"}, description="Platform name"))
    db.session.commit()
