#!/usr/bin/env bash
# Script di avvio alternativo (bash) per macOS/Linux, equivalente a
# start_backend.py. Utile se preferisci non passare da Python per
# l'orchestrazione, ad esempio in un Dockerfile o in un servizio systemd.
#
# Uso:
#   chmod +x start_backend.sh
#   ./start_backend.sh
#
# In produzione: impostalo come comando di avvio del servizio.

set -euo pipefail

cd "$(dirname "$0")"

echo "== 1/2: Applico le migration del database (alembic upgrade head) =="
python -m alembic upgrade head

echo "== 2/2: Avvio il backend =="
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8000}"
DEBUG="${DEBUG:-true}"

if [ "$DEBUG" = "true" ] || [ "$DEBUG" = "1" ]; then
  exec python -m uvicorn main:app --host "$HOST" --port "$PORT" --reload
else
  exec python -m uvicorn main:app --host "$HOST" --port "$PORT"
fi
