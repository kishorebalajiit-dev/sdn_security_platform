from __future__ import annotations

from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.security import generate_password_hash

from app.config import DevelopmentConfig
from app.extensions import cors, db, jwt, limiter, migrate
from app.models.core import (
    Alert,
    AuditLog,
    Device,
    Incident,
    IocFeed,
    NetworkTraffic,
    Permission,
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
    if not User.query.filter_by(username="admin").first():
        admin = User(username="admin", password_hash=generate_password_hash("admin"), role="Admin", wallet_address="0x...")
        db.session.add(admin)
    
    if not Permission.query.first():
        db.session.add_all([
            Permission(role="Admin", resource="*", can_create=True, can_read=True, can_update=True, can_delete=True),
            Permission(role="Security Analyst", resource="alerts", can_read=True, can_update=True),
            Permission(role="Network Engineer", resource="devices", can_create=True, can_read=True, can_update=True),
            Permission(role="Auditor", resource="audit_logs", can_read=True),
        ])

    if not Device.query.first():
        db.session.add_all([
            Device(device_name="SDN-Controller-01", mac_address="00:1A:2B:3C:4D:5E", ip_address="10.0.0.1", status="verified"),
            Device(device_name="Core-SW-02", mac_address="00:2B:3C:4D:5E:6F", ip_address="10.0.1.2", status="verified"),
        ])
    
    if not Setting.query.first():
        db.session.add(Setting(setting_key="platform_name", setting_value="SecureNet AI", description="Platform name"))
        
    db.session.commit()
