import os
import sys
from sqlalchemy import create_engine, text
from config import settings

def apply_migration():
    print("Applying archive migration...")
    
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as connection:
        # Check if columns exist before adding them
        
        # 1. schemes_of_work
        try:
            connection.execute(text("ALTER TABLE schemes_of_work ADD COLUMN is_archived BOOLEAN DEFAULT FALSE"))
            print("Added is_archived to schemes_of_work")
        except Exception as e:
            print(f"schemes_of_work: {e}")

        # 2. lesson_plans
        try:
            connection.execute(text("ALTER TABLE lesson_plans ADD COLUMN is_archived BOOLEAN DEFAULT FALSE"))
            print("Added is_archived to lesson_plans")
        except Exception as e:
            print(f"lesson_plans: {e}")

        # 3. records_of_work
        try:
            connection.execute(text("ALTER TABLE records_of_work ADD COLUMN is_archived BOOLEAN DEFAULT FALSE"))
            print("Added is_archived to records_of_work")
        except Exception as e:
            print(f"records_of_work: {e}")
            
        connection.commit()
        
    print("Migration complete!")

if __name__ == "__main__":
    apply_migration()
