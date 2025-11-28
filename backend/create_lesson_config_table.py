"""
Migration script to create the lesson_configurations table.
Run this script once to add the table to the database.
"""
from database import engine
from sqlalchemy import text

def create_lesson_configurations_table():
    """Create the lesson_configurations table if it doesn't exist."""
    
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS lesson_configurations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject_name VARCHAR(255) NOT NULL,
        grade VARCHAR(50) NOT NULL,
        education_level VARCHAR(100),
        lessons_per_week INT DEFAULT 5,
        double_lessons_per_week INT DEFAULT 0,
        single_lesson_duration INT DEFAULT 40,
        double_lesson_duration INT DEFAULT 80,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY ix_lesson_config_subject_grade (subject_name, grade),
        INDEX ix_lesson_configurations_id (id)
    )
    """
    
    with engine.connect() as conn:
        try:
            conn.execute(text(create_table_sql))
            conn.commit()
            print("✓ Successfully created lesson_configurations table")
        except Exception as e:
            # Table might already exist or different error
            error_str = str(e)
            if "already exists" in error_str.lower():
                print("✓ Table lesson_configurations already exists")
            else:
                print(f"✗ Error creating table: {e}")
                raise

if __name__ == "__main__":
    print("Creating lesson_configurations table...")
    create_lesson_configurations_table()
    print("Done!")
