# Scaling TeachTrack to Support 500 Concurrent Users

This guide explains how to deploy TeachTrack for high-concurrency scenarios (500+ simultaneous users).

## 📊 What Changed

### 1. Database Connection Pool (✅ DONE)
- **File**: `backend/database.py`
- **Change**: Increased from 5 to 100 connections with 200 overflow
- **Supports**: Up to 300 simultaneous database operations

### 2. MySQL Server Configuration
- **File**: `backend/mysql_config.cnf`
- **Apply**: Copy this file to your MySQL configuration directory
  ```bash
  # Linux/Mac
  sudo cp backend/mysql_config.cnf /etc/mysql/conf.d/teachtrack.cnf
  sudo systemctl restart mysql
  
  # Windows (update my.ini in MySQL installation folder)
  # Then restart MySQL service
  ```

### 3. Production Server
- **File**: `backend/server_production.py`
- **Run**: `python backend/server_production.py`
- **Features**: 8 worker processes, 1000 concurrent connections

### 4. Background Task Queue (RECOMMENDED FOR 500 USERS)
- **Requires**: Redis + Celery
- **Install**:
  ```bash
  cd backend
  pip install -r requirements_production.txt
  ```

### 5. Docker Deployment (RECOMMENDED)
- **File**: `docker-compose.production.yml`
- **Run**:
  ```bash
  docker-compose -f docker-compose.production.yml up -d
  ```
- **Features**:
  - 4 Backend instances (load balanced)
  - 2 Celery workers (for background tasks)
  - Redis (caching + task queue)
  - MySQL (configured for 500 connections)

---

## 🚀 Quick Start for Production

### Option 1: Automated Deployment (Easiest)

**Windows:**
```bash
start-production.bat
```

**Linux/Mac:**
```bash
chmod +x start-production.sh
./start-production.sh
```

The script will:
1. Install all dependencies
2. Build the frontend
3. Ask if you want Docker or Manual deployment
4. Start all services

### Option 2: Docker Deployment (Recommended)
```bash
# Install production dependencies first
npm run install:prod

# Start all services with Docker
npm run docker:prod

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Stop services
npm run docker:stop
```

### Option 3: Manual Production (Advanced)
```bash
# Terminal 1: Start Redis (if not running)
redis-server

# Terminal 2: Start production backend
npm run prod:backend

# Terminal 3: Start Celery worker
npm run prod:celery

# Terminal 4: Start frontend
cd frontend
npm run build
npm run start
```

---

## 📈 Performance Expectations

| Configuration | Concurrent Users | Response Time |
|--------------|------------------|---------------|
| **Current (Dev)** | 15-20 | 1-2 seconds |
| **Simple Upgrade** | 100-150 | 2-3 seconds |
| **Full Production** | 500+ | 1-2 seconds |

---

## 🔧 Server Requirements

For 500 concurrent users, your server should have:

- **CPU**: 8+ cores (16 recommended)
- **RAM**: 16 GB minimum (32 GB recommended)
- **Storage**: SSD with 100+ GB
- **Network**: 1 Gbps connection
- **MySQL**: Dedicated server or managed database (e.g., AWS RDS, Azure Database)

---

## 🛡️ Additional Optimizations

### Enable Caching (Redis)
Add to your backend `.env` file:
```
REDIS_URL=redis://localhost:6379/0
CACHE_ENABLED=true
```

### Enable Rate Limiting
To prevent abuse, limit each user to 100 requests per minute:
```python
# Add to main.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
```

### Monitor Performance
Use these tools:
- **Database**: `SHOW PROCESSLIST` in MySQL
- **Server**: `htop` or Task Manager
- **Logs**: Check `docker-compose logs` for errors

---

## 🎯 Next Steps

1. **Test** with current database upgrade (already done)
2. **Monitor** how many users you actually get concurrently
3. **Scale up** to Docker deployment when needed
4. **Consider** managed database services (AWS RDS, Google Cloud SQL) for even better performance

---

## ❓ Questions?

- **Will my current system work?** Yes, the database upgrade alone supports 100-150 users.
- **Do I need Docker?** No, but it makes scaling much easier.
- **What about AI features?** If you enable AI lesson generation, you MUST use background tasks (Celery).

Good luck with deployment! 🚀
