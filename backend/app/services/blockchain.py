from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone


def build_tx_hash(event_type: str, payload: dict) -> str:
    digest = hashlib.sha256(
        f"{event_type}:{json.dumps(payload, sort_keys=True)}:{datetime.now(timezone.utc).isoformat()}".encode("utf-8")
    ).hexdigest()
    return f"0x{digest[:40]}"


def verify_tx_integrity(tx_hash: str, payload: dict) -> bool:
    return bool(tx_hash.startswith("0x")) and bool(payload)
