#!/bin/bash
# TeachTrack CBC Backend Setup Script

echo "==================================="
echo "TeachTrack CBC Backend Setup"
echo "==================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if MySQL is installed
echo -e "\n${YELLOW}Checking MySQL installation...${NC}"
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}MySQL is not installed. Please install MySQL first.${NC}"
    echo "Download from: https://dev.mysql.com/downloads/installer/"
    exit 1
fi

# Test MySQL connection
echo -e "\n${YELLOW}Testing MySQL connection...${NC}"
mysql -u root -p"2078@lk//K." -e "SELECT 1;" &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${RED}Cannot connect to MySQL. Please check your password.${NC}"
    exit 1
fi

echo -e "${GREEN}MySQL connection successful!${NC}"

# Create database if not exists
echo -e "\n${YELLOW}Creating database...${NC}"
mysql -u root -p"2078@lk//K." -e "CREATE DATABASE IF NOT EXISTS teachtrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo -e "${GREEN}Database 'teachtrack' created/verified!${NC}"

# Run schema
echo -e "\n${YELLOW}Running database schema...${NC}"
mysql -u root -p"2078@lk//K." teachtrack < ../database/schema.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Database schema loaded successfully!${NC}"
else
    echo -e "${RED}Error loading database schema.${NC}"
    exit 1
fi

# Install Python dependencies
echo -e "\n${YELLOW}Installing Python dependencies...${NC}"
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python is not installed. Please install Python 3.11+${NC}"
    exit 1
fi

pip install -r requirements.txt
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Python dependencies installed!${NC}"
else
    echo -e "${RED}Error installing dependencies.${NC}"
    exit 1
fi

echo -e "\n${GREEN}==================================="
echo "Setup completed successfully!"
echo "===================================${NC}"
echo -e "\n${YELLOW}To start the backend server:${NC}"
echo "  python main.py"
echo "  or"
echo "  uvicorn main:app --reload"
echo -e "\n${YELLOW}API will be available at:${NC}"
echo "  http://localhost:8000"
echo "  http://localhost:8000/docs (API documentation)"
