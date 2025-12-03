import sys
import os

# Add the backend directory to sys.path so imports within backend modules work
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from urllib.parse import quote_plus
# Now we can import from models, but we need to be careful about how models imports database
# If models.py says "from database import Base", and we added backend to path, it should work.
from models import User, School, SchoolSettings, SchoolTerm

# Credentials from config.py
DB_HOST = "localhost"
DB_PORT = 3306
DB_USER = "root"
DB_PASSWORD = "2078@lk//K."
DB_NAME = "teachtrack"

password = quote_plus(DB_PASSWORD)
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def verify_setup():
    db = SessionLocal()
    email = "kevintechie359@gmail.com"
    
    try:
        print(f"--- Verifying setup for {email} ---")
        
        # 1. Check User
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"❌ User {email} not found!")
            return
        
        print(f"✅ User found: ID={user.id}, Name={user.full_name}, Role={user.role}")
        print(f"   User School ID: {user.school_id}")
        
        # 2. Check School (managed by user)
        school_managed = db.query(School).filter(School.admin_id == user.id).first()
        if school_managed:
            print(f"✅ User manages School: ID={school_managed.id}, Name='{school_managed.name}'")
        else:
            print(f"⚠️ User does not manage any school (School.admin_id != User.id)")
            
        # 3. Check School (user belongs to)
        school_belongs = None
        if user.school_id:
            school_belongs = db.query(School).filter(School.id == user.school_id).first()
            if school_belongs:
                print(f"✅ User belongs to School: ID={school_belongs.id}, Name='{school_belongs.name}'")
            else:
                print(f"❌ User has school_id={user.school_id} but school not found!")
        else:
            print(f"⚠️ User has no school_id set.")

        target_school = school_managed or school_belongs
        
        if not target_school:
            print("❌ No target school identified for this user.")
        else:
            # 4. Check SchoolSettings
            # Since SchoolSettings doesn't have school_id, let's list all settings and try to match by name
            print(f"--- Searching for SchoolSettings for '{target_school.name}' ---")
            all_settings = db.query(SchoolSettings).all()
            
            matched_settings = None
            for s in all_settings:
                print(f"   Found Settings ID={s.id}, Name='{s.school_name}'")
                if s.school_name.lower() == target_school.name.lower():
                    matched_settings = s
                    print(f"   ✅ MATCH FOUND!")
            
            if matched_settings:
                print(f"✅ Using SchoolSettings ID={matched_settings.id}")
                
                # 5. Check Terms linked to Settings
                terms = db.query(SchoolTerm).filter(SchoolTerm.school_settings_id == matched_settings.id).all()
                if terms:
                    print(f"✅ Found {len(terms)} terms linked to SchoolSettings ID={matched_settings.id}:")
                    for t in terms:
                        print(f"   - Term {t.term_number} ({t.year}): {t.start_date} to {t.end_date}")
                        if t.mid_term_break_start:
                            print(f"     Mid Term: {t.mid_term_break_start} to {t.mid_term_break_end}")
                else:
                    print(f"❌ No terms found linked to SchoolSettings ID={matched_settings.id}")
            else:
                print(f"❌ No matching SchoolSettings found for School '{target_school.name}'")
                
        # 6. Check Orphaned/Global Terms (school_settings_id is NULL)
        print("\n--- Checking Global/Orphaned Terms ---")
        global_terms = db.query(SchoolTerm).filter(SchoolTerm.school_settings_id == None).all()
        if global_terms:
            print(f"⚠️ Found {len(global_terms)} terms with school_settings_id=NULL (Global?):")
            for t in global_terms:
                print(f"   - ID={t.id}, Term {t.term_number} ({t.year}): {t.start_date} to {t.end_date}")
        else:
            print("No global/orphaned terms found.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_setup()
