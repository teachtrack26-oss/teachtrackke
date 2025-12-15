from database import engine
from sqlalchemy import text

def add_columns():
    with engine.connect() as conn:
        # Check if columns exist
        try:
            conn.execute(text("SELECT result_desc FROM payments LIMIT 1"))
            print("Column 'result_desc' already exists.")
        except Exception:
            print("Adding 'result_desc' column...")
            conn.execute(text("ALTER TABLE payments ADD COLUMN result_desc VARCHAR(255) NULL"))
            
        try:
            conn.execute(text("SELECT mpesa_metadata FROM payments LIMIT 1"))
            print("Column 'mpesa_metadata' already exists.")
        except Exception:
            print("Adding 'mpesa_metadata' column...")
            conn.execute(text("ALTER TABLE payments ADD COLUMN mpesa_metadata JSON NULL"))
            
        conn.commit()
        print("Payments table updated successfully.")

if __name__ == "__main__":
    add_columns()
