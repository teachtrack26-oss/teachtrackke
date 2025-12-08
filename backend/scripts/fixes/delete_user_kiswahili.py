"""Delete user's Kiswahili subject so they can re-import with correct structure"""
from database import SessionLocal
from models import Subject, User

db = SessionLocal()
try:
    # Find the user (kevin)
    user = db.query(User).filter(User.email == 'kevinmugo359@gmail.com').first()
    
    if not user:
        # Try to find any user with subjects
        user = db.query(User).filter(User.id == 2).first()
    
    if user:
        # Find and delete Kiswahili subject
        kiswahili_subject = db.query(Subject).filter(
            Subject.user_id == user.id,
            Subject.subject_name == 'Kiswahili',
            Subject.grade == 'Grade 9'
        ).first()
        
        if kiswahili_subject:
            print(f"Found Kiswahili subject (ID: {kiswahili_subject.id}) for user {user.email}")
            db.delete(kiswahili_subject)
            db.commit()
            print(f"✅ Deleted Kiswahili Grade 9 for {user.email}")
            print(f"   Now go to: http://192.168.0.102:3000/curriculum/select")
            print(f"   And re-import Kiswahili to get the correct structure!")
        else:
            print(f"❌ No Kiswahili subject found for user {user.email}")
    else:
        print("❌ No user found in database")
finally:
    db.close()
