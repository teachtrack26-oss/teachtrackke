"""
Fix subjects that were created with broken templates
Delete and allow user to re-add
"""
import sys
sys.path.append('.')

from database import SessionLocal
from models import User, Subject, Strand, SubStrand, Lesson

def fix_user_subjects(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User not found: {email}")
            return
        
        print(f"\n{'='*80}")
        print(f"Fixing subjects for: {user.email}")
        print(f"{'='*80}")
        
        subjects = db.query(Subject).filter(Subject.user_id == user.id).all()
        
        subjects_to_delete = []
        for subj in subjects:
            # Count lessons
            lesson_count = db.query(Lesson).join(SubStrand).join(Strand).filter(
                Strand.subject_id == subj.id
            ).count()
            
            if lesson_count == 0 or subj.total_lessons == 0:
                subjects_to_delete.append(subj)
                print(f"\n  ❌ Will delete: {subj.subject_name} - {subj.grade}")
                print(f"     Reason: 0 lessons (broken import)")
            else:
                print(f"\n  ✅ Keep: {subj.subject_name} - {subj.grade}")
                print(f"     Lessons: {lesson_count}")
        
        if subjects_to_delete:
            print(f"\n{'='*80}")
            confirm = input(f"Delete {len(subjects_to_delete)} broken subjects? (yes/no): ")
            if confirm.lower() == 'yes':
                for subj in subjects_to_delete:
                    # Delete lessons, substrands, strands first
                    strands = db.query(Strand).filter(Strand.subject_id == subj.id).all()
                    for strand in strands:
                        substrands = db.query(SubStrand).filter(SubStrand.strand_id == strand.id).all()
                        for ss in substrands:
                            db.query(Lesson).filter(Lesson.substrand_id == ss.id).delete()
                        db.query(SubStrand).filter(SubStrand.strand_id == strand.id).delete()
                    db.query(Strand).filter(Strand.subject_id == subj.id).delete()
                    db.delete(subj)
                db.commit()
                print(f"\n✅ Deleted {len(subjects_to_delete)} broken subjects")
                print(f"   User can now re-add them from the fixed templates!")
            else:
                print("Cancelled.")
        else:
            print("\nNo broken subjects found.")
        
        print(f"\n{'='*80}")
        
    finally:
        db.close()

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else "zlatankent8112@gmail.com"
    fix_user_subjects(email)
