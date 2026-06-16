from __future__ import annotations

from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models.core import Permission, Role, User
from app.utils.decorators import requires_roles
from app.utils.responses import ok

bp = Blueprint("admin", __name__, url_prefix="/api/v1/admin")


@bp.get("/users")
@requires_roles("Admin")
def list_users():
    return ok({"items": [user.to_dict() for user in User.query.order_by(User.created_at.desc()).all()]})


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
