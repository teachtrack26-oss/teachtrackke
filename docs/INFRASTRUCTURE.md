# Infrastructure & Hosting Documentation

## Production Environment (Contabo VPS)

**Server Details**

- **Provider:** Contabo
- **IP Address:** `75.119.131.232`
- **Domain:** `teachtrackke.duckdns.org` (Managed via DuckDNS, points to VPS IP)
- **OS User:** `root`
- **Remote Path:** `/opt/teachtrack/`

### Deployment Stack

The application runs via Docker Compose on the VPS.

**Services:**
| Service | Container Name | Internal Port | Purpose |
|---------|----------------|---------------|---------|
| **Backend** | `backend` | `8000` | FastAPI Python Application |
| **Database** | `mysql` | `3306` | MySQL 8.0 Database |
| **Cache** | `redis` | `6379` | Redis (Caching & Celery Broker) |
| **Proxy** | `nginx` | `80`, `443` | Reverse Proxy & SSL Termination (Let's Encrypt) |

### Configuration Files

- **Remote Compose File:** `/opt/teachtrack/docker-compose.vps.yml`
- **Local Reference:** `deploy/docker-compose.vps.yml`
- **Environment Variables:** `/opt/teachtrack/.env`

### Database Credentials

_As configured in the production environment variables:_

- **DB Host:** `mysql`
- **DB Name:** `teachtrack`
- **DB User:** `teachtrack_user`
- **DB Protocol:** MySQL 8.0

### SSL/HTTPS

- Handled by **Nginx** container.
- **Certificate Authority:** Let's Encrypt.
- **URL:** `https://teachtrackke.duckdns.org`

### Useful Commands

**SSH Access:**

```bash
ssh root@75.119.131.232
```

**Deploy Updates:**

```bash
# 1. SSH into server
# 2. Navigate to directory
cd /opt/teachtrack/

# 3. Pull latest changes (if using git)
git pull origin main

# 4. Rebuild and restart containers
docker-compose -f docker-compose.vps.yml up -d --build
```
