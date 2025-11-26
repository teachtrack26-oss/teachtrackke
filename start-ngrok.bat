@echo off
echo.
echo ================================================================
echo   Starting Ngrok Tunnel for TeachTrack
echo ================================================================
echo.
echo Starting ngrok on port 3000...
echo.

start "Ngrok Tunnel" C:\Users\MKT\Desktop\ngrok.exe http 3000

echo Waiting for ngrok to initialize...
timeout /t 5 /nobreak >nul

echo.
echo Fetching your public URL...
echo.

REM Try to get the URL using PowerShell
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels'; $url = $response.tunnels[0].public_url; Write-Host ''; Write-Host '================================================================' -ForegroundColor Green; Write-Host '  YOUR NGROK URL IS READY!' -ForegroundColor Green; Write-Host '================================================================' -ForegroundColor Green; Write-Host ''; Write-Host '  URL: ' -NoNewline; Write-Host $url -ForegroundColor Cyan; Write-Host ''; Write-Host '================================================================' -ForegroundColor Green; Write-Host ''; Write-Host 'Open this URL on your smartphone to access TeachTrack!'; Write-Host ''; Write-Host 'Press Ctrl+C in the Ngrok window to stop the tunnel.'; Write-Host ''; } catch { Write-Host 'Could not fetch URL. Please check http://127.0.0.1:4040/ manually.' -ForegroundColor Yellow; }"

echo.
echo You can also visit http://127.0.0.1:4040 to see the ngrok dashboard
echo.
pause
