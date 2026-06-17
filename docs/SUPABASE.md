# Supabase PostgreSQL Integration

This project uses **Flask + SQLAlchemy** on the backend and **React + Axios** on the frontend. All platform data is stored in **PostgreSQL (Supabase)** — not in browser `localStorage`.

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a project.
2. Open **Project Settings → Database** and copy the **Connection string (URI)**.
3. Use the **Session pooler** URI for server apps (port `6543`) or direct connection (port `5432`).

## 2. Configure Environment

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

Set your Supabase connection string:

```env
DATABASE_URL=postgresql+psycopg2://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
SUPABASE_SSL=1
AUTO_CREATE_TABLES=1
SEED_DATABASE=1
VITE_API_BASE_URL=http://localhost:5000/api/v1
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## 3. Install & Run Backend

```bash
cd backend
pip install -r requirements.txt
python wsgi.py
```

On startup Flask will:
- Connect to Supabase PostgreSQL
- Create all tables via SQLAlchemy (`db.create_all()`)
- Seed demo data (users, devices, alerts, threats, incidents, audit logs, blockchain txs, settings)

### Manual seed (optional)

```bash
python backend/scripts/seed_supabase.py
python backend/scripts/seed_supabase.py --force   # re-seed if tables already have data
```

## 4. Run Frontend

```bash
npm install
npm run dev
```

## Database Tables

| Table | Description |
|-------|-------------|
| `users` | Platform users with roles & password hashes |
| `devices` | SDN / network devices |
| `alerts` | Security alerts |
| `incidents` | SOC incidents |
| `threats` | AI-detected threats |
| `audit_logs` | Immutable audit trail |
| `blockchain_transactions` | On-chain event mirror |
| `settings` | Platform configuration |

Reference SQL: `backend/supabase_schema.sql`

## API Endpoints (CRUD)

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /auth/login/password`, `POST /auth/login`, `GET /auth/me` |
| Devices | `GET/POST /devices`, `PUT/DELETE /devices/:id`, `POST /devices/:id/block` |
| Alerts | `GET /alerts`, `POST /alerts/:id/acknowledge`, `POST /alerts/:id/resolve` |
| Incidents | `GET/POST /incidents`, `PUT /incidents/:id` |
| Threats | `GET /threats`, `PUT /threats/:id` |
| Users | `GET/POST /admin/users`, `PUT/DELETE /admin/users/:id` |
| Settings | `GET/PUT /settings/bundle` |
| Audit | `GET /audit-logs` |
| Blockchain | `GET /blockchain/transactions` |

## Demo Login Credentials

| Email | Password | Role |
|-------|----------|------|
| k.singh@secnet.ai | admin123 | Admin |
| a.rahman@secnet.ai | analyst123 | Security Analyst |
| s.ivanova@secnet.ai | engineer123 | Network Engineer |
| p.nair@secnet.ai | auditor123 | Auditor |

Wallet-based login is also supported via `POST /auth/login` (signature flow).

## Frontend Data Flow

```
React UI → Axios (src/api/client.ts) → Flask API → SQLAlchemy → Supabase PostgreSQL
```

- **No localStorage** — auth session uses in-memory + `sessionStorage` only (`src/lib/authSession.ts`)
- **AppDataContext** loads all modules from REST APIs
- **Settings** loads/saves via `GET/PUT /settings/bundle`

## Folder Structure

```
backend/
  app/
    models/core.py          # SQLAlchemy models
    routes/auth.py          # Authentication
    routes/core.py          # CRUD APIs
    routes/admin.py         # User admin
    services/seed_data.py   # PostgreSQL seed/migration
  scripts/seed_supabase.py
  supabase_schema.sql
src/
  api/client.ts             # Axios instance
  api/services.ts           # Typed API helpers
  lib/authSession.ts        # Session (no localStorage)
  contexts/AppDataContext.tsx
  contexts/AuthContext.tsx
```
