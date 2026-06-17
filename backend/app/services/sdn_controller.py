from __future__ import annotations

import requests
from flask import current_app


def get_ryu_url() -> str:
    return current_app.config["RYU_CONTROLLER_URL"]


def allow_device(mac_address: str):
    url = f"{get_ryu_url()}/sdn/allow"
    try:
        response = requests.post(url, json={"mac_address": mac_address})
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Error allowing device {mac_address}: {e}")
        return None


def block_device(mac_address: str):
    url = f"{get_ryu_url()}/sdn/block"
    try:
        response = requests.post(url, json={"mac_address": mac_address})
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Error blocking device {mac_address}: {e}")
        return None


def quarantine_device(mac_address: str):
    url = f"{get_ryu_url()}/sdn/quarantine"
    try:
        response = requests.post(url, json={"mac_address": mac_address})
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Error quarantining device {mac_address}: {e}")
        return None
