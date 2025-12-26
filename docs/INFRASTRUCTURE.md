### Common Production Tasks

**Backup the production database:**

```bash
cd /opt/teachtrack/
docker compose -f docker-compose.production.yml exec db \
  mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" teachtrack > backup_$(date +%F).sql
```

**Restore a database backup:**

```bash
cd /opt/teachtrack/
cat backup_YYYY-MM-DD.sql | docker compose -f docker-compose.production.yml exec -T db \
  mysql -uroot -p"$MYSQL_ROOT_PASSWORD" teachtrack
```

**View backend logs (all instances):**

```bash
docker compose -f docker-compose.production.yml logs -f backend
```

**View Celery worker logs:**

```bash
docker compose -f docker-compose.production.yml logs -f celery_worker
```

**Restart only backend and workers (no downtime for DB/Redis):**

```bash
docker compose -f docker-compose.production.yml up -d --build backend celery_worker
```

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

**Services (Docker Compose service names):**
| Service | Internal Port | Host Port(s) | Purpose |
|---------|---------------|--------------|---------|
| **backend** | `8000` | `8000-8007` | FastAPI API (multiple instances published on host ports) |
| **celery_worker** | n/a | n/a | Celery workers for background jobs |
| **db** | `3306` | `3306` | MySQL 8.0 database |
| **redis** | `6379` | `6379` | Redis (caching + Celery broker) |
| **nginx** | `80` | `80` | Reverse proxy / load balancer to backend instances |

### Configuration Files

- **Remote Compose File:** `/opt/teachtrack/docker-compose.production.yml`
- **Local Reference:** `docker-compose.production.yml`
- **Database init scripts:** `database/` (mounted to `/docker-entrypoint-initdb.d`)

Notes:

- The `database/` init scripts run only when the MySQL data volume is created for the first time.
  For schema changes on an existing production DB, apply `ALTER TABLE ...` manually.
- The production compose currently sets most environment variables inline in the compose file.

### Database Credentials

_As configured in the production environment variables:_

- **DB Host (inside compose network):** `db`
- **DB Name:** `teachtrack`
- **DB User:** `teachtrack_user`
- **DB Protocol:** MySQL 8.0

### SSL/HTTPS

- Public URL: `https://teachtrackke.duckdns.org`
- Nginx is used as a reverse proxy/load balancer.
- TLS/HTTPS may be terminated at Nginx or upstream (confirm with the VPS nginx config + any external proxy).

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
git pull origin master

# 4. Rebuild and restart containers
docker compose -f docker-compose.production.yml up -d --build
```

**Open a MySQL shell inside the DB container:**

```bash
cd /opt/teachtrack/
docker compose -f docker-compose.production.yml exec db mysql -uroot -p"$MYSQL_ROOT_PASSWORD" teachtrack
```
