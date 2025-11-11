"""
Apply database migration to add curriculum detail fields to sub_strands table
"""
from database import engine
from sqlalchemy import text

def apply_migration():
    print("Applying migration: Adding curriculum detail fields to sub_strands...")
    
    with open('../database/add_curriculum_fields.sql', 'r') as f:
        sql_content = f.read()
    
    statements = [s.strip() for s in sql_content.split(';') if s.strip()]
    
    with engine.connect() as conn:
        for i, statement in enumerate(statements, 1):
            try:
                print(f"\nExecuting statement {i}/{len(statements)}...")
                conn.execute(text(statement))
                conn.commit()
                print(f"✓ Statement {i} executed successfully")
            except Exception as e:
                error_msg = str(e)
                if "Duplicate column" in error_msg:
                    print(f"⚠ Column already exists, skipping...")
                else:
                    print(f"✗ Error: {error_msg}")
                    raise
    
    print("\n✓ Migration completed successfully!")
    
    # Verify columns were added
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'teachtrack' 
            AND TABLE_NAME = 'sub_strands'
            AND COLUMN_NAME IN (
                'specific_learning_outcomes',
                'suggested_learning_experiences',
                'core_competencies',
                'values',
                'pcis',
                'links_to_other_subjects'
            )
        """))
        
        columns = [row[0] for row in result]
        print(f"\nVerification: Found {len(columns)} new columns:")
        for col in columns:
            print(f"  ✓ {col}")

if __name__ == "__main__":
    apply_migration()
