#!/bin/bash
# BlueBlood.ai - Start Backend
cd "$(dirname "$0")"
source venv/bin/activate
export PYTHONPATH=/home/tausif/blueblood.ai
echo "Starting BlueBlood.ai backend on http://localhost:8000"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
