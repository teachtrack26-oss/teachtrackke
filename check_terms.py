from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

# Assuming default local connection string or getting it from env if possible, 
# but for this environment usually it's hardcoded or in .env. 
# I'll try to read .env or just guess standard local.
# Actually, I can import get_db from database.py if I set up python path.

import sys
sys.path.append("c:/Users/MKT/desktop/teachtrack/backend")
from database import SessionLocal

def check_terms():
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT * FROM school_terms WHERE year = 2025")).fetchall()
        print(f"Found {len(result)} terms for 2025:")
        for row in result:
            print(row)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_terms()
