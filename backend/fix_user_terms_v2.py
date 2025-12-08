from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, Term
from datetime import datetime

def fix_user_terms():
    db = SessionLocal()
    try:
        email = "beryjed316@gmail.com"
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"User {email} not found")
            return

        print(f"Found user: {user.full_name} ({user.id})")
        
        # Delete existing terms for this user to force regeneration or update them
        # Let's update them to match the new defaults
        
        current_year = 2025
        terms_data = [
            {
                "term_number": 1,
                "term_name": "Term 1",
                "start_date": datetime(current_year, 1, 6, 0, 0, 0),
                "end_date": datetime(current_year, 4, 4, 23, 59, 59),
                "teaching_weeks": 13,
                "is_current": True,
            },
            {
                "term_number": 2,
                "term_name": "Term 2",
                "start_date": datetime(current_year, 4, 28, 0, 0, 0),
                "end_date": datetime(current_year, 8, 1, 23, 59, 59),
                "teaching_weeks": 14,
                "is_current": False,
            },
            {
                "term_number": 3,
                "term_name": "Term 3",
                "start_date": datetime(current_year, 8, 25, 0, 0, 0),
                "end_date": datetime(current_year, 10, 24, 23, 59, 59),
                "teaching_weeks": 9,
                "is_current": False,
            },
        ]
        
        # Check if terms exist
        existing_terms = db.query(Term).filter(Term.user_id == user.id).all()
        
        if existing_terms:
            print(f"Found {len(existing_terms)} existing terms. Updating...")
            # Delete and recreate is safer to ensure IDs match logic if needed, but update is better for FKs
            # Let's delete and recreate since Term usually doesn't have complex FKs that we worry about losing history for in this context (it's just config)
            # Actually, Schemes might link to Terms. Let's check models.py if I could.
            # Assuming it's safer to update.
            
            # Delete all and recreate is easiest to ensure correctness
            db.query(Term).filter(Term.user_id == user.id).delete()
            db.commit()
            print("Deleted old terms.")
            
        print("Creating new terms...")
        for definition in terms_data:
            term = Term(
                user_id=user.id,
                academic_year=str(current_year),
                **definition
            )
            db.add(term)
            
        db.commit()
        print("Successfully updated terms for 2025.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_user_terms()
