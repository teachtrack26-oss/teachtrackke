"""
Script to fix user subscription type back to INDIVIDUAL_BASIC
And check why lessons are showing 0/0
"""
import sys
sys.path.append('.')

from database import SessionLocal
from models import User, Subject, Strand, SubStrand, Lesson, SubscriptionType

def fix_and_check(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User not found: {email}")
            return
        
        print(f"\n{'='*80}")
        print(f"USER: {user.email}")
        print(f"Current Subscription Type: {user.subscription_type}")
        
        # Fix subscription type to INDIVIDUAL_BASIC for testing
        # user.subscription_type = SubscriptionType.INDIVIDUAL_BASIC
        # db.commit()
        # print(f"Updated Subscription Type: {user.subscription_type}")
        
        # Check subjects and their lesson counts
        subjects = db.query(Subject).filter(Subject.user_id == user.id).all()
        print(f"\nSubjects ({len(subjects)}):")
        
        for subj in subjects:
            strand_count = db.query(Strand).filter(Strand.subject_id == subj.id).count()
            substrand_count = db.query(SubStrand).join(Strand).filter(Strand.subject_id == subj.id).count()
            lesson_count = db.query(Lesson).join(SubStrand).join(Strand).filter(Strand.subject_id == subj.id).count()
            
            print(f"\n  📚 {subj.subject_name} - {subj.grade}")
            print(f"     ID: {subj.id}, Template ID: {subj.template_id}")
            print(f"     total_lessons (stored): {subj.total_lessons}")
            print(f"     lessons_completed: {subj.lessons_completed}")
            print(f"     Strands: {strand_count}")
            print(f"     SubStrands: {substrand_count}")
            print(f"     Lessons (actual): {lesson_count}")
            
            if subj.total_lessons == 0:
                print(f"     ⚠️ total_lessons is 0 - needs fixing!")
        
        print(f"\n{'='*80}")
        
    finally:
        db.close()

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else "zlatankent8112@gmail.com"
    fix_and_check(email)
