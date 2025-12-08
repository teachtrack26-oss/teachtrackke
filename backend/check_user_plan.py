from database import SessionLocal
from models import User

db = SessionLocal()
user = db.query(User).filter(User.email == "beryjed316@gmail.com").first()

if user:
    print(f"User: {user.email}")
    print(f"Role: {user.role}")
    print(f"Subscription Type: {user.subscription_type}")
    print(f"Subscription Status: {user.subscription_status}")
    print(f"Subject Count: {len(user.subjects)}")
else:
    print("User not found")
