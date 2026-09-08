# Planning H&S

A dashboard for managing workplace safety training and occupational health surveillance, showing which employees are compliant, approaching expiry, overdue, or missing mandatory requirements.

[Versione italiana](README.IT.md)

<video src="https://github.com/user-attachments/assets/dccd54c6-87e9-44f0-8b86-331f6cee3e57" controls muted playsinline width="100%"></video>

## The problem it solves

Companies must keep safety training and, where applicable, occupational health surveillance up to date for their employees. Managing this information across spreadsheets becomes difficult as the number of employees, roles, courses, locations, and expiry dates grows.

Planning H&S centralizes these records, calculates renewal dates from the configured course or health plan rules, highlights each status visually, and can send an aggregated email when a relevant status changes.

## How it works

The application connects several concepts:

- **Safety roles** such as RSPP, RLS, Supervisor, Fire Safety Officer, First Aid Officer, or Food Operator. Each role can require one or more mandatory courses.
- **Job classifications** such as Office Employee or Production Worker. A classification can determine whether an occupational health plan applies.
- **Courses and health surveillance plans**, each with a configurable renewal period in years or months. Courses with a renewal value of `0` do not expire.

When roles and classification are assigned to an employee, the application calculates the required training and evaluates the current medical surveillance requirement. Course expiry dates are calculated from the completion date and the configured renewal period.

Each requirement can have one of the following statuses:

| Status | Meaning |
|---|---|
| Compliant | No expiry is currently close |
| Expiring soon | The expiry date is within the configured threshold (70 days by default) |
| Critical / Expired | The expiry date has been reached or passed |
| Missing | A mandatory course or medical record has not been registered |

### Automated alerts and notifications

Once a day, at a configurable time, the application compares the current status of each employee requirement with the previous check. It detects changes such as a course becoming expiring soon, critical, expired, or missing.

When changes are found, the application sends **one aggregated email** to the configured recipient, grouping the changes by category. If nothing changed since the previous check, no email is sent. This avoids duplicate daily notifications.

The Settings page also provides a “Check changes now” action to test the process immediately. If SMTP is incomplete or delivery fails, the interface reports a safe diagnostic message without exposing the password.

## Main features

### Dashboard

Overview of employees and the status of mandatory courses and medical fitness. Includes filters by location, department, role, and classification, plus Excel and CSV export for selected columns.

### Employee registry

Employee contact and personal data, multiple safety roles, one active job classification, and backend history of classification changes.

### Courses

Configurable course catalogue with renewal periods, non-expiring courses, active/inactive status, and mandatory-course links for safety roles.

### Occupational health surveillance

Configurable medical plans with renewal periods in years or months, linked to one or more job classifications. Each employee has one current medical record and a backend history of previous visits.

### Planning

Planning is designed to turn expiry data into concrete actions. Select a course or health plan and the application automatically lists employees who are missing, expired, critical, or approaching expiry, ordered by priority.

The visible columns can be selected before exporting. For a classroom register or certificate preparation, you may select name, surname, tax code, date and place of birth, email, phone, department, location, job position, roles, and the selected course or health plan. The filtered Excel or CSV file is ready to support invitations, attendance records, or certificate templates without manually copying data from another section.

### Reports

Course and medical-plan reports aggregate missing, expiring, and expired requirements and calculate compliance percentages. The reporting threshold can be changed to estimate future training and medical-surveillance demand, for example over 90, 180, or 365 days. This supports session planning, budget estimates, and future training capacity decisions.

### Configuration and adaptability

The application is not tied to one industry. In addition to the initial sample data, users can create courses, safety roles, job classifications, medical plans, and new relationships between them.

Examples include:

- **Manufacturing company**: production workers, forklift operators, supervisors, equipment-specific courses, and a manual-handling medical plan.
- **Office or professional studio**: office employees, display-screen workers, RLS, and a dedicated health-surveillance plan.
- **Food company**: food operators with mandatory HACCP training in addition to general safety training.

The expiry and alert engine remains the same; only the configuration changes.

## Credential security

SMTP host, port, username, sender, sender name, and report recipient are stored in the application database and remain available after a backend restart, so automated alerts can continue to work.

The SMTP password is encrypted before being stored in the database and is never returned by the API. The password field remains empty in the interface even when a password is configured; the UI shows only the configuration status.

The encryption key, `SETTINGS_ENCRYPTION_KEY`, is kept only in the private `backend/.env` file or in production environment variables. It must never be committed to GitHub.

Generate one during the first setup with the backend virtual environment active:

```bash
cd backend
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Then add it to `backend/.env`:

```env
SETTINGS_ENCRYPTION_KEY=<generated-value>
```

If the key is not configured, the application still runs, but an SMTP password entered through the UI will not survive a backend restart. Other non-sensitive settings are still saved.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.3.3 (App Router), React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI, async SQLAlchemy 2.0, Alembic, APScheduler |
| Database | SQLite locally, PostgreSQL in cloud deployments |
| Notifications | FastAPI-Mail (SMTP), password encrypted with `cryptography` |

## Quick start

### With Docker (recommended)

```bash
git clone <repository-url>
cd planning-hs
cp backend/.env.example backend/.env
docker compose up --build
```

On Windows PowerShell:

```powershell
Copy-Item backend\.env.example backend\.env
docker compose up --build
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend/API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

For detailed Docker instructions, reset procedures, production-style testing, and troubleshooting, see [`docs/DOCKER.md`](docs/DOCKER.md).

### Without Docker

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python start_backend.py
```

On Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
Copy-Item .env.example .env
```

#### Frontend development

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

#### Local production-style frontend test

The project uses `output: "standalone"`. To test the production build locally:

```bash
cd frontend
npm run build
npm run start
```

`npm run build` generates the standalone output and prepares the static assets; `npm run start` launches `.next/standalone/server.js`. This mode does not provide hot reload.

The backend and frontend must both be running. Requirements: Python 3.11 or 3.12, Node.js 18+, and npm.

> Whenever a model changes, create and apply an Alembic migration: `alembic revision --autogenerate -m "description"`, then `alembic upgrade head`.

## Configuration

Copy `backend/.env.example` to `backend/.env`. The real `.env` file must never be committed. SMTP settings, alert thresholds, and the scheduler time can also be changed from the Settings page.

## Data persistence

The database stores employees, courses, history, and application settings across restarts. To reset Docker test data:

```bash
docker compose down -v --remove-orphans
```

For local development, remove `planning_hs.db` and run `alembic upgrade head` again.

## Manual verification

Before a new version, verify startup, migrations, employee management, courses, medical records, dashboard, Planning, reports, SMTP settings, alerts, Excel/CSV exports, the standalone build, and both Docker development and production-style modes.

## Project structure


planning-hs/
├── README.md
├── README.IT.md
├── LICENSE
├── docker-compose.yml
├── docker-compose.prod.yml
├── .dockerignore
├── docs/
│   ├── DOCKER.md
│   ├── GUIDA_UTENTE.md
│   └── USER_GUIDE.md
│
├── backend/
│   ├── .dockerignore
│   ├── .env.example
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── alembic.ini
│   ├── alembic/versions/
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   ├── repositories.py
│   ├── services.py
│   ├── settings_service.py
│   ├── excel_utils.py
│   ├── alert_engine.py
│   ├── notifications.py
│   ├── scheduler.py
│   ├── schemas/
│   ├── routers/
│   ├── start_backend.py
│   ├── start_backend.ps1
│   ├── start_backend.sh
│   └── main.py
│
└── frontend/
    ├── .dockerignore
    ├── Dockerfile
    ├── package.json
    ├── package-lock.json
    ├── next.config.js
    ├── scripts/
    │   └── copy-standalone-assets.js
    ├── lib/
    ├── components/
    └── app/
        ├── layout.tsx
        ├── page.tsx
        ├── employees/
        ├── courses/
        ├── surveillance/
        ├── planning/
        ├── reports/
        └── settings/


## User guide

The operational guide for HR, safety managers, and training coordinators is available in [`docs/USER_GUIDE.md`](docs/GUIDA_UTENTE.md). An English translation can be added as `docs/USER_GUIDE.en.md` when needed.

## Privacy and roadmap

Planning H&S is currently intended for development, demos, and technical evaluation. Before production use with real personal data, further measures will be required, including separate user authentication, role-based authorization, audit logging, database and backup encryption, HTTPS, and security procedures.

GDPR compliance also depends on the deployment context, infrastructure, and organizational procedures.

## License

Distributed under the [MIT License](LICENSE).
