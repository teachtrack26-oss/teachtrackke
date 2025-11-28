"""
Script to manually verify a user's email.
Run this if you can't access the verification link in your email.

Usage:
    python backend/verify_user.py <email>

Example:
    python backend/verify_user.py teacher@example.com
"""

import sys
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User

def verify_user_email(email: str):
    db: Session = SessionLocal()
    try:
        # Find user
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"❌ User with email '{email}' not found.")
            return False
        
        # Verify email
        user.email_verified = True
        user.is_active = True
        db.commit()
        
        print(f"✅ User '{email}' has been manually verified!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python backend/verify_user.py <email>")
        sys.exit(1)
    
    email = sys.argv[1]
    success = verify_user_email(email)
    sys.exit(0 if success else 1)
