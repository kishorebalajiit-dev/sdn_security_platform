from __future__ import annotations

import os
from datetime import timedelta


class BaseConfig:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv("JWT_ACCESS_MINUTES", "30")))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_REFRESH_DAYS", "14")))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@localhost/securenet_ai",
    )
    JSON_SORT_KEYS = False
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")
    AUTO_CREATE_TABLES = os.getenv("AUTO_CREATE_TABLES", "1") == "1"

    # Blockchain settings
    GANACHE_URL = os.getenv("GANACHE_URL", "http://127.0.0.1:7545")
    CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "")
    CONTRACT_ABI_PATH = os.getenv("CONTRACT_ABI_PATH", "contracts/SecurityContract.json")

    # Ryu Controller settings
    RYU_CONTROLLER_URL = os.getenv("RYU_CONTROLLER_URL", "http://127.0.0.1:8080")



class DevelopmentConfig(BaseConfig):
    DEBUG = True


class ProductionConfig(BaseConfig):
    DEBUG = False
