@echo off
color 0A
echo.
echo ================================================================
echo   TeachTrack - Complete Startup Script
echo ================================================================
echo.
echo This will start:
echo   1. Development Server (Frontend + Backend)
echo   2. Ngrok Tunnel
echo   3. Display your mobile access URL
echo.
echo ================================================================
echo.

echo [1/3] Starting Development Server...
start "TeachTrack Dev Server" cmd /k "cd /d C:\Users\MKT\desktop\teachtrack && npm run dev:all"
echo ✓ Dev server starting in new window...
echo.

echo [2/3] Waiting 10 seconds for server to initialize...
timeout /t 10 /nobreak >nul
echo.

echo [3/3] Starting Ngrok Tunnel...
start "Ngrok Tunnel" C:\Users\MKT\Desktop\ngrok.exe http 3000
echo ✓ Ngrok starting in new window...
echo.

echo [4/4] Waiting for ngrok to connect...
timeout /t 5 /nobreak >nul
echo.

echo Fetching your mobile access URL...
echo.

REM Fetch URL using Python
python -c "import requests, time; time.sleep(2); response = requests.get('http://127.0.0.1:4040/api/tunnels'); url = response.json()['tunnels'][0]['public_url']; print('\n' + '='*60); print('  YOUR TEACHTRACK IS READY!'); print('='*60 + '\n'); print('  PC Access:    http://localhost:3000'); print('  Mobile Access:', url); print('\n' + '='*60); print('\nOpen the Mobile Access URL on your phone!'); print('\nNgrok Dashboard: http://127.0.0.1:4040\n' + '='*60 + '\n')" 2>nul

if errorlevel 1 (
    echo.
    echo Could not auto-fetch URL. Please check manually at:
    echo http://127.0.0.1:4040
    echo.
)

echo.
echo ================================================================
echo   All services are running!
echo ================================================================
echo.
echo What's running:
echo   - Dev Server: http://localhost:3000
echo   - Ngrok Dashboard: http://127.0.0.1:4040
echo.
echo To stop all services:
echo   - Close this window and the other terminal windows
echo   - Or press Ctrl+C in each window
echo.
echo ================================================================
echo.
pause
