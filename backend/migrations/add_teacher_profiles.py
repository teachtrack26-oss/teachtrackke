"""
Migration: Add Teacher Profiles Table
Date: November 29, 2025
Description: Creates teacher_profiles table for independent teachers to store
             their school context, teaching preferences, and professional details.

This migration does NOT modify the existing school_settings table.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine, SessionLocal

def run_migration():
    """Create the teacher_profiles table"""
    
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS teacher_profiles (
        -- Primary Key
        id INT PRIMARY KEY AUTO_INCREMENT,
        
        -- User Link (One-to-One relationship)
        user_id INT NOT NULL UNIQUE,
        
        -- School Context (for letterheads/documents)
        school_name VARCHAR(255),
        school_logo_url VARCHAR(500),
        school_address TEXT,
        school_phone VARCHAR(50),
        school_email VARCHAR(255),
        school_motto VARCHAR(500),
        principal_name VARCHAR(255),
        deputy_principal_name VARCHAR(255),
        county VARCHAR(100),
        sub_county VARCHAR(100),
        school_type VARCHAR(50),
        
        -- Teaching Preferences (defaults for new subjects)
        default_lessons_per_week INT DEFAULT 5,
        default_lesson_duration INT DEFAULT 40,
        default_double_lesson_duration INT DEFAULT 80,
        default_double_lessons_per_week INT DEFAULT 0,
        
        -- Professional Details
        tsc_number VARCHAR(50),
        registration_number VARCHAR(50),
        subjects_taught JSON,
        grade_levels_taught JSON,
        years_of_experience INT,
        qualifications TEXT,
        specialization VARCHAR(255),
        
        -- Academic Year Settings
        current_academic_year VARCHAR(20),
        default_term_weeks INT DEFAULT 13,
        
        -- Grades & Streams Configuration
        grades_offered JSON,
        streams_per_grade JSON,
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Foreign Key
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        
        -- Index for faster lookups
        INDEX idx_teacher_profile_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    print("=" * 60)
    print("Migration: Add Teacher Profiles Table")
    print("=" * 60)
    
    try:
        with engine.connect() as conn:
            # Check if table already exists
            result = conn.execute(text(
                "SELECT COUNT(*) FROM information_schema.tables "
                "WHERE table_schema = DATABASE() AND table_name = 'teacher_profiles'"
            ))
            table_exists = result.scalar() > 0
            
            if table_exists:
                print("⚠️  Table 'teacher_profiles' already exists. Skipping creation.")
            else:
                # Create the table
                conn.execute(text(create_table_sql))
                conn.commit()
                print("✅ Created 'teacher_profiles' table successfully!")
            
            # Verify the table structure
            result = conn.execute(text(
                "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT "
                "FROM information_schema.columns "
                "WHERE table_schema = DATABASE() AND table_name = 'teacher_profiles' "
                "ORDER BY ORDINAL_POSITION"
            ))
            columns = result.fetchall()
            
            print("\n📋 Table Structure:")
            print("-" * 60)
            print(f"{'Column':<30} {'Type':<15} {'Nullable':<10} {'Default'}")
            print("-" * 60)
            for col in columns:
                print(f"{col[0]:<30} {col[1]:<15} {col[2]:<10} {col[3] or '-'}")
            
            print("\n✅ Migration completed successfully!")
            
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        raise e

def rollback_migration():
    """Drop the teacher_profiles table (for rollback)"""
    
    print("=" * 60)
    print("Rollback: Dropping Teacher Profiles Table")
    print("=" * 60)
    
    try:
        with engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS teacher_profiles"))
            conn.commit()
            print("✅ Dropped 'teacher_profiles' table successfully!")
    except Exception as e:
        print(f"❌ Rollback failed: {str(e)}")
        raise e

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Teacher Profiles Migration")
    parser.add_argument('--rollback', action='store_true', help='Rollback the migration')
    args = parser.parse_args()
    
    if args.rollback:
        rollback_migration()
    else:
        run_migration()
