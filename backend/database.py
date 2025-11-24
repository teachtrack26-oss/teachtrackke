from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

# Create engine with ultra-high-concurrency configuration
# Supports up to 2000 concurrent connections (pool_size + max_overflow)
# Optimized for enterprise-scale deployment
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=1800,   # Recycle connections every 30 minutes (faster turnover)
    pool_size=400,       # Persistent connections (increased for 2000 users)
    max_overflow=800,    # Additional connections when under heavy load
    pool_timeout=45,     # Wait 45 seconds for a connection before failing
    pool_reset_on_return='rollback',  # Reset connections on return
    connect_args={
        "connect_timeout": 15,  # MySQL connection timeout
        "read_timeout": 30,     # Read timeout for long queries
        "write_timeout": 30     # Write timeout for large inserts
    },
    echo=False  # Set to True only when debugging SQL queries
)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency for getting DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
