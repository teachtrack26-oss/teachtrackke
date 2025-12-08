"""
Apply curriculum templates migration to the database
"""
import os
from database import engine
from sqlalchemy import text

def apply_migration():
    """Apply the curriculum templates schema migration"""
    
    # Read the migration SQL file
    migration_file = os.path.join(
        os.path.dirname(__file__), 
        "..", 
        "database", 
        "curriculum_templates_schema.sql"
    )
    
    with open(migration_file, 'r', encoding='utf-8') as f:
        migration_sql = f.read()
    
    # Split into individual statements (separated by semicolons)
    statements = [s.strip() for s in migration_sql.split(';') if s.strip()]
    
    with engine.connect() as conn:
        for i, statement in enumerate(statements, 1):
            try:
                print(f"Executing statement {i}/{len(statements)}...")
                conn.execute(text(statement))
                conn.commit()
                print(f"  ✓ Success")
            except Exception as e:
                error_msg = str(e)
                # Ignore "duplicate column" and "duplicate index" errors (already applied)
                if "Duplicate column name" in error_msg or "already exists" in error_msg or "Duplicate key name" in error_msg:
                    print(f"  ⚠ Skipped (already exists)")
                else:
                    print(f"  ✗ Error: {error_msg}")
                    raise
    
    print("\n✅ Migration applied successfully!")
    
    # Verify tables exist
    print("\nVerifying tables...")
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME IN ('curriculum_templates', 'template_strands', 'template_substrands')
        """))
        tables = [row[0] for row in result]
        
        if len(tables) == 3:
            print("  ✓ All curriculum template tables exist")
        else:
            print(f"  ✗ Missing tables. Found: {tables}")
        
        # Check subjects table has template_id
        result = conn.execute(text("""
            SELECT COLUMN_NAME 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'subjects' 
            AND COLUMN_NAME = 'template_id'
        """))
        
        if result.fetchone():
            print("  ✓ subjects.template_id column exists")
        else:
            print("  ✗ subjects.template_id column missing")

if __name__ == "__main__":
    print("Applying curriculum templates migration...\n")
    apply_migration()
