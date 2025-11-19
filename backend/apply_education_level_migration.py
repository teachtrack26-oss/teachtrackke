import logging
from sqlalchemy import text
from database import engine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def apply_migration():
    """
    Add education_level column to school_schedules table
    """
    try:
        with engine.connect() as connection:
            # Check if column exists
            check_query = text("""
                SELECT COUNT(*)
                FROM information_schema.columns 
                WHERE table_schema = DATABASE()
                AND table_name = 'school_schedules' 
                AND column_name = 'education_level'
            """)
            
            result = connection.execute(check_query).scalar()
            
            if result == 0:
                logger.info("Adding education_level column to school_schedules table...")
                alter_query = text("ALTER TABLE school_schedules ADD COLUMN education_level VARCHAR(255) NULL")
                connection.execute(alter_query)
                connection.commit()
                logger.info("Migration applied successfully!")
            else:
                logger.info("Column education_level already exists. Skipping.")
                
    except Exception as e:
        logger.error(f"Error applying migration: {str(e)}")
        raise

if __name__ == "__main__":
    apply_migration()
