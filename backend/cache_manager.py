"""
Redis Caching Layer for TeachTrack
Implements caching for frequently accessed data to reduce database load
"""
import redis
import json
import os
from functools import wraps
from typing import Optional, Any, Callable
from dotenv import load_dotenv

load_dotenv()

class CacheManager:
    """Centralized cache management using Redis"""
    
    def __init__(self):
        self.redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        self.cache_enabled = os.getenv('CACHE_ENABLED', 'true').lower() == 'true'
        self.default_ttl = int(os.getenv('CACHE_TTL', '3600'))  # 1 hour default
        
        if not self.cache_enabled:
            print("[INFO] Redis cache disabled via config")
            self.redis_client = None
            return

        try:
            self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
            self.redis_client.ping()
            print(f"[OK] Redis cache connected: {self.redis_url}")
        except Exception as e:
            print(f"[WARN] Redis cache not available: {e}")
            self.redis_client = None
            self.cache_enabled = False
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.cache_enabled or not self.redis_client:
            return None
        
        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache with TTL"""
        if not self.cache_enabled or not self.redis_client:
            return False
        
        try:
            ttl = ttl or self.default_ttl
            serialized = json.dumps(value, default=str)
            self.redis_client.setex(key, ttl, serialized)
            return True
        except Exception as e:
            print(f"Cache set error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.cache_enabled or not self.redis_client:
            return False
        
        try:
            self.redis_client.delete(key)
            return True
        except Exception as e:
            print(f"Cache delete error: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern"""
        if not self.cache_enabled or not self.redis_client:
            return 0
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            print(f"Cache delete pattern error: {e}")
            return 0
    
    def cache_response(self, key_prefix: str, ttl: Optional[int] = None):
        """
        Decorator to cache API responses
        Usage: @cache.cache_response('subjects', ttl=1800)
        """
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                # Build cache key from function name and arguments
                cache_key = f"{key_prefix}:{func.__name__}"
                
                # Add user_id from kwargs if present
                if 'current_user' in kwargs and hasattr(kwargs['current_user'], 'id'):
                    cache_key += f":user:{kwargs['current_user'].id}"
                
                # Add other identifiers from kwargs
                for key in ['subject_id', 'scheme_id', 'lesson_plan_id']:
                    if key in kwargs:
                        cache_key += f":{key}:{kwargs[key]}"
                
                # Try to get from cache
                cached_value = self.get(cache_key)
                if cached_value is not None:
                    return cached_value
                
                # Execute function
                result = await func(*args, **kwargs)
                
                # Cache the result
                self.set(cache_key, result, ttl)
                
                return result
            
            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                # Build cache key
                cache_key = f"{key_prefix}:{func.__name__}"
                
                # Add user_id from kwargs if present
                if 'current_user' in kwargs and hasattr(kwargs['current_user'], 'id'):
                    cache_key += f":user:{kwargs['current_user'].id}"
                
                # Add other identifiers
                for key in ['subject_id', 'scheme_id', 'lesson_plan_id']:
                    if key in kwargs:
                        cache_key += f":{key}:{kwargs[key]}"
                
                # Try to get from cache
                cached_value = self.get(cache_key)
                if cached_value is not None:
                    return cached_value
                
                # Execute function
                result = func(*args, **kwargs)
                
                # Cache the result
                self.set(cache_key, result, ttl)
                
                return result
            
            # Return appropriate wrapper based on function type
            import inspect
            if inspect.iscoroutinefunction(func):
                return async_wrapper
            else:
                return sync_wrapper
        
        return decorator
    
    def invalidate_user_cache(self, user_id: int):
        """Invalidate all cache entries for a user"""
        pattern = f"*:user:{user_id}*"
        deleted = self.delete_pattern(pattern)
        print(f"Invalidated {deleted} cache entries for user {user_id}")
        return deleted

# Global cache instance
cache = CacheManager()


# Cache key builders
def build_cache_key(prefix: str, **kwargs) -> str:
    """Build a cache key from prefix and parameters"""
    key = prefix
    for k, v in sorted(kwargs.items()):
        key += f":{k}:{v}"
    return key


# Common cache TTLs
class CacheTTL:
    """Standard TTL values for different data types"""
    STATIC_DATA = 86400  # 24 hours (rarely changes)
    USER_DATA = 3600     # 1 hour (user-specific data)
    LIST_DATA = 1800     # 30 minutes (lists of items)
    DETAIL_DATA = 900    # 15 minutes (detail views)
    QUERY_RESULT = 300   # 5 minutes (query results)
