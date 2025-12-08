import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import Base, engine, SessionLocal
from models import User, School, UserRole

def fix_admin_roles():
    db = SessionLocal()
    try:
        print("Checking for role inconsistencies...")
        
        # 1. Fix Super Admins (Legacy is_admin=True)
        super_admins = db.query(User).filter(User.is_admin == True).all()
        for user in super_admins:
            if user.role != UserRole.SUPER_ADMIN:
                print(f"Fixing Super Admin: {user.email} (Current Role: {user.role}) -> SUPER_ADMIN")
                user.role = UserRole.SUPER_ADMIN
        
        # 2. Fix School Admins (Users who manage a school)
        schools = db.query(School).filter(School.admin_id.isnot(None)).all()
        for school in schools:
            if school.admin_id:
                admin_user = db.query(User).filter(User.id == school.admin_id).first()
                if admin_user and admin_user.role != UserRole.SCHOOL_ADMIN and admin_user.role != UserRole.SUPER_ADMIN:
                    print(f"Fixing School Admin: {admin_user.email} (School: {school.name}) -> SCHOOL_ADMIN")
                    admin_user.role = UserRole.SCHOOL_ADMIN

        # 3. Fix None Roles (Default to TEACHER)
        none_role_users = db.query(User).filter(User.role == None).all()
        for user in none_role_users:
            print(f"Fixing None Role: {user.email} -> TEACHER")
            user.role = UserRole.TEACHER

        db.commit()
        print("Role fix complete.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_admin_roles()
