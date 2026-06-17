import unittest
import json
import os
import sys
from eth_account import Account
from eth_account.messages import encode_defunct

# Adjust python path to import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.extensions import db
from app.models.core import User, Device, Threat, BlockchainTransaction

class SecureNetTestCase(unittest.TestCase):
    def setUp(self):
        # Configure app for testing
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()
        
        self.app_context = self.app.app_context()
        self.app_context.push()
        
        # Build tables and seed roles
        db.create_all()
        from app.__init__ import _seed_defaults
        _seed_defaults()

        # Generate a test Ethereum account
        self.test_account = Account.create()
        self.test_address = self.test_account.address.lower()
        self.test_private_key = self.test_account.key.hex()

        # Seed the test user in DB
        from app.models.core import Role
        admin_role = Role.query.filter_by(name="Admin").first()
        self.user = User(
            email="test.admin@secnet.ai",
            full_name="Test Admin",
            eth_address=self.test_address,
            role=admin_role
        )
        db.session.add(self.user)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_health_endpoint(self):
        res = self.client.get('/api/v1/health')
        data = json.loads(res.data.decode('utf-8'))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(data['data']['status'], 'healthy')

    def test_blockchain_auth_flow(self):
        # 1. Fetch nonce
        res = self.client.get(f'/api/v1/auth/nonce?address={self.test_address}')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data.decode('utf-8'))
        nonce = data['data']['nonce']
        self.assertIn("Sign this message", nonce)

        # 2. Sign nonce using local private key
        message = encode_defunct(text=nonce)
        signed = Account.sign_message(message, private_key=self.test_private_key)
        signature = signed.signature.hex()
        if not signature.startswith("0x"):
            signature = "0x" + signature

        # 3. Post signature to login gateway
        login_res = self.client.post('/api/v1/auth/login', json={
            "address": self.test_address,
            "signature": signature
        })
        self.assertEqual(login_res.status_code, 200)
        login_data = json.loads(login_res.data.decode('utf-8'))
        self.assertIn("access_token", login_data['data'])
        self.assertEqual(login_data['data']['user']['email'], "test.admin@secnet.ai")

    def test_ai_threat_classifier(self):
        from app.services.ai_engine import analyze_signal
        
        # Test DDoS signal log
        result_ddos = analyze_signal("DDoS attack spike detected, packet rate 5.2 Gbps from 10.0.0.5")
        self.assertEqual(result_ddos['threat_classification'], "DDoS")
        self.assertEqual(result_ddos['threat_level'], "Critical")
        
        # Test normal signal log
        result_normal = analyze_signal("Routine host scan baseline check completed")
        self.assertEqual(result_normal['threat_classification'], "Normal Activity")

    def test_device_crud_and_blockchain_logging(self):
        # Get JWT Token for authorization
        res = self.client.get(f'/api/v1/auth/nonce?address={self.test_address}')
        nonce = json.loads(res.data.decode('utf-8'))['data']['nonce']
        message = encode_defunct(text=nonce)
        signature = Account.sign_message(message, private_key=self.test_private_key).signature.hex()
        if not signature.startswith("0x"):
            signature = "0x" + signature
        login_res = self.client.post('/api/v1/auth/login', json={
            "address": self.test_address,
            "signature": signature
        })
        token = json.loads(login_res.data.decode('utf-8'))['data']['access_token']
        headers = {"Authorization": f"Bearer {token}"}

        # Create device
        device_payload = {
            "device_name": "Test Router",
            "device_type": "router",
            "device_id": "DEV-TEST-001",
            "mac_address": "00:11:22:33:44:55",
            "ip_address": "192.168.1.100"
        }
        res_create = self.client.post('/api/v1/devices', json=device_payload, headers=headers)
        self.assertEqual(res_create.status_code, 201)
        
        # Verify it was added to database
        dev = Device.query.filter_by(device_id="DEV-TEST-001").first()
        self.assertIsNotNone(dev)
        self.assertEqual(dev.device_name, "Test Router")

        # Verify a blockchain transaction was created locally
        tx = BlockchainTransaction.query.filter_by(event_type="DeviceRegistration").first()
        self.assertIsNotNone(tx)
        self.assertIn("Test Router", tx.payload.values())

if __name__ == '__main__':
    unittest.main()
