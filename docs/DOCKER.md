# Docker guide — Planning H&S

This guide explains how to run Planning H&S with Docker for development and for a local production-style test. For the project overview, configuration and non-Docker setup, see the [main README](../README.md).

## Requirements

- Docker Desktop installed and running.

Verify the installation:

```bash
docker --version
docker compose version
```

Both commands should print a version number without errors.

## First run

From the project root:

```bash
git clone <repository-url>
cd planning-hs
```

Create your private backend configuration file:

```bash
cp backend/.env.example backend/.env
```

On Windows PowerShell, use:

```powershell
Copy-Item backend\.env.example backend\.env
```

Open `backend/.env` and generate a value for `SETTINGS_ENCRYPTION_KEY` if you plan to configure and persist an SMTP password from the Settings page. See the “Security of credentials” section in the main README for the generation command and security notes.

You can leave SMTP fields empty: the application will still run, but automated email notifications will remain disabled.

## Development mode

Development mode is intended for everyday work on the source code. It runs the frontend with `next dev`, mounts the local source folders into the containers and supports hot reload.

From the project root:

```bash
docker compose up --build
```

Open:

- Frontend: [http://localhost:3000](http://localhost:3000)
- API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

Stop the environment while keeping its Docker database volume:

```bash
docker compose down
```

## Production-style local test

The repository also includes a production-oriented frontend build. It builds the Next.js standalone output and starts it with `node server.js`; it does not use `next dev`, hot reload or a bind mount of the frontend source code.

From the project root:

```bash
docker compose -f docker-compose.prod.yml up --build
```

This command is useful before deploying to verify that the standalone frontend build works correctly.

Open:

- Frontend: [http://localhost:3000](http://localhost:3000)
- API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

Stop it with:

```bash
docker compose -f docker-compose.prod.yml down
```

## Verify the application

After either Docker mode starts, test at least the following:

- Create and edit an employee
- Save a course completion date
- Save a medical fitness/visit record
- Use Planning filters and export data
- Generate reports and verify report filters
- Save settings and confirm they remain after a page refresh
- Configure SMTP only with dedicated test credentials, then run “Check changes now”
- Download an Excel export and confirm that columns are readable without manual resizing

You can inspect the current non-sensitive settings through:

```text
http://localhost:8000/api/settings
```

The API never returns the SMTP password.

## Useful commands

Show running containers:

```bash
docker compose ps
```

Follow service logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

Check the Alembic migration revision used by the development container:

```bash
docker compose exec backend alembic current
```

For the production-style environment, add `-f docker-compose.prod.yml` to the command:

```bash
docker compose -f docker-compose.prod.yml exec backend alembic current
```

## Reset test data

Docker keeps application data in named volumes. To remove containers and erase the Docker data created during a test:

```bash
docker compose down -v --remove-orphans
```

For the production-style environment:

```bash
docker compose -f docker-compose.prod.yml down -v --remove-orphans
```

A reset deletes the Docker database and the settings stored in it, including encrypted SMTP password data. It does not alter source files or the private `backend/.env` file on your computer.

## Shared or public networks

If you are working on a shared or public Wi-Fi network, avoid exposing the application ports to other devices. Create a local file named `docker-compose.override.yml` in the project root:

```yaml
services:
  backend:
    ports:
      - "127.0.0.1:8000:8000"

  frontend:
    ports:
      - "127.0.0.1:3000:3000"
```

Docker Compose automatically combines this local override with `docker-compose.yml`. The file is intended to remain untracked by Git.

## Troubleshooting

### Frontend build fails on a `COPY` instruction

Ensure that every Dockerfile instruction is on its own line. For example, these must be separate instructions:

```dockerfile
FROM node:20-alpine
COPY package*.json ./
```

### SMTP settings are not retained after restart

Confirm that:

- `backend/.env` contains a valid `SETTINGS_ENCRYPTION_KEY`
- `alembic upgrade head` has been applied
- the database volume was not removed with `down -v`
- the settings are visible at `http://localhost:8000/api/settings`

The SMTP password is intentionally not visible in that API response; use the `smtp_password_configured` flag instead.

### Build uses outdated files

Rebuild without Docker cache:

```bash
docker compose build --no-cache
docker compose up
```

For the production-style environment:

```bash
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up
```
