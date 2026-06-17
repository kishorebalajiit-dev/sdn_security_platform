from __future__ import annotations

import json
from functools import lru_cache

from flask import current_app
from web3 import Web3


@lru_cache()
def get_contract():
    w3 = Web3(Web3.HTTPProvider(current_app.config["GANACHE_URL"]))
    with open(current_app.config["CONTRACT_ABI_PATH"]) as f:
        contract_abi = json.load(f)["abi"]
    contract_address = current_app.config["CONTRACT_ADDRESS"]
    return w3.eth.contract(address=contract_address, abi=contract_abi)

def register_user(wallet_address: str, user_id: str, role: str, authentication_hash: str):
    contract = get_contract()
    w3 = contract.w3
    tx_hash = contract.functions.registerUser(
        w3.to_checksum_address(wallet_address),
        user_id.encode(),
        role,
        authentication_hash.encode()
    ).transact({'from': w3.eth.accounts[0]})
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return receipt

def verify_user(wallet_address: str, authentication_hash: str) -> tuple[bool, str]:
    contract = get_contract()
    verified, role = contract.functions.verifyUser(
        contract.w3.to_checksum_address(wallet_address),
        authentication_hash.encode()
    ).call()
    return verified, role

def register_device(device_id: str, owner_address: str, authentication_hash: str):
    contract = get_contract()
    w3 = contract.w3
    tx_hash = contract.functions.registerDevice(
        device_id.encode(),
        w3.to_checksum_address(owner_address),
        authentication_hash.encode()
    ).transact({'from': w3.eth.accounts[0]})
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return receipt

def verify_device(device_id: str, authentication_hash: str) -> bool:
    contract = get_contract()
    return contract.functions.verifyDevice(
        device_id.encode(),
        authentication_hash.encode()
    ).call()

def create_audit_record(action: str, user_address: str):
    contract = get_contract()
    w3 = contract.w3
    tx_hash = contract.functions.createAuditRecord(action).transact({'from': w3.to_checksum_address(user_address)})
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return receipt

