from __future__ import annotations

from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe

from flask import Blueprint, request
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db, limiter
from app.models.core import AuditLog, Role, User
from app.utils.responses import fail, ok

bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")


@bp.post("/register")
@limiter.limit("10/minute")
def register():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    full_name = (payload.get("full_name") or "").strip()
    role_name = (payload.get("role") or "Security Analyst").strip()

    if not email or not password or not full_name:
        return fail("full_name, email, and password are required", 422)

    if User.query.filter_by(email=email).first():
        return fail("Email already registered", 409)

    role = Role.query.filter_by(name=role_name).first()
    if not role:
        role = Role(name=role_name, description=f"Custom role: {role_name}", permissions={})
        db.session.add(role)
        db.session.flush()

    user = User(email=email, full_name=full_name, password_hash=generate_password_hash(password), role=role, mfa_enabled=bool(payload.get("mfa_enabled", False)))
    db.session.add(user)
    db.session.add(AuditLog(entity_type="user", entity_id=email, action="register", actor=email, details={"role": role_name}))
    db.session.commit()
    return ok({"user": user.to_dict()}, "Registration successful", 201)


@bp.post("/login")
@limiter.limit("20/minute")
def login():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    user = User.query.filter_by(email=email, is_active=True).first()
    if not user or not check_password_hash(user.password_hash, password):
        return fail("Invalid credentials", 401)

    user.last_login_at = datetime.now(timezone.utc)
    db.session.add(AuditLog(entity_type="user", entity_id=email, action="login", actor=email, details={"role": user.role.name if user.role else None}))
    db.session.commit()

    claims = {"role": user.role.name if user.role else None, "email": user.email, "full_name": user.full_name}
    access_token = create_access_token(identity=str(user.id), additional_claims=claims)
    refresh_token = create_refresh_token(identity=str(user.id), additional_claims=claims)
    return ok({"access_token": access_token, "refresh_token": refresh_token, "user": user.to_dict()})


@bp.post("/forgot-password")
@limiter.limit("10/minute")
def forgot_password():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user:
        return ok({"sent": True})
    token = token_urlsafe(24)
    user.reset_token = token
    user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    db.session.add(AuditLog(entity_type="user", entity_id=email, action="forgot_password", actor=email, details={"token_issued": True}))
    db.session.commit()
    return ok({"sent": True, "reset_token": token}, "Reset token generated")


@bp.post("/reset-password")
@limiter.limit("10/minute")
def reset_password():
    payload = request.get_json(silent=True) or {}
    token = payload.get("token") or ""
    password = payload.get("password") or ""
    if not token or not password:
        return fail("token and password are required", 422)
    user = User.query.filter_by(reset_token=token).first()
    if not user or not user.reset_token_expires_at or user.reset_token_expires_at < datetime.now(timezone.utc):
        return fail("Reset token is invalid or expired", 400)
    user.password_hash = generate_password_hash(password)
    user.reset_token = None
    user.reset_token_expires_at = None
    db.session.add(AuditLog(entity_type="user", entity_id=user.email, action="reset_password", actor=user.email, details={}))
    db.session.commit()
    return ok({"reset": True}, "Password updated")


@bp.get("/me")
@jwt_required()
def me():
    from flask_jwt_extended import get_jwt_identity

    user = User.query.get_or_404(int(get_jwt_identity()))
    return ok({"user": user.to_dict()})
