#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate
export PYTHONPATH="$(pwd)"
echo "Starting BlueBlood.ai backend on http://localhost:8000"
echo "Server starts immediately. Auto-scan runs in background."
uvicorn main:app --host 0.0.0.0 --port 8000
