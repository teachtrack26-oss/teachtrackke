"""
Production Server Configuration for High Concurrency
Run this instead of main.py for production deployment
"""
import uvicorn
from main import app

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        workers=16,  # Run 16 worker processes (scaled for 2000 users)
        limit_concurrency=4000,  # Allow 4000 concurrent connections
        limit_max_requests=10000,  # Restart workers after 10k requests (prevents memory leaks)
        timeout_keep_alive=30,  # Keep connections alive for 30 seconds
        backlog=8192,  # Queue up to 8192 connections waiting for workers (4x increase)
        log_level="info",
        access_log=True,
        use_colors=True
    )
