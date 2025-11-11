@echo off
echo ========================================
echo   TeachTrack CBC - Starting All Servers
echo ========================================
echo.
echo Starting Backend and Frontend...
echo.
echo Backend API: http://localhost:8000
echo Backend Docs: http://localhost:8000/docs
echo Frontend: http://localhost:3000
echo.
echo Press Ctrl+C to stop all servers
echo.

npm run dev:all
