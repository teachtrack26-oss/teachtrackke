#!/usr/bin/env python3
"""
Apply professional records database migration
"""

import mysql.connector
from config import settings
import sys

def apply_migration():
    """Apply the professional records migration"""
    try:
        # Connect to MySQL
        print(f"Connecting to MySQL at {settings.DB_HOST}...")
        connection = mysql.connector.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            database=settings.DB_NAME
        )
        
        cursor = connection.cursor()
        
        # Read SQL file
        print("Reading migration file...")
        with open('../database/add_professional_records.sql', 'r', encoding='utf-8') as f:
            sql_script = f.read()
        
        # Split into individual statements
        statements = [s.strip() for s in sql_script.split(';') if s.strip()]
        
        print(f"Executing {len(statements)} SQL statements...")
        
        # Execute each statement
        for i, statement in enumerate(statements, 1):
            if statement:
                print(f"  [{i}/{len(statements)}] Executing statement...")
                cursor.execute(statement)
        
        # Commit changes
        connection.commit()
        print("✓ Migration applied successfully!")
        
        # Verify tables were created
        cursor.execute("SHOW TABLES LIKE 'schemes_of_work'")
        if cursor.fetchone():
            print("✓ schemes_of_work table created")
        
        cursor.execute("SHOW TABLES LIKE 'scheme_weeks'")
        if cursor.fetchone():
            print("✓ scheme_weeks table created")
        
        cursor.execute("SHOW TABLES LIKE 'scheme_lessons'")
        if cursor.fetchone():
            print("✓ scheme_lessons table created")
        
        cursor.execute("SHOW TABLES LIKE 'lesson_plans'")
        if cursor.fetchone():
            print("✓ lesson_plans table created")
        
        cursor.execute("SHOW TABLES LIKE 'records_of_work'")
        if cursor.fetchone():
            print("✓ records_of_work table created")
        
        cursor.close()
        connection.close()
        
        print("\n✓ All professional records tables created successfully!")
        
    except mysql.connector.Error as err:
        print(f"✗ MySQL Error: {err}")
        sys.exit(1)
    except FileNotFoundError:
        print("✗ Migration file not found: ../database/add_professional_records.sql")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("=" * 60)
    print("Professional Records Database Migration")
    print("=" * 60)
    apply_migration()
