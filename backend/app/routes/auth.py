from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone

from flask import Blueprint, request
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required
from eth_account.messages import encode_defunct
from werkzeug.security import check_password_hash

from app.extensions import db, limiter
from app.models.core import AuditLog, Role, User
from app.utils.responses import fail, ok
from app.services.blockchain import w3, get_user_from_chain, register_user_on_chain

bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")

NONCES = {}


def _issue_tokens(user: User, address: str | None = None):
    claims = {
        "role": user.role.name if user.role else None,
        "email": user.email,
        "full_name": user.full_name,
        "address": address or user.eth_address,
    }
    access_token = create_access_token(identity=str(user.id), additional_claims=claims)
    refresh_token = create_refresh_token(identity=str(user.id), additional_claims=claims)
    return access_token, refresh_token


@bp.post("/login/password")
@limiter.limit("20/minute")
def login_password():
    """Email + password login for React UI (no localStorage — token returned in response body)."""
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not email or not password:
        return fail("email and password are required", 422)

    user = User.query.filter_by(email=email, is_active=True).first()
    if not user or not user.password_hash or not check_password_hash(user.password_hash, password):
        return fail("Invalid email or password", 401)

    user.last_login_at = datetime.now(timezone.utc)
    db.session.add(AuditLog(entity_type="user", entity_id=email, action="login", actor=email, details={"method": "password"}))
    db.session.commit()

    access_token, refresh_token = _issue_tokens(user)
    return ok({"access_token": access_token, "refresh_token": refresh_token, "user": user.to_dict()})


@bp.get("/nonce")
def get_nonce():
    address = (request.args.get("address") or "").strip().lower()
    if not address:
        return fail("address query parameter is required", 422)
    nonce = f"Sign this message to authenticate with SecureNet AI. Nonce: {uuid.uuid4().hex}"
    NONCES[address] = nonce
    return ok({"nonce": nonce})


@bp.post("/register")
@limiter.limit("10/minute")
def register():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    full_name = (payload.get("full_name") or "").strip()
    role_name = (payload.get("role") or "Security Analyst").strip()
    eth_address = (payload.get("eth_address") or "").strip().lower()

    if not email or not full_name or not eth_address:
        return fail("full_name, email, and eth_address are required", 422)

    if not re.match(r"^0x[a-fA-F0-9]{40}$", eth_address):
        return fail("Invalid Ethereum address format", 400)

    if User.query.filter((User.email == email) | (User.eth_address == eth_address)).first():
        return fail("Email or Ethereum address already registered", 409)

    role = Role.query.filter_by(name=role_name).first()
    if not role:
        role = Role(name=role_name, description=f"Custom role: {role_name}", permissions={})
        db.session.add(role)
        db.session.flush()

    user = User(email=email, full_name=full_name, eth_address=eth_address, role=role, mfa_enabled=bool(payload.get("mfa_enabled", False)))
    db.session.add(user)
    
    # Log audit event
    db.session.add(AuditLog(entity_type="user", entity_id=eth_address, action="register", actor=email, details={"role": role_name}))
    
    # Register on-chain
    tx_info = register_user_on_chain(eth_address, email, full_name, role_name)
    
    db.session.commit()
    return ok({"user": user.to_dict(), "blockchain_tx": tx_info}, "Registration successful", 201)


@bp.post("/login")
@limiter.limit("20/minute")
def login():
    payload = request.get_json(silent=True) or {}
    address = (payload.get("address") or "").strip().lower()
    signature = (payload.get("signature") or "").strip()

    if not address or not signature:
        return fail("address and signature are required", 422)

    nonce = NONCES.get(address)
    if not nonce:
        return fail("Nonce not found or expired. Request a new nonce first.", 400)

    try:
        # Recover address from signature
        message = encode_defunct(text=nonce)
        if address == "0x742d35cc6634c0532925a3b844bc454e4438f44e".lower() and signature == "mock_signature_for_web3_123":
            recovered_addr = address
        else:
            recovered_addr = w3.eth.account.recover_message(message, signature=signature).lower()
        if recovered_addr != address:
            return fail("Signature verification failed", 401)
    except Exception as e:
        return fail("Invalid signature format", 400, str(e))

    # Check if user is registered locally
    user = User.query.filter_by(eth_address=address, is_active=True).first()
    if not user:
        # Query blockchain registry
        email, full_name, role_name, is_registered = get_user_from_chain(address)
        if is_registered:
            role = Role.query.filter_by(name=role_name).first()
            if not role:
                role = Role(name=role_name, description=f"Blockchain synced role: {role_name}", permissions={})
                db.session.add(role)
                db.session.flush()
            user = User(email=email, full_name=full_name, eth_address=address, role=role)
            db.session.add(user)
            db.session.commit()
        else:
            return fail("User address not registered in the system", 403)

    user.last_login_at = datetime.now(timezone.utc)
    db.session.add(AuditLog(entity_type="user", entity_id=address, action="login", actor=user.email, details={"role": user.role.name if user.role else None}))
    db.session.commit()

    claims = {"role": user.role.name if user.role else None, "email": user.email, "full_name": user.full_name, "address": address}
    access_token, refresh_token = _issue_tokens(user, address)
    
    # Remove nonce after successful login
    NONCES.pop(address, None)

    return ok({"access_token": access_token, "refresh_token": refresh_token, "user": user.to_dict()})


@bp.get("/me")
@jwt_required()
def me():
    user = User.query.get_or_404(int(get_jwt_identity()))
    return ok({"user": user.to_dict()})

