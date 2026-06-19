# Supabase PostgreSQL Integration

This project uses Flask + SQLAlchemy on the backend and React + Axios on the frontend. Platform data is stored in PostgreSQL on Supabase.

## 1. Create Supabase Project

1. Go to https://supabase.com and create a project.
2. Open Project Settings > Database and copy the connection string.
3. Use direct connection on port `5432`, or the session pooler URI if your Supabase project provides one.
4. Copy the project URL and API keys from Project Settings > API.

## 2. Configure Environment

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

Set your Supabase values:

```env
DATABASE_URL=postgresql+psycopg2://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[your publishable key]
SUPABASE_SERVICE_ROLE_KEY=[your secret key]
SUPABASE_SSL=1
VITE_API_BASE_URL=http://localhost:5000/api/v1
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
AUTO_CREATE_TABLES=1
SEED_DATABASE=1
RATELIMIT_STORAGE_URI=memory://
```

`SUPABASE_SERVICE_ROLE_KEY` is used by the backend. `VITE_SUPABASE_ANON_KEY` is available for frontend features that need the public Supabase key.

## 3. Install And Run Backend

```bash
cd backend
pip install -r requirements.txt
python wsgi.py
```

On startup Flask will connect to Supabase PostgreSQL, create tables with SQLAlchemy, and seed demo data when `SEED_DATABASE=1`.

Manual seed:

```bash
python backend/scripts/seed_supabase.py
python backend/scripts/seed_supabase.py --force
```

## 4. Run Frontend

```bash
npm install
npm run dev
```

## Demo Login Credentials

| Email | Password | Role |
|-------|----------|------|
| k.singh@secnet.ai | admin123 | Admin |
| a.rahman@secnet.ai | analyst123 | Security Analyst |
| s.ivanova@secnet.ai | engineer123 | Network Engineer |
| p.nair@secnet.ai | auditor123 | Auditor |

## Frontend Data Flow

```text
React UI -> Axios -> Flask API -> SQLAlchemy -> Supabase PostgreSQL
```

Relevant files:

- `src/api/client.ts`
- `backend/wsgi.py`
- `backend/app/config.py`
- `backend/app/extensions.py`
- `backend/app/services/seed_data.py`
