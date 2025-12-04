from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from urllib.parse import quote_plus
from backend.config import settings

# Credentials from config.py
DB_HOST = "localhost"
DB_PORT = 3306
DB_USER = "root"
DB_PASSWORD = "2078@lk//K."
DB_NAME = "teachtrack"

password = quote_plus(DB_PASSWORD)
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def migrate_db():
    db = SessionLocal()
    try:
        print("--- Applying Migration for Textbook Fields ---")
        
        # Check if column exists
        try:
            db.execute(text("SELECT default_textbook_name FROM template_substrands LIMIT 1"))
            print("✅ Columns already exist.")
        except Exception:
            print("⚠️ Columns missing. Adding them now...")
            db.execute(text("ALTER TABLE template_substrands ADD COLUMN default_textbook_name VARCHAR(255) NULL"))
            db.execute(text("ALTER TABLE template_substrands ADD COLUMN default_learner_book_pages VARCHAR(100) NULL"))
            db.execute(text("ALTER TABLE template_substrands ADD COLUMN default_teacher_guide_pages VARCHAR(100) NULL"))
            print("✅ Columns added successfully.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_db()
