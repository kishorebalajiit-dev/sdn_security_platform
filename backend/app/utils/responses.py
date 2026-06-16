from __future__ import annotations

from flask import jsonify


def ok(data=None, message: str = "OK", status: int = 200):
    return jsonify({"success": True, "message": message, "data": data}), status


def fail(message: str, status: int = 400, details=None):
    payload = {"success": False, "message": message}
    if details is not None:
        payload["details"] = details
    return jsonify(payload), status
