"""
Script to check a user's role.
"""
import sys
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User

def check_user(email: str):
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User {email} not found")
            return
        
        print(f"User: {user.email}")
        print(f"Role: {user.role}")
        print(f"Subscription: {user.subscription_type}")
        
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python backend/check_user.py <email>")
        sys.exit(1)
    check_user(sys.argv[1])
