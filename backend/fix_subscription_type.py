"""
Fix user subscription type to INDIVIDUAL_BASIC
"""
import sys
sys.path.append('.')

from database import SessionLocal
from models import User, SubscriptionType

def fix_subscription(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User not found: {email}")
            return
        
        print(f"\nBEFORE:")
        print(f"  User: {user.email}")
        print(f"  Subscription Type: {user.subscription_type}")
        
        # Update to INDIVIDUAL_BASIC
        user.subscription_type = SubscriptionType.INDIVIDUAL_BASIC
        db.commit()
        db.refresh(user)
        
        print(f"\nAFTER:")
        print(f"  User: {user.email}")
        print(f"  Subscription Type: {user.subscription_type}")
        print(f"\n✅ User subscription updated to INDIVIDUAL_BASIC")
        print(f"   Now the 4-subject limit will apply!")
        
    finally:
        db.close()

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else "zlatankent8112@gmail.com"
    fix_subscription(email)
