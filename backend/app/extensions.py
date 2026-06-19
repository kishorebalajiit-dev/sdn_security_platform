from __future__ import annotations

from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
import os

try:
    from supabase import create_client, Client
except ImportError:
    create_client = None
    Client = object

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address, default_limits=["300 per hour"])
cors = CORS()
socketio = SocketIO(cors_allowed_origins="*", async_mode='threading')

def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = (
        os.getenv("SUPABASE_KEY")
        or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("VITE_SUPABASE_ANON_KEY")
    )
    if not url or not key or create_client is None:
        # Fallback to local simulation if env not set, but real implementation should have these
        return None
    return create_client(url, key)
