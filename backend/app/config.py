from __future__ import annotations

import os
from datetime import timedelta
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse


def normalize_database_url(url: str) -> str:
    """Normalize Supabase / Postgres URLs for SQLAlchemy + psycopg2."""
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif url.startswith("postgresql://") and "+psycopg2" not in url:
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)

    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    if "supabase" in parsed.hostname or os.getenv("SUPABASE_SSL", "1") == "1":
        query.setdefault("sslmode", "require")
    new_query = urlencode(query)
    return urlunparse(parsed._replace(query=new_query))


class BaseConfig:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv("JWT_ACCESS_MINUTES", "480")))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_REFRESH_DAYS", "14")))
    JWT_TOKEN_LOCATION = ["headers"]
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    _db_url = os.getenv("DATABASE_URL")
    if _db_url and "postgresql" in _db_url:
        try:
            import psycopg2  # noqa: F401
            _db_url = normalize_database_url(_db_url)
        except ImportError:
            print("[Config] WARNING: postgresql requested but psycopg2 is not installed. Falling back to SQLite.")
            _db_url = "sqlite:///securenet_ai.db"
    if not _db_url:
        _db_url = "sqlite:///securenet_ai.db"

    SQLALCHEMY_DATABASE_URI = _db_url

    if "postgresql" in _db_url:
        SQLALCHEMY_ENGINE_OPTIONS = {
            "pool_pre_ping": True,
            "pool_recycle": 300,
            "pool_size": int(os.getenv("DB_POOL_SIZE", "5")),
            "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "10")),
        }
    else:
        SQLALCHEMY_ENGINE_OPTIONS = {
            "connect_args": {"timeout": 30},
        }

    JSON_SORT_KEYS = False
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")
    AUTO_CREATE_TABLES = os.getenv("AUTO_CREATE_TABLES", "1") == "1"
    SEED_DATABASE = os.getenv("SEED_DATABASE", "1") == "1"

    CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]

    GANACHE_URL = os.getenv("GANACHE_URL", "http://127.0.0.1:7545")
    CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "")
    CONTRACT_ABI_PATH = os.getenv("CONTRACT_ABI_PATH", "contracts/SecurityContract.json")
    RYU_CONTROLLER_URL = os.getenv("RYU_CONTROLLER_URL", "http://127.0.0.1:8080")


class DevelopmentConfig(BaseConfig):
    DEBUG = True


class ProductionConfig(BaseConfig):
    DEBUG = False
