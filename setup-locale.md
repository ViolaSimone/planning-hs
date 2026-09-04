# Setup locale

## Prerequisiti

- Python 3.11 or newer
- Node.js 18 or newer
- npm

## Backend

Run the following commands from the `backend/` directory.

1. Create and activate a virtual environment:

   ```bash
   python -m venv venv
   ```

   Linux/macOS:

   ```bash
   source venv/bin/activate
   ```

   Windows PowerShell:

   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

2. Install the backend dependencies:

   ```bash
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. Create the local environment file:

   Linux/macOS:

   ```bash
   cp .env.example .env
   ```

   Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   Configure the database and SMTP values only if email notifications are
   required. Never commit `.env` or real credentials to Git.

4. Start the backend with automatic Alembic migrations:

   ```bash
   python start_backend.py
   ```

   The script runs `alembic upgrade head` before starting Uvicorn. This is
   the recommended local startup path. The API is available at:

   ```text
   http://localhost:8000
   ```

   Interactive API documentation:

   ```text
   http://localhost:8000/docs
   ```

## Frontend

Run the following commands from the `frontend/` directory.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open:

   ```text
   http://localhost:3000
   ```

The frontend and backend must run simultaneously.

## Docker

If Docker configuration is present at the project root:

```bash
docker compose up --build
```

The exact Docker commands and environment variables should be documented
in the project [`docs/DOCKER.md`] once the final Docker configuration is reviewed.
