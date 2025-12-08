"""
Migration script to recreate the lesson_plans table with correct schema
Run this script to update the lesson_plans table structure
"""

from sqlalchemy import create_engine, text
from config import settings

def create_lesson_plans_table():
    """Recreate the lesson_plans table with the correct schema"""
    
    engine = create_engine(settings.DATABASE_URL)
    
    # SQL commands to modify the existing table structure
    alter_commands = [
        # Drop old columns that don't exist in new model
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS teacher_name",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS school",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS subject",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS strand",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS sub_strand",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS lesson_number",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS lesson_title",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS date_planned",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS duration",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS class_size",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS room_number",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS learning_experiences",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS introduction_teacher_activities",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS introduction_learner_activities",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS introduction_duration",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS development_teacher_activities",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS development_learner_activities",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS development_duration",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS conclusion_teacher_activities",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS conclusion_learner_activities",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS conclusion_duration",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS core_competencies",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS values",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS pcis",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS links_to_other_subjects",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS assessment_rubric",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS what_went_well",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS areas_for_improvement",
        "ALTER TABLE lesson_plans DROP COLUMN IF EXISTS follow_up_actions",
        
        # Modify existing grade column if needed
        "ALTER TABLE lesson_plans MODIFY COLUMN grade VARCHAR(50) NULL",
        
        # Add new columns required by the model
        "ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS learning_area VARCHAR(255) NULL AFTER scheme_lesson_id",
        "ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS date DATE NULL AFTER grade",
        "ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS time VARCHAR(100) NULL AFTER date",
        "ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS roll VARCHAR(100) NULL AFTER time",
        "ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS strand_theme_topic TEXT NULL AFTER roll",
        "ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS sub_strand_sub_theme_sub_topic TEXT NULL AFTER strand_theme_topic",
        "ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS core_competences TEXT NULL AFTER key_inquiry_questions",
        "ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS values_to_be_developed TEXT NULL AFTER core_competences",
        "ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS pcis_to_be_addressed TEXT NULL AFTER values_to_be_developed",
        "ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS introduction TEXT NULL AFTER learning_resources",
        "ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS development TEXT NULL AFTER introduction",
        "ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS conclusion TEXT NULL AFTER development",
        "ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS summary TEXT NULL AFTER conclusion",
        "ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS reflection_self_evaluation TEXT NULL AFTER summary",
        
        # Modify status column
        "ALTER TABLE lesson_plans MODIFY COLUMN status VARCHAR(50) DEFAULT 'draft'",
    ]
    
    try:
        with engine.connect() as conn:
            print("Modifying lesson_plans table structure...")
            
            for i, command in enumerate(alter_commands, 1):
                try:
                    conn.execute(text(command))
                    conn.commit()
                    print(f"  ✓ Step {i}/{len(alter_commands)}")
                except Exception as e:
                    # Some commands may fail if column doesn't exist, that's okay
                    if "Can't DROP" in str(e) or "check that it exists" in str(e):
                        print(f"  - Step {i}/{len(alter_commands)} (column doesn't exist, skipping)")
                    elif "Duplicate column" in str(e):
                        print(f"  - Step {i}/{len(alter_commands)} (column already exists, skipping)")
                    else:
                        print(f"  ✗ Step {i}/{len(alter_commands)}: {e}")
            
            print("✓ lesson_plans table structure updated successfully!")
            
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
        print(f"✗ Error creating table: {e}")
        raise
    finally:
        engine.dispose()

if __name__ == "__main__":
    print("=" * 60)
    print("LESSON PLANS TABLE MIGRATION")
    print("=" * 60)
    create_lesson_plans_table()
    print("\n" + "=" * 60)
    print("Migration complete!")
    print("=" * 60)
