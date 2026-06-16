from __future__ import annotations

THREAT_RULES = [
    ("ddos", "DDoS", "Critical", "Block source IP ranges and enable rate limiting"),
    ("scan", "Port Scanning", "High", "Isolate scanner and tighten ACLs"),
    ("arp", "ARP Spoofing", "High", "Quarantine device and refresh ARP tables"),
    ("brute force", "Brute Force", "High", "Enforce MFA and temporarily lock account"),
    ("unauthorized", "Unauthorized Access", "Critical", "Revoke access and investigate identity compromise"),
]


def analyze_signal(signal: str) -> dict:
    text = signal.lower()
    for needle, classification, level, recommendation in THREAT_RULES:
        if needle in text:
            confidence = 95 if level == "Critical" else 88
            return {
                "threat_classification": classification,
                "threat_level": level,
                "confidence_score": confidence,
                "recommendation": recommendation,
            }
    return {
        "threat_classification": "Normal Activity",
        "threat_level": "Low",
        "confidence_score": 72,
        "recommendation": "Continue monitoring and log for baseline analysis",
    }
