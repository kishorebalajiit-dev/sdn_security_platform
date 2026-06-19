from __future__ import annotations

from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from sqlalchemy.exc import SQLAlchemyError

from app.config import DevelopmentConfig
from app.extensions import cors, db, jwt, limiter, migrate, socketio
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
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", ["*"]), "supports_credentials": True}},
    )
    socketio.init_app(app)

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
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return fail("Database error", 500, str(error))

    @app.get("/")
    def root():
        return jsonify({"service": "SecureNet AI API", "version": "v1", "status": "running"})

    if app.config.get("AUTO_CREATE_TABLES"):
        with app.app_context():
            try:
                _compile_contract()
                db.create_all()
                if app.config.get("SEED_DATABASE"):
                    from app.services.seed_data import seed_database
                    seed_database()
            except Exception as e:
                import traceback
                traceback.print_exc()

    from app.services.traffic_monitor import init_traffic_monitor
    init_traffic_monitor(app)

    return app


def _compile_contract() -> None:
    import os
    import subprocess
    base_dir = os.path.dirname(os.path.abspath(__file__))
    sol_path = os.path.join(base_dir, "contracts", "SecurityAudit.sol")
    out_dir = os.path.join(base_dir, "contracts")
    try:
        # Check if solc works and compile contract
        if os.path.exists(sol_path):
            print(f"[Solidity] Compiling contract: {sol_path}")
            subprocess.run(["solc", "--bin", "--abi", sol_path, "-o", out_dir, "--overwrite"], check=True)
            print("[Solidity] Contract compiled successfully.")
    except Exception as e:
        print(f"[Solidity] solc compiler command failed or not found: {e}. Using pre-compiled files if available.")

