#!/bin/bash
# Production Deployment Script for Linux/Mac

echo "============================================"
echo "TeachTrack Production Deployment"
echo "============================================"
echo ""

echo "Step 1: Installing production dependencies..."
cd backend
pip install -r requirements.txt
pip install -r requirements_production.txt
cd ..

echo ""
echo "Step 2: Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo ""
echo "Step 3: Starting services..."
echo ""
echo "Available options:"
echo "  1. Docker (Recommended - includes Redis, MySQL, all services)"
echo "  2. Manual (Requires Redis and MySQL running separately)"
echo ""

read -p "Enter your choice (1 or 2): " choice

if [ "$choice" == "1" ]; then
    echo ""
    echo "Starting Docker deployment..."
    docker-compose -f docker-compose.production.yml up -d
    echo ""
    echo "✅ Production deployment started!"
    echo ""
    echo "Access the application at: http://localhost"
    echo "API available at: http://localhost:8000"
    echo ""
    echo "To view logs: docker-compose -f docker-compose.production.yml logs -f"
    echo "To stop: docker-compose -f docker-compose.production.yml down"
else
    echo ""
    echo "Starting manual deployment..."
    echo ""
    echo "⚠️  Make sure Redis and MySQL are running!"
    echo ""
    echo "Starting services..."
    
    # Start backend
    cd backend
    nohup python server_production.py > ../logs/backend.log 2>&1 &
    echo "Backend started (PID: $!)"
    
    # Start Celery worker
    nohup celery -A celery_app worker --loglevel=info --concurrency=8 > ../logs/celery.log 2>&1 &
    echo "Celery worker started (PID: $!)"
    
    cd ../frontend
    # Start frontend
    nohup npm run start > ../logs/frontend.log 2>&1 &
    echo "Frontend started (PID: $!)"
    
    cd ..
    echo ""
    echo "✅ Production services started!"
    echo ""
    echo "Access the application at: http://localhost:3000"
    echo "API available at: http://localhost:8000"
    echo ""
    echo "Logs are in the logs/ directory"
    echo "To stop services, run: pkill -f 'python server_production.py' && pkill -f celery"
fi

echo ""
