from backend.auth import create_access_token
from backend.database import SessionLocal
from backend.models import User

db = SessionLocal()
user = db.query(User).filter(User.id == 1).first()
if user:
    token = create_access_token(data={"sub": user.email})
    print(f"Bearer {token}")
else:
    print("User not found")
