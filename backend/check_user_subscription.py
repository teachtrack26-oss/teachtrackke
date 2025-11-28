"""
Script to check user's subscription type and subject count
"""
import sys
sys.path.append('.')

from database import SessionLocal
from models import User, Subject, SubscriptionType

def check_user(email: str = None):
    db = SessionLocal()
    try:
        if email:
            users = db.query(User).filter(User.email == email).all()
        else:
            # Get all users
            users = db.query(User).all()
        
        print("\n" + "="*80)
        print("USER SUBSCRIPTION CHECK")
        print("="*80)
        
        for user in users:
            subject_count = db.query(Subject).filter(Subject.user_id == user.id).count()
            
            print(f"\nUser: {user.email}")
            print(f"  ID: {user.id}")
            print(f"  Role: {user.role}")
            print(f"  Subscription Type: {user.subscription_type}")
            print(f"  Subscription Status: {user.subscription_status}")
            print(f"  Subject Count: {subject_count}")
            
            # Check if limit should apply
            if user.subscription_type == SubscriptionType.INDIVIDUAL_BASIC:
                print(f"  ⚠️  LIMIT APPLIES: Max 4 subjects (Currently: {subject_count}/4)")
                if subject_count > 4:
                    print(f"  ❌ EXCEEDED LIMIT!")
            else:
                print(f"  ✅ No limit (subscription: {user.subscription_type})")
            
            # Show subjects
            subjects = db.query(Subject).filter(Subject.user_id == user.id).all()
            if subjects:
                print(f"  Subjects:")
                for i, subj in enumerate(subjects, 1):
                    print(f"    {i}. {subj.subject_name} - {subj.grade} (ID: {subj.id})")
        
        print("\n" + "="*80)
        
    finally:
        db.close()

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else None
    check_user(email)
