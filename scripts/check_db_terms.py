from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from urllib.parse import quote_plus

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

def check_terms():
    db = SessionLocal()
    try:
        print("Checking SchoolTerm table...")
        # Use text() for raw SQL
        result = db.execute(text("SELECT * FROM school_terms"))
        # Get column names
        keys = result.keys()
        rows = result.fetchall()
        if not rows:
            print("No terms found in school_terms table.")
        else:
            print(f"Found {len(rows)} terms:")
            for row in rows:
                # Convert row to dict for better readability
                row_dict = dict(zip(keys, row))
                print(row_dict)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_terms()
