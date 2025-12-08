import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from database import SessionLocal
from models import User

def check_user():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "beryjed316@gmail.com").first()
        if user:
            print(f"User: {user.email}")
            print(f"Role: {user.role}")
            print(f"Subscription Type: {user.subscription_type}")
            print(f"Subscription Status: {user.subscription_status}")
            print(f"Subject Count: {len(user.subjects)}")
        else:
            print("User not found")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_user()
