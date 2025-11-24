"""
System Health Monitor for TeachTrack Production
Checks database connections, Redis, Celery workers, and API status
"""
import sys
import time
from datetime import datetime

def check_database():
    """Check database connection and active connections"""
    try:
        from database import engine, SessionLocal
        from sqlalchemy import text
        
        db = SessionLocal()
        result = db.execute(text("SELECT 1")).scalar()
        
        # Get connection stats
        stats = db.execute(text("""
            SELECT 
                (SELECT COUNT(*) FROM information_schema.processlist) as total_connections,
                (SELECT @@max_connections) as max_connections
        """)).fetchone()
        
        db.close()
        
        if result == 1:
            connection_usage = (stats[0] / stats[1]) * 100
            print(f"✅ Database: Connected ({stats[0]}/{stats[1]} connections, {connection_usage:.1f}% used)")
            
            if connection_usage > 80:
                print(f"   ⚠️  WARNING: High connection usage!")
            
            return True
        return False
    except Exception as e:
        print(f"❌ Database: Failed - {str(e)}")
        return False

def check_redis():
    """Check Redis connection"""
    try:
        import redis
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        
        r = redis.from_url(redis_url)
        r.ping()
        
        info = r.info()
        connected_clients = info.get('connected_clients', 0)
        used_memory_human = info.get('used_memory_human', 'Unknown')
        
        print(f"✅ Redis: Connected ({connected_clients} clients, {used_memory_human} memory)")
        return True
    except ImportError:
        print("⚠️  Redis: Not installed (pip install redis)")
        return None
    except Exception as e:
        print(f"❌ Redis: Failed - {str(e)}")
        return False

def check_celery():
    """Check Celery workers"""
    try:
        from celery_app import celery_app
        
        inspect = celery_app.control.inspect()
        stats = inspect.stats()
        
        if stats:
            worker_count = len(stats)
            print(f"✅ Celery: {worker_count} worker(s) active")
            
            for worker_name, worker_stats in stats.items():
                pool_size = worker_stats.get('pool', {}).get('max-concurrency', 'Unknown')
                print(f"   - {worker_name}: {pool_size} concurrent tasks")
            
            return True
        else:
            print("❌ Celery: No workers found")
            return False
    except ImportError:
        print("⚠️  Celery: Not installed")
        return None
    except Exception as e:
        print(f"❌ Celery: Failed - {str(e)}")
        return False

def check_api():
    """Check API health endpoint"""
    try:
        import requests
        
        response = requests.get('http://localhost:8000/health', timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API: {data.get('status', 'unknown')}")
            return True
        else:
            print(f"❌ API: HTTP {response.status_code}")
            return False
    except ImportError:
        print("⚠️  API check: requests not installed (pip install requests)")
        return None
    except Exception as e:
        print(f"❌ API: Failed - {str(e)}")
        return False

def main(continuous=False, interval=30):
    """Run all health checks"""
    
    while True:
        print("\n" + "="*60)
        print(f"TeachTrack System Health Check - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60 + "\n")
        
        results = {
            'database': check_database(),
            'redis': check_redis(),
            'celery': check_celery(),
            'api': check_api()
        }
        
        print("\n" + "-"*60)
        
        # Summary
        healthy = sum(1 for v in results.values() if v is True)
        total = sum(1 for v in results.values() if v is not None)
        
        if total > 0:
            health_percentage = (healthy / total) * 100
            print(f"Overall Health: {healthy}/{total} services healthy ({health_percentage:.0f}%)")
        
        if not continuous:
            break
        
        print(f"\nNext check in {interval} seconds... (Ctrl+C to stop)")
        try:
            time.sleep(interval)
        except KeyboardInterrupt:
            print("\n\nMonitoring stopped.")
            sys.exit(0)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='TeachTrack Health Monitor')
    parser.add_argument('--continuous', '-c', action='store_true', help='Run continuously')
    parser.add_argument('--interval', '-i', type=int, default=30, help='Check interval in seconds (default: 30)')
    
    args = parser.parse_args()
    
    main(continuous=args.continuous, interval=args.interval)
