"""
Database Replication Configuration for TeachTrack
Implements read/write splitting for 3x read capacity
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import NullPool
from config import settings
from typing import Generator
import os
import random

# Check if replication is enabled
REPLICATION_ENABLED = os.getenv('DATABASE_REPLICATION_ENABLED', 'false').lower() == 'true'

# Database URLs
MASTER_URL = settings.DATABASE_URL  # Master for writes
REPLICA_1_URL = os.getenv('DATABASE_REPLICA_1_URL', settings.DATABASE_URL)
REPLICA_2_URL = os.getenv('DATABASE_REPLICA_2_URL', settings.DATABASE_URL)

# Engine configuration for high concurrency
engine_config = {
    'pool_size': 400,
    'max_overflow': 800,
    'pool_pre_ping': True,
    'pool_recycle': 1800,
    'pool_reset_on_return': 'rollback',
    'connect_args': {
        'connect_timeout': 15,
        'read_timeout': 30,
        'write_timeout': 30
    },
    'echo': False
}

# Master database engine (for writes)
master_engine = create_engine(MASTER_URL, **engine_config)

# Read replica engines (for reads)
if REPLICATION_ENABLED:
    replica_engines = [
        create_engine(REPLICA_1_URL, **engine_config),
        create_engine(REPLICA_2_URL, **engine_config)
    ]
    print(f"[OK] Database replication enabled: 1 master + {len(replica_engines)} replicas")
else:
    # Fallback: use master for reads too
    replica_engines = [master_engine]
    print("[WARN] Database replication disabled - using master for all operations")

# Session factories
MasterSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=master_engine)
ReplicaSessionLocals = [sessionmaker(autocommit=False, autoflush=False, bind=engine) for engine in replica_engines]

Base = declarative_base()

# Round-robin replica selection
_replica_index = 0


def get_master_db() -> Generator[Session, None, None]:
    """
    Get master database session (for writes)
    Use this for: INSERT, UPDATE, DELETE operations
    """
    db = MasterSessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_replica_db() -> Generator[Session, None, None]:
    """
    Get replica database session (for reads)
    Use this for: SELECT operations
    Load balances across replicas using round-robin
    """
    global _replica_index
    replica_session = ReplicaSessionLocals[_replica_index % len(ReplicaSessionLocals)]()
    _replica_index += 1
    try:
        yield replica_session
    finally:
        replica_session.close()


def get_db() -> Generator[Session, None, None]:
    """
    Backward compatible get_db function
    Uses master by default (safe but not optimized)
    """
    db = MasterSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Query routing helper
class DatabaseRouter:
    """Helper to automatically route queries to master or replica"""
    
    @staticmethod
    def is_write_operation(query_str: str) -> bool:
        """Detect if query is a write operation"""
        query_upper = query_str.strip().upper()
        write_keywords = ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TRUNCATE']
        return any(query_upper.startswith(keyword) for keyword in write_keywords)
    
    @staticmethod
    def get_session_for_query(query: str) -> Session:
        """Get appropriate session based on query type"""
        if DatabaseRouter.is_write_operation(str(query)):
            return next(get_master_db())
        else:
            return next(get_replica_db())


# Add event listener to log slow queries (optional, for monitoring)
if os.getenv('LOG_SLOW_QUERIES', 'false').lower() == 'true':
    @event.listens_for(master_engine, "before_cursor_execute")
    def receive_before_cursor_execute(conn, cursor, statement, params, context, executemany):
        context._query_start_time = __import__('time').time()

    @event.listens_for(master_engine, "after_cursor_execute")
    def receive_after_cursor_execute(conn, cursor, statement, params, context, executemany):
        total = __import__('time').time() - context._query_start_time
        if total > 1:  # Log queries slower than 1 second
            print(f"[WARN] Slow query ({total:.2f}s): {statement[:100]}...")
