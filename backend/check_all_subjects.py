from database import SessionLocal
from models import Subject, Strand, SubStrand, Lesson

db = SessionLocal()

# Get all subjects
subjects = db.query(Subject).all()

print(f"Total subjects in database: {len(subjects)}\n")

for subject in subjects:
    # Count strands
    strands = db.query(Strand).filter(Strand.subject_id == subject.id).count()
    
    # Count substrands
    substrands = db.query(SubStrand).join(Strand).filter(Strand.subject_id == subject.id).count()
    
    # Count lessons
    lessons = db.query(Lesson).join(SubStrand).join(Strand).filter(
        Strand.subject_id == subject.id
    ).count()
    
    print(f"Subject: {subject.subject_name} (ID: {subject.id})")
    print(f"  Grade: {subject.grade}")
    print(f"  User ID: {subject.user_id}")
    print(f"  Strands: {strands}")
    print(f"  SubStrands: {substrands}")
    print(f"  Lessons: {lessons}")
    print(f"  Total Lessons (field): {subject.total_lessons}")
    print(f"  Lessons Completed: {subject.lessons_completed}")
    print(f"  Progress: {subject.progress_percentage}%")
    print()

db.close()
