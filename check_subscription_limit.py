import sys
import os

# Add the backend directory to the python path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from backend.database import SessionLocal
from backend.models import User, Subject

def check_user_subscription(email):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User with email {email} not found.")
            return

        print(f"User: {user.full_name} ({user.email})")
        print(f"Role: {user.role}")
        print(f"Subscription Type: {user.subscription_type}")
        print(f"Subscription Status: {user.subscription_status}")
        
        subject_count = db.query(Subject).filter(Subject.user_id == user.id).count()
        print(f"Current Subject Count: {subject_count}")
        
        subjects = db.query(Subject).filter(Subject.user_id == user.id).all()
        for s in subjects:
            print(f" - {s.subject_name} ({s.grade})")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # I'll use the email from the previous context if available, or just list all users to find the one with 5 subjects
    # The user mentioned "kevintechie359@gmail.com" before, but that was the one I promoted to SCHOOL_ADMIN.
    # The user said "now have created an accunt for a teacher". I should probably list all users first to find the teacher account.
    pass

def list_all_users_subjects():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        for user in users:
            subject_count = db.query(Subject).filter(Subject.user_id == user.id).count()
            print(f"User: {user.email}, Role: {user.role}, Sub: {user.subscription_type}, Subjects: {subject_count}")
    finally:
        db.close()

if __name__ == "__main__":
    list_all_users_subjects()
