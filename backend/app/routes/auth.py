from __future__ import annotations

from datetime import datetime, timezone
import hashlib

from flask import Blueprint, request
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db, limiter
from app.models.core import AuditLog, User
from app.services import blockchain
from app.utils.responses import fail, ok

bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")


@bp.post("/register")
@limiter.limit("10/minute")
def register():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""
    role = (payload.get("role") or "Security Analyst").strip()
    wallet_address = (payload.get("wallet_address") or "").strip()

    if not username or not password or not role or not wallet_address:
        return fail("username, password, role, and wallet_address are required", 422)

    if User.query.filter_by(username=username).first():
        return fail("Username already registered", 409)
    
    if User.query.filter_by(wallet_address=wallet_address).first():
        return fail("Wallet address already registered", 409)

    user = User(
        username=username, 
        password_hash=generate_password_hash(password), 
        role=role,
        wallet_address=wallet_address
    )
    db.session.add(user)
    db.session.flush() # To get user.id

    # Blockchain registration
    authentication_hash = hashlib.sha256(password.encode()).hexdigest()
    try:
        receipt = blockchain.register_user(wallet_address, str(user.id), role, authentication_hash)
        db.session.add(AuditLog(event_type="user_registration", user_id=user.id, details=f"User {username} registered on blockchain.", transaction_hash=receipt.transactionHash.hex()))
        db.session.commit()
        return ok({"user": user.to_dict(), "tx_hash": receipt.transactionHash.hex()}, "Registration successful", 201)
    except Exception as e:
        db.session.rollback()
        return fail("Blockchain registration failed", 500, str(e))


@bp.post("/login")
@limiter.limit("20/minute")
def login():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""
    user = User.query.filter_by(username=username).first()

    if not user or not check_password_hash(user.password_hash, password):
        return fail("Invalid credentials", 401)

    # Blockchain verification
    authentication_hash = hashlib.sha256(password.encode()).hexdigest()
    try:
        verified, role_from_chain = blockchain.verify_user(user.wallet_address, authentication_hash)
        if not verified:
            db.session.add(AuditLog(event_type="login_failed", user_id=user.id, details="Blockchain verification failed."))
            db.session.commit()
            return fail("Blockchain verification failed", 401)
        
        if role_from_chain != user.role:
            db.session.add(AuditLog(event_type="login_failed", user_id=user.id, details="Role mismatch between DB and blockchain."))
            db.session.commit()
            return fail("Role mismatch. Please contact admin.", 401)

    except Exception as e:
        return fail("Error during blockchain verification", 500, str(e))

    db.session.add(AuditLog(event_type="login_successful", user_id=user.id, details=f"User {username} logged in successfully."))
    db.session.commit()

    claims = {"role": user.role, "username": user.username}
    access_token = create_access_token(identity=str(user.id), additional_claims=claims)
    refresh_token = create_refresh_token(identity=str(user.id), additional_claims=claims)
    return ok({"access_token": access_token, "refresh_token": refresh_token, "user": user.to_dict()})


@bp.get("/me")
@jwt_required()
def me():
    user = User.query.get_or_404(int(get_jwt_identity()))
    return ok({"user": user.to_dict()})

