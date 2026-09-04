#!/usr/bin/env python3
"""
Single startup script for the backend, valid both locally and in
production (Railway, Render, VPS, etc.).

What it does, in order:
1. Runs "alembic upgrade head" to upgrade the database to the latest schema
(creates tables from scratch if the database doesn't already exist).
2. Starts the backend with uvicorn.

Local use:
python start_backend.py

Production use: Set this as the service's "Start Command"
(Railway/Render allow you to specify a custom startup command
instead of "python main.py" or "uvicorn main:app").

Why a single script instead of two separate commands: Eliminates the risk
of forgetting "alembic upgrade head" before starting the server 0 """

import os
import subprocess
import sys


def run_command(command: list[str]) -> None:
    print(f"$ {' '.join(command)}")
    result = subprocess.run(command)
    if result.returncode != 0:
        print(f"Comando fallito con codice {result.returncode}: {' '.join(command)}")
        sys.exit(result.returncode)


def main() -> None:
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)

    print("== 1/2: Applico le migration del database (alembic upgrade head) ==")
    run_command([sys.executable, "-m", "alembic", "upgrade", "head"])

    print("== 2/2: Avvio il backend ==")
    host = os.environ.get("HOST", "127.0.0.1")
    port = os.environ.get("PORT", "8000")

    # In produzione (Railway/Render) di solito NON si vuole --reload:
    # lo attiviamo solo se DEBUG=true (già presente in config.py/.env).
    debug = os.environ.get("DEBUG", "true").lower() in ("1", "true", "yes")

    command = [
        sys.executable, "-m", "uvicorn", "main:app",
        "--host", host,
        "--port", port,
    ]
    if debug:
        command.append("--reload")

    run_command(command)


if __name__ == "__main__":
    main()
