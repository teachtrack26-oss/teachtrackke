@echo off
color 0B
echo.
echo ================================================================
echo   Getting Your Current Ngrok URL...
echo ================================================================
echo.

python -c "import requests; r = requests.get('http://127.0.0.1:4040/api/tunnels'); url = r.json()['tunnels'][0]['public_url']; print('\n' + '='*60 + '\n  YOUR URL:\n  ' + url + '\n' + '='*60 + '\n')" 2>nul

if errorlevel 1 (
    echo ❌ Could not get URL. Is ngrok running?
    echo.
    echo To start ngrok, run:
    echo    C:\Users\MKT\Desktop\ngrok.exe http 3000
    echo.
    echo Or double-click: start-ngrok.bat
    echo.
)

pause
