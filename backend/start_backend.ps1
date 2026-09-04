# Script di avvio alternativo (PowerShell) per Windows, equivalente a
# start_backend.py.
#
# Uso, dalla cartella backend con il virtual environment attivo:
#   .\start_backend.ps1

$ErrorActionPreference = "Stop"

Set-Location -Path $PSScriptRoot

Write-Host "== 1/2: Applico le migration del database (alembic upgrade head) =="
python -m alembic upgrade head
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "== 2/2: Avvio il backend =="
$hostAddr = if ($env:HOST) { $env:HOST } else { "127.0.0.1" }
$port = if ($env:PORT) { $env:PORT } else { "8000" }
$debug = if ($env:DEBUG) { $env:DEBUG } else { "true" }

if ($debug -eq "true" -or $debug -eq "1") {
    python -m uvicorn main:app --host $hostAddr --port $port --reload
} else {
    python -m uvicorn main:app --host $hostAddr --port $port
}
