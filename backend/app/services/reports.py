from __future__ import annotations

from io import BytesIO


def build_pdf_report_bytes(title: str, sections: list[tuple[str, str]]) -> bytes:
    content = [title, "\n"]
    for header, body in sections:
        content.append(f"{header}\n{body}\n")
    return "\n".join(content).encode("utf-8")


def build_csv_bytes(rows: list[dict]) -> bytes:
    if not rows:
        return b""
    headers = list(rows[0].keys())
    lines = [",".join(headers)]
    for row in rows:
        lines.append(",".join(str(row.get(header, "")) for header in headers))
    return "\n".join(lines).encode("utf-8")


def build_json_bytes(payload: dict) -> bytes:
    import json

    return json.dumps(payload, indent=2, default=str).encode("utf-8")
