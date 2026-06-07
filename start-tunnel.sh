#!/bin/bash
# BlueBlood.ai - Start Tunnel (exposes backend to internet)
echo "Starting tunnel to http://localhost:8000"
echo "Copy the URL shown below and add it to Vercel env as NEXT_PUBLIC_API_URL"
echo ""
lt --port 8000
