from database import SessionLocal
from models import User, Subject

def check_subjects():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "beryjed316@gmail.com").first()
        if not user:
            print("User not found")
            return

        subjects = db.query(Subject).filter(Subject.user_id == user.id).all()
        print(f"Found {len(subjects)} subjects for {user.email}")
        for s in subjects:
            print(f"ID: {s.id}, Name: {s.subject_name}, Grade: '{s.grade}'")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_subjects()
