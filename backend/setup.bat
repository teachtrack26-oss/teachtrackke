@echo off
REM TeachTrack CBC Backend Setup Script for Windows

echo ===================================
echo TeachTrack CBC Backend Setup
echo ===================================

REM Check if MySQL is running
echo.
echo Checking MySQL installation...
mysql --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: MySQL is not installed or not in PATH
    echo Please install MySQL from: https://dev.mysql.com/downloads/installer/
    pause
    exit /b 1
)

echo MySQL found!

REM Test MySQL connection
echo.
echo Testing MySQL connection...
mysql -u root -p"2078@lk//K." -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Cannot connect to MySQL
    echo Please check your MySQL password
    pause
    exit /b 1
)

echo MySQL connection successful!

REM Create database
echo.
echo Creating database...
mysql -u root -p"2078@lk//K." -e "CREATE DATABASE IF NOT EXISTS teachtrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo Database 'teachtrack' created/verified!

REM Run schema
echo.
echo Running database schema...
mysql -u root -p"2078@lk//K." teachtrack < ..\database\schema.sql
if errorlevel 1 (
    echo ERROR: Failed to load database schema
    pause
    exit /b 1
)

echo Database schema loaded successfully!

REM Check Python
echo.
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed
    echo Please install Python 3.11+ from: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Python found!

REM Install dependencies
echo.
echo Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ===================================
echo Setup completed successfully!
echo ===================================
echo.
echo To start the backend server run:
echo   python main.py
echo   or
echo   uvicorn main:app --reload
echo.
echo API will be available at:
echo   http://localhost:8000
echo   http://localhost:8000/docs (API documentation)
echo.
pause
