from database import SessionLocal
from models import User

def debug_user():
    db = SessionLocal()
    email = "kevadihxidic2015@gmail.com"
    
    try:
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            print(f"User ID: {user.id}")
            print(f"Email: {user.email}")
            print(f"Full Name: {user.full_name}")
            print(f"Role: {user.role}")
            print(f"Subscription Type: {user.subscription_type}")
            print(f"Is Admin: {user.is_admin}")
            print(f"Email Verified: {user.email_verified}")
            print(f"Created At: {user.created_at}")
            print(f"Is Trial Active: {user.is_trial_active}")
            print(f"Trial Days Remaining: {user.trial_days_remaining}")
        else:
            print(f"❌ User {email} not found.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_user()
