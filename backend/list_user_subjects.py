"""List all subjects for all users"""
from database import SessionLocal
from models import Subject, User

db = SessionLocal()
try:
    users = db.query(User).all()
    print(f"\n📚 Found {len(users)} users:\n")
    
    for user in users:
        print(f"User: {user.email} (ID: {user.id})")
        subjects = db.query(Subject).filter(Subject.user_id == user.id).all()
        if subjects:
            for s in subjects:
                print(f"  - {s.subject_name} {s.grade} (Subject ID: {s.id})")
        else:
            print("  (no subjects)")
        print()
finally:
    db.close()
