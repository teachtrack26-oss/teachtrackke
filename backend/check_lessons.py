from database import SessionLocal
from models import Subject, Strand, SubStrand, Lesson

db = SessionLocal()

# Get first subject
subject = db.query(Subject).first()

if subject:
    print(f"Subject: {subject.subject_name} (ID: {subject.id})")
    print(f"Total lessons in subject: {subject.total_lessons}")
    
    # Get strands
    strands = db.query(Strand).filter(Strand.subject_id == subject.id).all()
    print(f"Strands: {len(strands)}")
    
    # Check first strand
    if strands:
        strand = strands[0]
        print(f"\nStrand {strand.strand_code}: {strand.strand_name}")
        
        # Get substrands
        substrands = db.query(SubStrand).filter(SubStrand.strand_id == strand.id).all()
        print(f"  SubStrands: {len(substrands)}")
        
        # Check first 2 substrands
        for ss in substrands[:2]:
            lessons = db.query(Lesson).filter(Lesson.substrand_id == ss.id).all()
            print(f"\n  SubStrand {ss.substrand_code}: {ss.substrand_name}")
            print(f"    Lessons: {len(lessons)}")
            if lessons:
                print(f"    First lesson: ID={lessons[0].id}, Number={lessons[0].lesson_number}, Title={lessons[0].lesson_title}")
else:
    print("No subjects found in database")

db.close()
