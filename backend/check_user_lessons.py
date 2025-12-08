from database import SessionLocal
from models import User, Subject, Lesson, Strand, SubStrand
from sqlalchemy import func

db = SessionLocal()
user_email = "beryjed316@gmail.com"
user = db.query(User).filter(User.email == user_email).first()

if not user:
    print(f"User {user_email} not found")
else:
    print(f"Checking subjects for {user.email} (ID: {user.id})")
    subjects = db.query(Subject).filter(Subject.user_id == user.id).all()
    print(f"Found {len(subjects)} subjects.")
    
    for subject in subjects:
        lesson_count = db.query(func.count(Lesson.id))\
            .join(SubStrand, Lesson.substrand_id == SubStrand.id)\
            .join(Strand, SubStrand.strand_id == Strand.id)\
            .filter(Strand.subject_id == subject.id)\
            .scalar()
        print(f"  - {subject.subject_name} ({subject.grade}): {lesson_count} lessons")

db.close()
