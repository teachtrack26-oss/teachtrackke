"""
Script to manually set a user as Super Admin.
Run this once to make yourself the Super Admin.

Usage:
    python backend/set_super_admin.py <your_email>

Example:
    python backend/set_super_admin.py admin@example.com
"""

import sys
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import User, UserRole, SubscriptionType, SubscriptionStatus

def set_super_admin(email: str):
    db: Session = SessionLocal()
    try:
        # Find user
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"❌ User with email '{email}' not found.")
            print("💡 Please register an account first, then run this script.")
            return False
        
        # Update to Super Admin
        user.role = UserRole.SUPER_ADMIN
        user.subscription_type = SubscriptionType.INDIVIDUAL_PREMIUM
        user.subscription_status = SubscriptionStatus.ACTIVE
        db.commit()
        
        print(f"✅ User '{email}' is now a Super Admin!")
        print(f"   Role: {user.role}")
        print(f"   Subscription: {user.subscription_type}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python backend/set_super_admin.py <email>")
        print("Example: python backend/set_super_admin.py admin@example.com")
        sys.exit(1)
    
    email = sys.argv[1]
    success = set_super_admin(email)
    sys.exit(0 if success else 1)
