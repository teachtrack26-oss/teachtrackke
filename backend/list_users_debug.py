import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User

def list_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"{'ID':<5} {'Email':<30} {'Role':<15} {'Is Admin':<10} {'School ID'}")
        print("-" * 80)
        for user in users:
            print(f"{user.id:<5} {user.email:<30} {str(user.role):<15} {str(user.is_admin):<10} {user.school_id}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
