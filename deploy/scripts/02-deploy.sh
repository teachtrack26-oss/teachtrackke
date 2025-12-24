#!/bin/bash
# =============================================================================
# TeachTrack Deployment Script (Step 2)
# Run this after server setup and file transfer
# =============================================================================

set -e

echo "==========================================="
echo "TeachTrack Deployment - Step 2"
echo "==========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
DOMAIN="teachtrackke.duckdns.org"
EMAIL="teachtrack26@gmail.com"
APP_DIR="/opt/teachtrack"

cd $APP_DIR

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please copy .env.production to .env and fill in the values"
    exit 1
fi

echo -e "${YELLOW}[1/5] Loading environment variables...${NC}"
source .env

echo -e "${YELLOW}[2/5] Creating initial nginx config (for SSL cert generation)...${NC}"
# Create temporary nginx config without SSL for certbot
cat > nginx/conf.d/teachtrack.conf << 'NGINX_TEMP'
server {
    listen 80;
    listen [::]:80;
    server_name teachtrackke.duckdns.org;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'TeachTrack API - SSL setup in progress';
        add_header Content-Type text/plain;
    }
}
NGINX_TEMP

echo -e "${YELLOW}[3/5] Starting Nginx for SSL certificate...${NC}"
docker compose -f docker-compose.vps.yml up -d nginx

echo -e "${YELLOW}[4/5] Obtaining SSL certificate from Let's Encrypt...${NC}"
docker compose -f docker-compose.vps.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

echo -e "${YELLOW}[5/5] Deploying full application with SSL...${NC}"
# Copy the full SSL nginx config
cp nginx/conf.d/teachtrack.conf.ssl nginx/conf.d/teachtrack.conf 2>/dev/null || true

# Stop and restart all services
docker compose -f docker-compose.vps.yml down
docker compose -f docker-compose.vps.yml up -d --build

echo ""
echo -e "${GREEN}==========================================="
echo "Deployment Complete!"
echo "==========================================="
echo ""
echo "Your API is now available at:"
echo "  https://$DOMAIN"
echo ""
echo "API Documentation:"
echo "  https://$DOMAIN/docs"
echo ""
echo "Health Check:"
echo "  https://$DOMAIN/health"
echo ""
echo "Useful commands:"
echo "  View logs:     docker compose -f docker-compose.vps.yml logs -f"
echo "  Restart:       docker compose -f docker-compose.vps.yml restart"
echo "  Stop:          docker compose -f docker-compose.vps.yml down"
echo "==========================================${NC}"
