# TeachTrack VPS Deployment Guide

## Overview

This guide will help you deploy TeachTrack backend to your Contabo VPS.

| Component       | URL                                   |
| --------------- | ------------------------------------- |
| **Frontend**    | https://teachtrackke.vercel.app       |
| **Backend API** | https://teachtrackke.duckdns.org      |
| **API Docs**    | https://teachtrackke.duckdns.org/docs |

---

## Prerequisites

- ✅ Contabo VPS with Ubuntu 22.04/24.04
- ✅ VPS IP address (from Contabo email)
- ✅ DuckDNS subdomain: teachtrackke.duckdns.org
- ✅ Root SSH access to VPS

---

## Step 1: Update DuckDNS IP

Once you receive your Contabo VPS IP:

1. Go to [duckdns.org](https://www.duckdns.org/)
2. Update `teachtrackke` subdomain with your VPS IP
3. Click "update ip"

**Verify:** Run `ping teachtrackke.duckdns.org` - should return your VPS IP.

---

## Step 2: Connect to VPS

Open terminal (Git Bash on Windows):

```bash
ssh root@YOUR_VPS_IP
```

Enter the password from Contabo email.

---

## Step 3: Run Server Setup

On the VPS, run:

```bash
# Download the setup script (or copy/paste it)
curl -o server-setup.sh https://raw.githubusercontent.com/YOUR_REPO/deploy/scripts/01-server-setup.sh

# Or create manually:
nano server-setup.sh
# Paste the content of 01-server-setup.sh
# Save with Ctrl+X, Y, Enter

# Make executable and run
chmod +x server-setup.sh
./server-setup.sh
```

This installs Docker, sets up firewall, and prepares directories.

---

## Step 4: Transfer Project Files

From your **local machine** (Git Bash):

```bash
# Navigate to your teachtrack folder
cd /c/Users/MKT/desktop/teachtrack

# Create a deployment package
tar -czvf teachtrack-deploy.tar.gz \
    deploy/ \
    backend/ \
    --exclude='backend/__pycache__' \
    --exclude='backend/*.pyc' \
    --exclude='backend/uploads/*'

# Transfer to VPS
scp teachtrack-deploy.tar.gz root@YOUR_VPS_IP:/opt/teachtrack/
```

On **VPS**:

```bash
cd /opt/teachtrack
tar -xzvf teachtrack-deploy.tar.gz
mv deploy/* .
mv backend/* .
rm -rf deploy teachtrack-deploy.tar.gz
```

---

## Step 5: Configure Environment

On **VPS**:

```bash
cd /opt/teachtrack

# Copy and edit production environment
cp .env.production .env
nano .env
```

**IMPORTANT:** Update these values in `.env`:

```bash
# Generate a new secret key:
openssl rand -hex 32
# Copy the output and paste as SECRET_KEY

# Set strong database passwords
DB_ROOT_PASSWORD=YourStrongPassword123!
DB_PASSWORD=YourStrongPassword456!
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

---

## Step 6: Copy Nginx SSL Config

```bash
cd /opt/teachtrack

# Copy the full SSL nginx config for later use
cp nginx/conf.d/teachtrack.conf nginx/conf.d/teachtrack.conf.ssl
```

---

## Step 7: Deploy

```bash
cd /opt/teachtrack
chmod +x scripts/*.sh
./scripts/02-deploy.sh
```

This will:

1. Start Nginx for SSL verification
2. Get SSL certificate from Let's Encrypt
3. Start all services (MySQL, Redis, Backend, Nginx)

---

## Step 8: Verify Deployment

Check if services are running:

```bash
docker compose -f docker-compose.vps.yml ps
```

All services should show "running".

Test the API:

```bash
curl https://teachtrackke.duckdns.org/health
```

Should return: `{"status": "healthy"}`

---

## Step 9: Update Vercel Frontend

Go to your Vercel dashboard:

1. Select your `teachtrackke` project
2. Go to **Settings** → **Environment Variables**
3. Add/Update:
   - `NEXT_PUBLIC_API_URL` = `https://teachtrackke.duckdns.org`
4. **Redeploy** the project

---

## Step 10: Update Google OAuth

In Google Cloud Console:

1. Go to **APIs & Services** → **Credentials**
2. Edit your OAuth 2.0 Client
3. Add to **Authorized JavaScript origins**:
   - `https://teachtrackke.duckdns.org`
4. Add to **Authorized redirect URIs**:
   - `https://teachtrackke.vercel.app/api/auth/callback/google`
   - `https://teachtrackke.duckdns.org/auth/google/callback`

---

## Useful Commands

```bash
# View all logs
docker compose -f docker-compose.vps.yml logs -f

# View specific service logs
docker compose -f docker-compose.vps.yml logs -f backend
docker compose -f docker-compose.vps.yml logs -f db

# Restart all services
docker compose -f docker-compose.vps.yml restart

# Restart specific service
docker compose -f docker-compose.vps.yml restart backend

# Stop everything
docker compose -f docker-compose.vps.yml down

# Start everything
docker compose -f docker-compose.vps.yml up -d

# Rebuild and restart (after code changes)
docker compose -f docker-compose.vps.yml up -d --build backend

# Check disk space
df -h

# Check memory usage
free -h

# Check running containers
docker ps

# Enter MySQL shell
docker exec -it teachtrack_db mysql -u root -p

# Backup database
./scripts/backup-db.sh
```

---

## Troubleshooting

### Backend not starting

```bash
# Check logs
docker compose -f docker-compose.vps.yml logs backend

# Common issues:
# - Database not ready: Wait 30 seconds and restart backend
# - Missing .env: Ensure .env file exists
```

### SSL certificate issues

```bash
# Check certbot logs
docker compose -f docker-compose.vps.yml logs certbot

# Manually renew
./scripts/03-ssl-renew.sh
```

### Database connection errors

```bash
# Check if MySQL is running
docker compose -f docker-compose.vps.yml ps db

# Check MySQL logs
docker compose -f docker-compose.vps.yml logs db
```

### CORS errors from frontend

- Ensure `ALLOWED_ORIGINS` in backend includes your frontend URL
- Check Nginx CORS headers in config

---

## Maintenance

### Daily Backups

Set up automatic backups:

```bash
# Add to crontab
crontab -e

# Add this line (backup at 3 AM daily):
0 3 * * * /opt/teachtrack/scripts/backup-db.sh >> /opt/teachtrack/logs/backup.log 2>&1
```

### Updating the Application

```bash
cd /opt/teachtrack

# Pull latest code (if using git)
git pull

# Or transfer new files via SCP

# Rebuild and restart
docker compose -f docker-compose.vps.yml up -d --build
```

---

## Resource Usage (Expected)

| Service   | Memory         | CPU            |
| --------- | -------------- | -------------- |
| MySQL     | ~1.5 GB        | Low            |
| Redis     | ~256 MB        | Very Low       |
| Backend   | ~500 MB - 1 GB | Medium         |
| Nginx     | ~50 MB         | Very Low       |
| **Total** | ~3-4 GB        | Uses 2-3 cores |

Your 8GB VPS has plenty of headroom!

---

## Support

If you encounter issues:

1. Check logs: `docker compose -f docker-compose.vps.yml logs`
2. Check this guide's troubleshooting section
3. Verify DuckDNS IP is correct
4. Ensure all environment variables are set

Good luck with your deployment! 🚀
