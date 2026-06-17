#!/usr/bin/env python3
"""Seed Supabase / PostgreSQL with demo platform data."""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

from app import create_app
from app.extensions import db
from app.services.seed_data import seed_database


def main(force: bool = False) -> None:
    app = create_app()
    with app.app_context():
        db.create_all()
        seed_database(force=force)
        print("Database seeded successfully.")


if __name__ == "__main__":
    force_flag = "--force" in sys.argv
    main(force=force_flag)
