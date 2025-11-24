@echo off
REM Production Deployment Script for Windows

echo ============================================
echo TeachTrack Production Deployment
echo ============================================
echo.

echo Step 1: Installing production dependencies...
cd backend
pip install -r requirements.txt
pip install -r requirements_production.txt
cd ..

echo.
echo Step 2: Building frontend...
cd frontend
call npm install
call npm run build
cd ..

echo.
echo Step 3: Starting services...
echo.
echo Available options:
echo   1. Docker (Recommended - includes Redis, MySQL, all services)
echo   2. Manual (Requires Redis and MySQL running separately)
echo.

set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo Starting Docker deployment...
    docker-compose -f docker-compose.production.yml up -d
    echo.
    echo ✅ Production deployment started!
    echo.
    echo Access the application at: http://localhost
    echo API available at: http://localhost:8000
    echo.
    echo To view logs: docker-compose -f docker-compose.production.yml logs -f
    echo To stop: docker-compose -f docker-compose.production.yml down
) else (
    echo.
    echo Starting manual deployment...
    echo.
    echo ⚠️  Make sure Redis and MySQL are running!
    echo.
    echo Starting in 5 seconds...
    timeout /t 5
    start cmd /k "cd backend && python server_production.py"
    timeout /t 2
    start cmd /k "cd backend && celery -A celery_app worker --loglevel=info --concurrency=8"
    timeout /t 2
    start cmd /k "cd frontend && npm run start"
    echo.
    echo ✅ Production services started in separate windows!
    echo Close those windows to stop the services.
)

echo.
pause
