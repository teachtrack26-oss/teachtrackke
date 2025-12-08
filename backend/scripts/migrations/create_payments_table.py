"""
Script to create the payments table for M-Pesa integration.
Run this once to set up the database.
"""

from database import engine
from sqlalchemy import text

def create_payments_table():
    """Create the payments table if it doesn't exist"""
    
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        transaction_code VARCHAR(50) UNIQUE,
        checkout_request_id VARCHAR(100) UNIQUE NOT NULL,
        merchant_request_id VARCHAR(100),
        status ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
        description VARCHAR(255),
        reference VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_checkout_request_id (checkout_request_id),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    try:
        with engine.connect() as conn:
            conn.execute(text(create_table_sql))
            conn.commit()
            print("✅ Payments table created successfully!")
            
            # Verify the table exists
            result = conn.execute(text("SHOW TABLES LIKE 'payments'"))
            row = result.fetchone()
            if row:
                print("✅ Verified: 'payments' table exists in database")
            else:
                print("❌ Error: Table was not created")
                
    except Exception as e:
        print(f"❌ Error creating payments table: {str(e)}")
        raise e


if __name__ == "__main__":
    create_payments_table()
