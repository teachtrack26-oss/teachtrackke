# Production Environment Configuration Template

## Required Environment Variables

Add these to your `backend/.env` file:

```bash
# Redis Configuration (Required for production scaling)
REDIS_URL=redis://localhost:6379/0
CACHE_ENABLED=true
CACHE_TTL=3600

# Production Mode
ENV=production
DEBUG=false
LOG_LEVEL=info

# Server Configuration
HOST=0.0.0.0
PORT=8000
WORKERS=8
```

## Optional but Recommended

```bash
# AI Features (if using AI lesson generation)
OPENROUTER_API_KEY=your-key-here

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

## Docker Environment

When using Docker, these are set automatically in `docker-compose.yml` and `docker-compose.production.yml`.
