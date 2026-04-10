# Healynx

Healynx is a role-based medical records platform built for hospitals, doctors, and internal administrators. It combines encrypted patient data, hospital-mediated access control, pending medical-entry approvals, audit logging, attachment uploads, and an AI-assisted patient Q&A workflow.

The repository is split into a FastAPI backend and a React + Vite frontend. The current codebase is optimized around four operational roles:

- `master`: creates and manages admin accounts
- `admin`: approves hospitals and doctors, manages the patient registry
- `hospital`: approves doctor join requests, patient access requests, pending medical entries, and patient profile updates
- `doctor`: joins a hospital, requests patient access, reviews approved records, submits pending entries, uploads attachments, and uses the AI assistant

## Product Overview

Healynx is designed around controlled, auditable access to sensitive medical data.

- Patient identity and contact data are encrypted at the application layer.
- Access to patient records is granted through hospital approval, not direct doctor self-access.
- Doctors submit new medical information as pending records that hospitals approve or decline.
- Patient access is time limited, with separate windows for viewing records and creating entries.
- Audit logs, CSRF protection, refresh-token rotation, role checks, and simple rate limiting are part of the backend flow.

## Core Workflows

### 1. Master and admin management

- A seeded master account can log in and create admin users.
- Master users can list, search, update, block, unblock, and delete admins.

### 2. Hospital and doctor onboarding

- Hospitals can register through the public frontend flow.
- Doctors can register through the public frontend flow.
- Admins review and approve or reject hospital and doctor requests.

### 3. Doctor-to-hospital relationship

- Approved doctors can join a hospital.
- Hospitals review doctor join requests and approve or decline them.
- Hospitals can remove doctors from their hospital mapping.

### 4. Patient registry and controlled access

- Admins create and update patient master records.
- Doctors request access to a patient by Aadhaar number.
- Hospitals approve or decline those access requests.
- Doctors receive time-limited access to read patient data and submit medical updates.

### 5. Medical history and pending entries

- Doctors can create pending records for:
  - `visit`
  - `surgery`
  - `allergy`
  - `lab`
  - `immunization`
  - `long_term_condition`
- Hospitals review pending entries and approve or decline them.
- Approved entries become part of the patient's medical history.
- Doctors can edit or re-request declined or expired pending entries.

### 6. Patient profile updates

- Doctors can request updates to selected patient profile fields.
- Hospitals approve or decline those profile update requests.

### 7. Attachments and AI assistance

- Doctors can request MinIO presigned upload URLs and register uploaded attachments.
- Doctors can ask AI questions about a patient's history using the Groq-backed clinical assistant endpoint.

## Tech Stack

### Backend

- FastAPI
- Uvicorn
- SQLModel / SQLAlchemy
- PostgreSQL
- Redis
- MinIO
- Alembic
- Argon2 password hashing
- RS256 JWT authentication
- AES-GCM field encryption
- Groq API for AI responses

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- Axios
- Tailwind CSS
- Radix UI
- React Hook Form
- Zod

## Repository Layout

```text
Healynx/
|-- backend/
|   |-- app/
|   |   |-- api/v1/           # Auth, role routes, medical endpoints, attachments
|   |   |-- core/             # Security, crypto, RBAC, rate limiting, validators
|   |   |-- db/               # Engine, session, models, CRUD, medical history logic
|   |   |-- services/         # MinIO service, AI service
|   |   `-- tasks/            # Cleanup jobs
|   |-- alembic/
|   |-- scripts/              # Seed and maintenance scripts
|   |-- Dockerfile
|   |-- docker-compose.yml
|   |-- requirements.txt
|   `-- .env.example
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- contexts/
|   |   |-- pages/
|   |   `-- services/
|   |-- package.json
|   `-- vite.config.ts
`-- README.md
```

## Architecture Summary

### Backend responsibilities

- Handles authentication and role-based authorization
- Encrypts sensitive patient and identity fields
- Stores application data in PostgreSQL
- Uses Redis for supporting backend flows
- Uses MinIO for attachment upload and retrieval
- Exposes REST APIs for dashboards, registration, approvals, records, and AI queries

### Frontend responsibilities

- Provides role-specific login and dashboard flows
- Calls backend APIs with cookie-based authentication
- Stores CSRF tokens in memory from response headers
- Refreshes sessions automatically on `401` responses
- Guides hospital and doctor users through approval-based workflows

## Access Model

The medical-access model is one of the most important parts of the system.

1. A doctor requests patient access using the patient's Aadhaar number.
2. The hospital reviews and approves or declines the request.
3. When approved, the backend creates a patient access session.
4. Doctors can read patient data only while the view-access window is active.
5. Doctors can add pending entries only while the entry-access window is active.
6. Hospitals approve or decline those pending entries before they become part of the official history.

The code comments indicate:

- view access is designed around a short window, documented in the backend as `30 min`
- entry access is designed around a longer window, documented in the backend as `24 hours`
- doctor dashboard session creation also has a configurable `DOCTOR_SESSION_MINUTES` value

## Security Design

The codebase already includes several good security foundations:

- Sensitive fields are encrypted before storage.
- Aadhaar, phone, and email hashes are used for lookup and dedup-related workflows.
- Passwords are hashed with Argon2.
- Access tokens are RS256 JWTs stored in HttpOnly cookies.
- Refresh tokens are rotated and stored hashed in the database.
- CSRF protection is enforced for state-changing routes.
- Role-based access checks gate protected routes.
- Audit logging is wired into key medical and approval actions.
- Login and validation rate-limiting logic is present in the backend.

## Prerequisites

For local development, use:

- Python `3.11+`
- Node.js `18+`
- npm `9+`
- Docker Desktop or local installs of:
  - PostgreSQL 15
  - Redis 7
  - MinIO

## Environment Variables

### Backend

Create `backend/.env` from `backend/.env.example` and fill in the values below.

| Variable | Required | Purpose |
| --- | --- | --- |
| `ENV` | Recommended | App environment label |
| `FRONTEND_URL` | Recommended | Intended frontend origin, but note the caveat below |
| `COOKIE_SECURE` | Recommended | Intended cookie-security toggle, but note the caveat below |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `APP_ENC_KEY` | Yes | Base64-encoded 32-byte key used for AES-GCM field encryption |
| `AADHAAR_PEPPER` | Yes | Pepper used when hashing Aadhaar values |
| `JWT_ALGORITHM` | Optional | Defaults to `RS256` |
| `ACCESS_TOKEN_MINUTES` | Optional | Access-token lifetime |
| `REFRESH_TOKEN_DAYS` | Optional | Refresh-token lifetime |
| `JWT_RS256_PRIVATE_KEY` | Yes | RS256 private key in PEM format |
| `JWT_RS256_PUBLIC_KEY` | Yes | RS256 public key in PEM format |
| `MINIO_ENDPOINT` | Yes | MinIO host and port |
| `MINIO_ACCESS_KEY` | Yes | MinIO access key |
| `MINIO_SECRET_KEY` | Yes | MinIO secret key |
| `MINIO_BUCKET` | Yes | Bucket name used for attachments |
| `REDIS_URL` | Yes | Redis connection URL |
| `DOCTOR_SESSION_MINUTES` | Optional | Session length for doctor-session token creation |
| `GROQ_API_KEY` | Optional for core app, required for AI chat | Groq API key |
| `GROQ_MODEL` | Optional | Groq model name, defaults to `llama3-70b-8192` |

Generate `APP_ENC_KEY` in PowerShell with:

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

### Frontend

Create `frontend/.env` with:

```env
VITE_API_BASE=http://127.0.0.1:8000
```

Without `VITE_API_BASE`, the frontend defaults to the deployed backend URL in code.

## Local Setup

### Option A: Run infra in Docker, backend and frontend locally

This is the easiest way to work on the codebase during development.

#### 1. Start backend infrastructure

From [`backend/docker-compose.yml`](/C:/Healynx/Healynx/backend/docker-compose.yml):

```powershell
cd backend
docker compose up -d postgres redis minio
```

This starts:

- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- MinIO API on `localhost:9000`

#### 2. Configure backend env

```powershell
cd backend
Copy-Item .env.example .env
```

Edit `backend/.env` with your real values.

#### 3. Install backend dependencies

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

#### 4. Run the backend

```powershell
cd backend
.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The FastAPI app is available at:

- API root: `http://127.0.0.1:8000/`
- Swagger docs: `http://127.0.0.1:8000/docs`

#### 5. Seed the master account

```powershell
cd backend
.venv\Scripts\Activate.ps1
python scripts/seed_master.py
```

Seed script defaults:

- username: `master_123`
- password: `Master@123`

#### 6. Install frontend dependencies

```powershell
cd frontend
npm install
```

#### 7. Run the frontend

```powershell
cd frontend
npm run dev
```

The frontend should be available at `http://127.0.0.1:5173`.

### Option B: Run the backend stack with Docker Compose

From the `backend` folder:

```powershell
cd backend
docker compose up --build
```

This starts the FastAPI app together with PostgreSQL, Redis, and MinIO. The frontend is still run separately from the `frontend` folder.

## Local Development Caveats

The current codebase includes a few production-oriented assumptions that are important to know before debugging login issues locally.

### 1. CORS origin is currently hardcoded

In [`backend/app/main.py`](/C:/Healynx/Healynx/backend/app/main.py), CORS currently allows only:

- `https://healynx-med.vercel.app`

Even though `FRONTEND_URL` exists in `.env.example`, it is not currently used by the CORS middleware. If you want browser-based local development, you will likely need to add your local frontend origin manually.

### 2. Auth cookies are currently hardcoded as secure

In [`backend/app/api/v1/auth.py`](/C:/Healynx/Healynx/backend/app/api/v1/auth.py), the cookie helpers currently use:

- `secure=True`
- `samesite="None"`

Even though `COOKIE_SECURE` exists in `.env.example`, the helper functions do not currently use that variable. If local cookie auth gives you trouble, update the cookie settings in code for your dev environment or run behind HTTPS.

### 3. Frontend defaults to deployed backend URLs

The frontend API client and AI chat fallback to the deployed backend unless `VITE_API_BASE` is set.

There is also a hardcoded logout beacon in [`frontend/src/contexts/AuthContext.tsx`](/C:/Healynx/Healynx/frontend/src/contexts/AuthContext.tsx) that points to the hosted backend rather than your local one.

## Useful Scripts

### Backend

- `python scripts/seed_master.py`
  - creates the initial master account if it does not exist
- `python scripts/backfill_all_hashes.py`
  - backfills phone and email hashes for existing encrypted records

## API Surface Overview

The backend groups endpoints by responsibility:

- `/api/v1/auth`
  - login, logout, refresh, current-user session
- `/api/v1/master`
  - admin management and master dashboard
- `/api/v1/admin`
  - hospital requests, doctor requests, patient management, admin dashboard
- `/api/v1/hospital`
  - hospital profile, doctor join approvals, patient access approvals, pending entry approvals
- `/api/v1/doctor`
  - doctor registration, hospital join/leave, doctor dashboard, doctor session helpers
- `/api/v1/medical`
  - patient access, approved records, pending entries, AI medical Q&A
- `/api/v1/attachments`
  - presigned upload and attachment registration

## Frontend Routes Overview

The frontend exposes:

- public login pages for master, admin, hospital, and doctor
- hospital and doctor registration pages
- protected dashboard routes for:
  - `/master/*`
  - `/admin/*`
  - `/hospital/*`
  - `/doctor/*`

## Attachments and Object Storage

Attachment uploads are implemented with MinIO presigned URLs.

- Doctors request a presigned upload URL from `/api/v1/attachments/presign`
- The file is uploaded directly to MinIO
- The frontend then registers metadata through `/api/v1/attachments/register`

The bucket is created on demand by the MinIO service helper if it does not already exist.

## AI Assistant

The AI assistant is exposed at:

- `/api/v1/medical/ask-ai/{patient_id}`

It builds a context from the patient's stored medical history and sends the prompt to Groq. If `GROQ_API_KEY` is missing or invalid, the AI chat feature will not work.

## Migrations and Database Bootstrapping

The app currently creates SQLModel tables on startup through `SQLModel.metadata.create_all(engine)`.

Alembic configuration is also present in `backend/alembic`, but the current startup path already bootstraps tables automatically for new environments.

## Deployment Notes

The codebase appears to be wired around these hosted defaults:

- frontend origin: `https://healynx-med.vercel.app`
- backend base URL: `https://healynx.onrender.com`

If you deploy your own environments, update:

- frontend API base configuration
- backend CORS settings
- cookie security settings
- JWT keys
- MinIO configuration
- Redis and PostgreSQL connection strings

## Known Gaps and Cleanup Opportunities

These are useful to know if you continue developing the project:

- No top-level README existed before this file.
- No automated test suite is currently configured in the repository.
- No lint script is configured in the frontend `package.json`.
- `backend/.env.example` does not currently list `GROQ_API_KEY`, `GROQ_MODEL`, or `DOCTOR_SESSION_MINUTES` even though the code uses them.
- The backend includes committed key files in `backend/`; for real deployments, generate your own keys and keep private material out of source control.
- The repo currently contains local environment artifacts such as `venv/` and `node_modules/`, which are normally excluded from version control.

## Recommended First Steps After Cloning

1. Start PostgreSQL, Redis, and MinIO.
2. Create and fill `backend/.env`.
3. Set `frontend/.env` with `VITE_API_BASE=http://127.0.0.1:8000`.
4. Review CORS and cookie settings if you plan to log in from a local browser.
5. Run the backend and frontend.
6. Seed the master account.
7. Log in as master and create your first admin.

## License

This Project is registered under Apache License