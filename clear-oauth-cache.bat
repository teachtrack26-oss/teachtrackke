@echo off
echo ======================================
echo  Quick Cache Clear for OAuth Fix
echo ======================================
echo.

echo [1] Stopping services...
echo Please press Ctrl+C in the terminal running "python start.py"
pause

echo.
echo [2] Deleting Next.js cache...
cd frontend
if exist .next (
    rmdir /s /q .next
    echo Cache deleted!
) else (
    echo No cache found.
)

echo.
echo [3] Now do these manually:
echo.
echo    A. CLEAR BROWSER CACHE:
echo       - Press Ctrl + Shift + Delete
echo       - Select "Cached images and files"
echo       - Select "Cookies and site data"
echo       - Click "Clear data"
echo.
echo    B. CLOSE ALL BROWSER TABS
echo       - Close all tabs with localhost:3000
echo.
pause

echo.
echo [4] Restarting services...
cd ..
echo.
echo Run this command:
echo   python start.py
echo.
echo Or:
echo   npm run dev:all
echo.
pause

echo.
echo ======================================
echo  Done! Now test in INCOGNITO window
echo ======================================
echo.
echo Wait 5 minutes after saving Google Cloud Console changes!
pause
