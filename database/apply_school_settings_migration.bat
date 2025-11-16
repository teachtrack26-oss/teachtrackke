@echo off
REM Apply School Settings Migration (Windows)

echo 🏫 Applying School Settings Migration...
echo.

REM Check if MySQL is available
where mysql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ MySQL client not found. Please install MySQL client.
    pause
    exit /b 1
)

REM Prompt for database credentials
set /p DB_USER="Enter MySQL username [root]: "
if "%DB_USER%"=="" set DB_USER=root

set /p DB_PASS="Enter MySQL password: "

set /p DB_NAME="Enter database name [teachtrack_db]: "
if "%DB_NAME%"=="" set DB_NAME=teachtrack_db

set /p DB_HOST="Enter MySQL host [localhost]: "
if "%DB_HOST%"=="" set DB_HOST=localhost

echo.
echo 📊 Applying migration to %DB_NAME%...

mysql -u %DB_USER% -p%DB_PASS% -h %DB_HOST% %DB_NAME% < database\add_school_settings.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Migration applied successfully!
    echo.
    echo Next steps:
    echo 1. Restart your backend server
    echo 2. Login as admin
    echo 3. Navigate to Admin Dashboard ^> School Settings
    echo 4. Configure your school details
) else (
    echo.
    echo ❌ Migration failed. Please check your database credentials and try again.
)

echo.
pause
