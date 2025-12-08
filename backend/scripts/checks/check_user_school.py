from database import SessionLocal
from models import User, School

def check_user_status():
    db = SessionLocal()
    email = "kevadihxidic2015@gmail.com"
    
    try:
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            print(f"User: {user.email}")
            print(f"ID: {user.id}")
            print(f"Subscription Type: {user.subscription_type}")
            print(f"School ID: {user.school_id}")
            
            if user.school_id:
                school = db.query(School).filter(School.id == user.school_id).first()
                print(f"Linked School: {school.name} (ID: {school.id})")
                print(f"School Subscription: {school.subscription_status}")
            else:
                print("Not linked to any school.")
                
        else:
            print(f"User {email} not found.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_user_status()
