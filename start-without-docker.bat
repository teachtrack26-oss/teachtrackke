@echo off
REM Quick Start for TeachTrack (No Docker Required)
REM This script starts the backend without caching (works immediately)

echo ==========================================
echo TeachTrack Quick Start (No Docker)
echo ==========================================
echo.

echo The system will work WITHOUT caching.
echo For production with 2000 users, you'll need Redis.
echo.
echo To add caching later:
echo   1. Install Redis: See REDIS_WINDOWS_SETUP.md
echo   2. Or install Docker Desktop
echo.

echo Starting backend...
cd backend
python main.py

pause
