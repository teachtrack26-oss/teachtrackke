import os
import sys
from sqlalchemy import func

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User

def check_roles():
    db = SessionLocal()
    try:
        # Group by role and count
        roles = db.query(User.role, func.count(User.id)).group_by(User.role).all()
        print("Current Role Distribution:")
        for role, count in roles:
            print(f"- {role}: {count}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_roles()
