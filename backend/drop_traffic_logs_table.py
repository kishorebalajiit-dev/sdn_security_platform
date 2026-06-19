import os
from sqlalchemy import create_engine, text
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
import sys

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

def drop_tables_if_exists(db_url: str):
    print(f"Attempting to connect to database: {db_url.split('@')[-1]}") # Print without credentials
    try:
        engine = create_engine(db_url)
        with engine.connect() as connection:
            connection.execute(text("DROP TABLE IF EXISTS traffic_logs CASCADE;"))
            connection.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE;")) # New line
            connection.commit()
        print("Tables 'traffic_logs' and 'alembic_version' dropped successfully (if they existed).")
    except Exception as e:
        print(f"Error dropping tables: {e}")
        sys.exit(1)

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    _db_url = os.getenv("DATABASE_URL")
    if not _db_url:
        print("DATABASE_URL environment variable not set. Cannot drop tables.")
        sys.exit(1)

    final_db_url = normalize_database_url(_db_url)
    drop_tables_if_exists(final_db_url)
