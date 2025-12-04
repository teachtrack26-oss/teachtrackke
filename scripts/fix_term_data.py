import sys
import os

# Add the backend directory to sys.path so imports within backend modules work
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from urllib.parse import quote_plus
from models import SchoolTerm, SchoolSettings

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

def fix_term_link():
    db = SessionLocal()
    try:
        print("--- Fixing SchoolTerm Link ---")
        
        # 1. Get the first SchoolSettings (since main.py uses .first())
        settings = db.query(SchoolSettings).first()
        if not settings:
            print("❌ No SchoolSettings found! Cannot link term.")
            return
        
        print(f"✅ Found SchoolSettings: ID={settings.id}, Name='{settings.school_name}'")
        
        # 2. Find the orphaned term (Term 2, 2025)
        term = db.query(SchoolTerm).filter(
            SchoolTerm.term_number == 2, 
            SchoolTerm.year == 2025,
            SchoolTerm.school_settings_id == None
        ).first()
        
        if term:
            print(f"✅ Found Orphaned Term: ID={term.id}, Term {term.term_number} ({term.year})")
            print(f"   Current school_settings_id: {term.school_settings_id}")
            
            # 3. Update the link
            term.school_settings_id = settings.id
            db.commit()
            print(f"✅ UPDATED: Linked Term {term.id} to SchoolSettings {settings.id}")
        else:
            print("⚠️ No orphaned Term 2 (2025) found. Checking if it's already linked...")
            linked_term = db.query(SchoolTerm).filter(
                SchoolTerm.term_number == 2, 
                SchoolTerm.year == 2025,
                SchoolTerm.school_settings_id == settings.id
            ).first()
            if linked_term:
                print(f"✅ Term 2 (2025) is already linked to SchoolSettings {settings.id}")
            else:
                print("❌ Term 2 (2025) not found at all.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_term_link()
