# Getting Redis Running on Windows

You have 3 options to get Redis running for caching:

## Option 1: Install Docker Desktop (Recommended if you plan to use full production features)

1. Download Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Install it
3. Restart your computer
4. Start Docker Desktop from the Start menu
5. Wait for it to fully start (whale icon in system tray)
6. Then run:
   ```bash
   docker run -d -p 6379:6379 --name teachtrack-redis redis:7-alpine
   ```

## Option 2: Install Redis Directly on Windows (Quickest for testing)

1. Download Redis for Windows from:
   https://github.com/tporadowski/redis/releases
   
2. Download the latest `.msi` file (e.g., `Redis-x64-5.0.14.1.msi`)

3. Run the installer
   - Check "Add to PATH"
   - Use default port 6379

4. Redis will start automatically as a Windows service

5. Verify it's running:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

## Option 3: Run WITHOUT Redis (Caching Disabled)

If you just want to test the system without caching:

1. The system will work fine - it just won't cache
2. You'll see this message when starting:
   ```
   ⚠️  Redis cache not available
   ```
3. All queries will hit the database (no caching benefit)

---

## Quick Start (Recommended: Option 2)

For the fastest setup:

1. **Download Redis for Windows**:
   - Go to: https://github.com/tporadowski/redis/releases
   - Download: `Redis-x64-5.0.14.1.msi` (or latest version)

2. **Install**:
   - Run the .msi file
   - Check "Add Redis to PATH"
   - Keep default settings (Port: 6379)
   - Finish installation

3. **Verify**:
   ```bash
   redis-cli ping
   ```
   Should return: `PONG`

4. **Start Backend**:
   ```bash
   cd backend
   python main.py
   ```
   You should see: `✅ Redis cache connected`

---

## Check Current Status

Run this to see if Redis is already installed:

```bash
redis-cli --version
```

If it works, Redis is installed! Just start the service:

```bash
# Start Redis (if installed but not running)
net start Redis

# Or check if it's running
redis-cli ping
```

---

## Which Option Should You Choose?

- **Just want to test caching NOW**: Option 2 (5 minutes)
- **Planning to use full production features later**: Option 1 (15 minutes)
- **Just want to see the system work**: Option 3 (0 setup, no caching benefits)

---

Let me know which option you want to proceed with!
