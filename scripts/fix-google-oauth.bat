@echo off
echo ========================================
echo   Google OAuth 403 Error - Quick Fix
echo ========================================
echo.

echo [1/5] Stopping frontend...
echo Press Ctrl+C in the terminal running "npm run dev"
pause

echo.
echo [2/5] Cleaning Next.js cache...
cd frontend
if exist .next (
    echo Deleting .next folder...
    rmdir /s /q .next
    echo Done!
) else (
    echo .next folder not found, skipping...
)
echo.

echo [3/5] Cleaning browser cache...
echo.
echo MANUAL STEP:
echo 1. Open your browser
echo 2. Press Ctrl + Shift + Delete
echo 3. Select "Cached images and files" and "Cookies"
echo 4. Select time range: "Last hour"
echo 5. Click "Clear data"
echo.
pause

echo.
echo [4/5] Verifying environment variable...
echo.
echo Opening .env.local file...
echo.
echo VERIFY THIS:
echo - File contains: NEXT_PUBLIC_GOOGLE_CLIENT_ID=1091679198456-kuap2p7jfcdskj1hle12jlqcfpjgmje9.apps.googleusercontent.com
echo - NO spaces around the = sign
echo - Starts with NEXT_PUBLIC_
echo.
if exist .env.local (
    notepad .env.local
) else (
    echo .env.local not found!
    echo Creating template...
    echo NEXT_PUBLIC_GOOGLE_CLIENT_ID=1091679198456-kuap2p7jfcdskj1hle12jlqcfpjgmje9.apps.googleusercontent.com > .env.local
    echo NEXT_PUBLIC_API_URL=http://localhost:8000 >> .env.local
    echo.
    echo Created .env.local with your Client ID!
    notepad .env.local
)
echo.
pause

echo.
echo [5/5] Restarting frontend...
echo.
echo Run this command in a NEW terminal:
echo   cd frontend
echo   npm run dev
echo.
echo Then try Google Sign-In again!
echo.
pause

echo.
echo ========================================
echo   Fix Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure Google Cloud Console changes propagated (wait 2-5 min)
echo 2. Open http://localhost:3000 in an INCOGNITO window
echo 3. Try Google Sign-In
echo.
echo If still not working, check:
echo - Google Cloud Console has http://localhost:3000 AND http://127.0.0.1:3000
echo - Wait 10 minutes for Google's servers to update
echo.
pause
