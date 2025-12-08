import os
import sys
from sqlalchemy import text

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User, UserRole, School

def fix_specific_roles():
    db = SessionLocal()
    try:
        # 1. kevinmugo359@gmail.com -> SUPER_ADMIN
        user1 = db.query(User).filter(User.email == "kevinmugo359@gmail.com").first()
        if user1:
            print(f"Updating {user1.email}: {user1.role} -> SUPER_ADMIN")
            user1.role = UserRole.SUPER_ADMIN
            user1.is_admin = True # Legacy flag
        else:
            print("User kevinmugo359@gmail.com not found")

        # 2. kevintechie359@gmail.com -> SCHOOL_ADMIN for "lms school"
        user2 = db.query(User).filter(User.email == "kevintechie359@gmail.com").first()
        if user2:
            print(f"Updating {user2.email}: {user2.role} -> SCHOOL_ADMIN")
            user2.role = UserRole.SCHOOL_ADMIN
            user2.is_admin = False # Not a super admin
            
            # Check for "lms school"
            school = db.query(School).filter(School.name.ilike("%lms school%")).first()
            if school:
                print(f"Linking {user2.email} to school: {school.name}")
                school.admin_id = user2.id
                user2.school_id = school.id
            else:
                print("School 'lms school' not found. Creating it...")
                new_school = School(name="LMS School", admin_id=user2.id)
                db.add(new_school)
                db.flush() # Get ID
                user2.school_id = new_school.id
                print(f"Created 'LMS School' (ID: {new_school.id}) and linked to user.")

        else:
            print("User kevintechie359@gmail.com not found")

        # 3. kevadihxidic2015@gmail.com -> TEACHER
        user3 = db.query(User).filter(User.email == "kevadihxidic2015@gmail.com").first()
        if user3:
            print(f"Updating {user3.email}: {user3.role} -> TEACHER")
            user3.role = UserRole.TEACHER
            user3.is_admin = False
        else:
            print("User kevadihxidic2015@gmail.com not found")

        db.commit()
        print("Specific role updates complete.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_specific_roles()
