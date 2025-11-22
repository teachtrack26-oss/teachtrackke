import os
import sys
from sqlalchemy import create_engine, text
from config import settings

def apply_migration():
    print("Applying sharing and notes migration...")
    
    engine = create_engine(settings.DATABASE_URL)
    
    tables = ['schemes_of_work', 'lesson_plans', 'records_of_work']
    
    with engine.connect() as connection:
        for table in tables:
            # Add share_token
            try:
                connection.execute(text(f"ALTER TABLE {table} ADD COLUMN share_token VARCHAR(64)"))
                connection.execute(text(f"ALTER TABLE {table} ADD CONSTRAINT uq_{table}_share_token UNIQUE (share_token)"))
                print(f"Added share_token to {table}")
            except Exception as e:
                print(f"Error adding share_token to {table}: {e}")

            # Add is_public
            try:
                connection.execute(text(f"ALTER TABLE {table} ADD COLUMN is_public BOOLEAN DEFAULT FALSE"))
                print(f"Added is_public to {table}")
            except Exception as e:
                print(f"Error adding is_public to {table}: {e}")

            # Add notes
            try:
                connection.execute(text(f"ALTER TABLE {table} ADD COLUMN notes TEXT"))
                print(f"Added notes to {table}")
            except Exception as e:
                print(f"Error adding notes to {table}: {e}")
            
        connection.commit()
        
    print("Migration complete!")

if __name__ == "__main__":
    apply_migration()
