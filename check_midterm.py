import sys
import os
from datetime import datetime

# Add the backend directory to sys.path so imports within backend modules work
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from urllib.parse import quote_plus
from models import SchoolTerm

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

def check_midterm_duration():
    db = SessionLocal()
    try:
        print("--- Checking Mid-Term Break Duration ---")
        
        # Fetch all terms to be sure
        terms = db.query(SchoolTerm).all()
        
        if not terms:
            print("No terms found in the database.")
            return

        for term in terms:
            print(f"\nTerm ID: {term.id}, Term {term.term_number} ({term.year})")
            
            start_str = term.mid_term_break_start
            end_str = term.mid_term_break_end
            
            if start_str and end_str:
                print(f"  Mid-Term Start: {start_str}")
                print(f"  Mid-Term End:   {end_str}")
                
                try:
                    start_date = datetime.strptime(start_str, "%Y-%m-%d")
                    end_date = datetime.strptime(end_str, "%Y-%m-%d")
                    
                    # Calculate duration (inclusive of start and end date usually implies +1 day in human terms, 
                    # but let's see the difference first)
                    delta = end_date - start_date
                    days = delta.days + 1 # Inclusive
                    
                    print(f"  Duration:       {days} days")
                    
                    # Day of week
                    print(f"  Start Day:      {start_date.strftime('%A')}")
                    print(f"  End Day:        {end_date.strftime('%A')}")
                    
                except ValueError as e:
                    print(f"  Error parsing dates: {e}")
            else:
                print("  No Mid-Term break dates set.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_midterm_duration()
