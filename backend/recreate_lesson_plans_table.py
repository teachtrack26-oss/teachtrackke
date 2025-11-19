"""
Migration script to recreate the lesson_plans table with correct schema
This will DROP and recreate the table - WARNING: All lesson plan data will be lost!
"""

from sqlalchemy import create_engine, text
from config import settings

def recreate_lesson_plans_table():
    """Recreate the lesson_plans table with the correct schema"""
    
    engine = create_engine(settings.DATABASE_URL)
    
    commands = [
        "SET FOREIGN_KEY_CHECKS = 0",
        
        "DROP TABLE IF EXISTS lesson_plans",
        
        """CREATE TABLE lesson_plans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            subject_id INT NULL,
            scheme_lesson_id INT NULL,
            learning_area VARCHAR(255) NULL,
            grade VARCHAR(50) NULL,
            date DATE NULL,
            time VARCHAR(100) NULL,
            roll VARCHAR(100) NULL,
            strand_theme_topic TEXT NULL,
            sub_strand_sub_theme_sub_topic TEXT NULL,
            specific_learning_outcomes TEXT NULL,
            key_inquiry_questions TEXT NULL,
            core_competences TEXT NULL,
            values_to_be_developed TEXT NULL,
            pcis_to_be_addressed TEXT NULL,
            learning_resources TEXT NULL,
            introduction TEXT NULL,
            development TEXT NULL,
            conclusion TEXT NULL,
            summary TEXT NULL,
            reflection_self_evaluation TEXT NULL,
            status VARCHAR(50) DEFAULT 'draft',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
            FOREIGN KEY (scheme_lesson_id) REFERENCES scheme_lessons(id) ON DELETE SET NULL,
            
            INDEX idx_user_id (user_id),
            INDEX idx_subject_id (subject_id),
            INDEX idx_scheme_lesson_id (scheme_lesson_id),
            INDEX idx_status (status),
            INDEX idx_date (date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci""",
        
        "SET FOREIGN_KEY_CHECKS = 1"
    ]
    
    try:
        with engine.connect() as conn:
            print("⚠️  WARNING: This will delete all existing lesson plan data!")
            print("Proceeding in 2 seconds...")
            import time
            time.sleep(2)
            
            for i, command in enumerate(commands, 1):
                print(f"\nExecuting step {i}/{len(commands)}...")
                conn.execute(text(command))
                conn.commit()
                print(f"✓ Step {i} completed")
            
            print("\n✓ lesson_plans table recreated successfully!")
            
            # Verify the table was created
            result = conn.execute(text("SHOW TABLES LIKE 'lesson_plans'"))
            if result.fetchone():
                print("✓ Table verified in database")
                
                # Show table structure
                result = conn.execute(text("DESCRIBE lesson_plans"))
                print("\nTable structure:")
                for row in result:
                    print(f"  {row[0]}: {row[1]}")
            else:
                print("✗ Table creation may have failed")
                
    except Exception as e:
        print(f"\n✗ Error: {e}")
        raise
    finally:
        engine.dispose()

if __name__ == "__main__":
    print("=" * 60)
    print("RECREATE LESSON PLANS TABLE")
    print("=" * 60)
    recreate_lesson_plans_table()
    print("\n" + "=" * 60)
    print("Migration complete!")
    print("Restart your backend server for changes to take effect.")
    print("=" * 60)
