from fastapi import Request, HTTPException
import time

# Simple in-memory store: {ip: [timestamps]}
request_history = {}

def rate_limiter(limit: int = 5, window_seconds: int = 60):
    """
    Rate limiter dependency.
    limit: Max requests allowed in the window.
    window_seconds: Time window in seconds.
    """
    def dependency(request: Request):
        client_ip = request.client.host
        now = time.time()
        
        if client_ip not in request_history:
            request_history[client_ip] = []
            
        # Clean up old requests
        request_history[client_ip] = [t for t in request_history[client_ip] if now - t < window_seconds]
        
        if len(request_history[client_ip]) >= limit:
            raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
            
        request_history[client_ip].append(now)
        
    return dependency
