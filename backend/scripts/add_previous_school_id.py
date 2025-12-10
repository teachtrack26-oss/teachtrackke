"""
Migration script to add previous_school_id column to users table.
Run this script to add tracking for previously linked schools.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine
from sqlalchemy import text

def add_previous_school_id_column():
    """Add previous_school_id column to users table"""
    
    with engine.connect() as conn:
        # Check if column already exists
        result = conn.execute(text("""
            SELECT COUNT(*) as cnt 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'previous_school_id'
        """))
        row = result.fetchone()
        
        if row[0] > 0:
            print("✓ Column 'previous_school_id' already exists in users table")
            return
        
        # Add the column
        print("Adding 'previous_school_id' column to users table...")
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN previous_school_id INT NULL,
            ADD CONSTRAINT fk_previous_school 
            FOREIGN KEY (previous_school_id) REFERENCES schools(id) ON DELETE SET NULL
        """))
        conn.commit()
        print("✓ Successfully added 'previous_school_id' column")

if __name__ == "__main__":
    add_previous_school_id_column()
    print("\n✅ Migration completed!")
