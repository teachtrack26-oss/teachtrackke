#!/bin/bash
# =============================================================================
# SSL Certificate Renewal Script
# Run this to manually renew SSL certificates (auto-renewal is configured)
# =============================================================================

cd /opt/teachtrack

echo "Renewing SSL certificates..."
docker compose -f docker-compose.vps.yml run --rm certbot renew

echo "Reloading Nginx..."
docker compose -f docker-compose.vps.yml exec nginx nginx -s reload

echo "Done! Certificate renewed."
