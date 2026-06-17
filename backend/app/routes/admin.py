from __future__ import annotations

from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models.core import Permission, Role, User, AuditLog, BlockchainTransaction
from app.utils.decorators import requires_roles
from app.utils.responses import ok, fail

bp = Blueprint("admin", __name__, url_prefix="/api/v1/admin")


@bp.get("/users")
@requires_roles("Admin")
def list_users():
    return ok({"items": [user.to_dict() for user in User.query.order_by(User.created_at.desc()).all()]})


@bp.post("/users")
@requires_roles("Admin")
def create_user():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    full_name = (payload.get("full_name") or "").strip()
    role_name = (payload.get("role") or "Security Analyst").strip()
    eth_address = (payload.get("eth_address") or "").strip().lower()

    if not email or not full_name or not eth_address:
        return fail("full_name, email, and eth_address are required", 422)

    import re
    if not re.match(r"^0x[a-fA-F0-9]{40}$", eth_address):
        return fail("Invalid Ethereum address format", 400)

    if User.query.filter((User.email == email) | (User.eth_address == eth_address)).first():
        return fail("Email or Ethereum address already registered", 409)

    role = Role.query.filter_by(name=role_name).first()
    if not role:
        role = Role(name=role_name, description=f"Custom role: {role_name}", permissions={})
        db.session.add(role)
        db.session.flush()

    user = User(email=email, full_name=full_name, eth_address=eth_address, role=role)
    db.session.add(user)
    
    # Audit log
    db.session.add(AuditLog(entity_type="user", entity_id=eth_address, action="create_user", actor=request.args.get("actor", "Admin"), details=user.to_dict()))
    
    # Register on blockchain
    from app.services.blockchain import register_user_on_chain
    tx_info = register_user_on_chain(eth_address, email, full_name, role_name)
    
    # Save tx log
    tx = BlockchainTransaction(
        tx_hash=tx_info["tx_hash"],
        event_type="UserRegistration",
        payload=user.to_dict(),
        block_number=tx_info["block_number"],
        gas_used=tx_info["gas_used"],
        verified=True
    )
    db.session.add(tx)
    
    db.session.commit()
    return ok({"user": user.to_dict(), "blockchain_tx": tx_info}, "User created and registered on-chain", 201)


@bp.put("/users/<int:user_pk>")
@requires_roles("Admin")
def update_user(user_pk: int):
    user = User.query.get_or_404(user_pk)
    payload = request.get_json(silent=True) or {}
    
    if "full_name" in payload:
        user.full_name = payload["full_name"]
    if "role" in payload:
        role_name = payload["role"]
        role = Role.query.filter_by(name=role_name).first()
        if role:
            user.role = role
    if "is_active" in payload:
        user.is_active = bool(payload["is_active"])
        
    db.session.add(AuditLog(entity_type="user", entity_id=user.eth_address or user.email, action="update_user", actor=request.args.get("actor", "Admin"), details=payload))
    db.session.commit()
    return ok({"user": user.to_dict()}, "User updated")


@bp.delete("/users/<int:user_pk>")
@requires_roles("Admin")
def delete_user(user_pk: int):
    user = User.query.get_or_404(user_pk)
    db.session.add(AuditLog(entity_type="user", entity_id=user.eth_address or user.email, action="delete_user", actor=request.args.get("actor", "Admin"), details=user.to_dict()))
    db.session.delete(user)
    db.session.commit()
    return ok(None, "User deleted")


@bp.post("/roles")
@requires_roles("Admin")
def create_role():
    payload = request.get_json(silent=True) or {}
    role = Role(name=payload.get("name", ""), description=payload.get("description"), permissions=payload.get("permissions", {}))
    db.session.add(role)
    db.session.commit()
    return ok({"role": role.to_dict()}, "Role created", 201)


@bp.get("/permissions")
@jwt_required()
def list_permissions():
    return ok({"items": [permission.to_dict() for permission in Permission.query.order_by(Permission.role_name.asc()).all()]})
