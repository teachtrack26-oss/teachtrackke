#!/bin/bash
# Automatic deployment for 2000 concurrent users
# This script applies all configurations and starts the system

echo "========================================"
echo "TeachTrack - 2000 User Deployment"
echo "========================================"
echo ""

echo "[1/4] Installing dependencies..."
cd backend
pip install -q -r requirements.txt
pip install -q -r requirements_production.txt
cd ..

echo "[2/4] Starting Docker services..."
docker-compose -f docker-compose.production.yml down 2>/dev/null
docker-compose -f docker-compose.production.yml up -d --build

echo ""
echo "[3/4] Waiting for services to start..."
sleep 15

echo ""
echo "[4/4] Verifying deployment..."
cd backend
python health_monitor.py
cd ..

echo ""
echo "========================================"
echo "✅ Deployment Complete!"
echo "========================================"
echo ""
echo "System is now running for 2000 users:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:8000"
echo ""
echo "View logs: docker-compose -f docker-compose.production.yml logs -f"
echo "Stop system: docker-compose -f docker-compose.production.yml down"
echo ""
