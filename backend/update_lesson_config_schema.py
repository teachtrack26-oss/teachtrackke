from database import engine, Base
from sqlalchemy import text

def update_schema():
    with engine.connect() as conn:
        print("Updating lesson_configurations table...")
        
        # 1. Add school_id column if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE lesson_configurations ADD COLUMN school_id INTEGER"))
            print("Added school_id column.")
        except Exception as e:
            print(f"Column school_id might already exist: {e}")

        # 2. Add Foreign Key constraint
        try:
            conn.execute(text("ALTER TABLE lesson_configurations ADD CONSTRAINT fk_lesson_config_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE"))
            print("Added FK constraint.")
        except Exception as e:
            print(f"FK constraint might already exist: {e}")

        # 3. Drop old index if exists
        try:
            conn.execute(text("DROP INDEX ix_lesson_config_subject_grade ON lesson_configurations"))
            print("Dropped old index.")
        except Exception as e:
            print(f"Old index might not exist: {e}")

        # 4. Add new unique index
        try:
            conn.execute(text("CREATE UNIQUE INDEX ix_lesson_config_school_subject_grade ON lesson_configurations (school_id, subject_name, grade)"))
            print("Created new unique index.")
        except Exception as e:
            print(f"New index might already exist: {e}")
            
        print("Schema update complete.")

if __name__ == "__main__":
    update_schema()
