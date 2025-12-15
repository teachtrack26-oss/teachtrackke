from database import engine, Base
from sqlalchemy import text

def update_schedule_schema():
    with engine.connect() as conn:
        print("Updating school_schedules table...")
        
        # 1. Add school_id column
        try:
            conn.execute(text("ALTER TABLE school_schedules ADD COLUMN school_id INTEGER"))
            print("Added school_id column.")
        except Exception as e:
            print(f"Column school_id might already exist: {e}")

        # 2. Add Foreign Key constraint
        try:
            conn.execute(text("ALTER TABLE school_schedules ADD CONSTRAINT fk_schedule_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE"))
            print("Added FK constraint.")
        except Exception as e:
            print(f"FK constraint might already exist: {e}")

        # 3. Make user_id nullable (for school-wide schedules that might not be tied to a specific user, or just to allow flexibility)
        try:
            conn.execute(text("ALTER TABLE school_schedules MODIFY COLUMN user_id INTEGER NULL"))
            print("Made user_id nullable.")
        except Exception as e:
            print(f"Could not modify user_id: {e}")
            
        print("Schema update complete.")

if __name__ == "__main__":
    update_schedule_schema()
