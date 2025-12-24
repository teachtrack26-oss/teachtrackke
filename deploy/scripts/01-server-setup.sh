#!/bin/bash
# =============================================================================
# TeachTrack Server Setup Script (Step 1)
# Run this first on a fresh Ubuntu 22.04/24.04 VPS
# =============================================================================

set -e  # Exit on error

echo "==========================================="
echo "TeachTrack Server Setup - Step 1"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/8] Updating system packages...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}[2/8] Installing essential packages...${NC}"
apt install -y \
    curl \
    wget \
    git \
    ufw \
    fail2ban \
    htop \
    nano \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

echo -e "${YELLOW}[3/8] Setting up firewall (UFW)...${NC}"
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status

echo -e "${YELLOW}[4/8] Configuring Fail2Ban...${NC}"
systemctl enable fail2ban
systemctl start fail2ban

echo -e "${YELLOW}[5/8] Installing Docker...${NC}"
# Remove old versions
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo -e "${YELLOW}[6/8] Starting Docker service...${NC}"
systemctl enable docker
systemctl start docker

echo -e "${YELLOW}[7/8] Creating deploy user...${NC}"
# Create a deploy user (optional but recommended)
if ! id "deploy" &>/dev/null; then
    useradd -m -s /bin/bash deploy
    usermod -aG docker deploy
    echo -e "${GREEN}User 'deploy' created and added to docker group${NC}"
else
    echo -e "${YELLOW}User 'deploy' already exists${NC}"
fi

echo -e "${YELLOW}[8/8] Creating application directories...${NC}"
mkdir -p /opt/teachtrack
mkdir -p /opt/teachtrack/uploads
mkdir -p /opt/teachtrack/logs
mkdir -p /opt/teachtrack/certbot/conf
mkdir -p /opt/teachtrack/certbot/www
mkdir -p /opt/teachtrack/nginx/conf.d
chown -R deploy:deploy /opt/teachtrack

echo ""
echo -e "${GREEN}==========================================="
echo "Server Setup Complete!"
echo "==========================================="
echo ""
echo "Next steps:"
echo "1. Copy your project files to /opt/teachtrack/"
echo "2. Run: ./02-deploy.sh"
echo ""
echo "Docker version:"
docker --version
echo ""
echo "Docker Compose version:"
docker compose version
echo "==========================================${NC}"
