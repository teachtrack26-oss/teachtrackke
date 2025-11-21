"""
Populate existing subjects with lessons from their templates
This script finds subjects that have 0 lessons and populates them from their curriculum templates.
"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from urllib.parse import quote_plus

# Add backend directory to path
sys.path.append(os.path.dirname(__file__))

from models import Subject, Strand, SubStrand, Lesson, CurriculumTemplate, TemplateStrand, TemplateSubstrand
from database import Base

# Load environment variables
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME", "teachtrack")

if not DB_PASSWORD:
    print("ERROR: DB_PASSWORD not found in .env file")
    sys.exit(1)

# URL-encode password
DB_PASSWORD_ENCODED = quote_plus(DB_PASSWORD)
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD_ENCODED}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def populate_subject_lessons(session, subject):
    """Populate a subject with lessons"""
    
    print(f"\nProcessing: {subject.subject_name} - {subject.grade} (ID: {subject.id})")
    
    # Check current lesson count
    current_lessons = session.query(Lesson).join(SubStrand).join(Strand).filter(
        Strand.subject_id == subject.id
    ).count()
    
    if current_lessons > 0:
        print(f"  Already has {current_lessons} lessons. Skipping.")
        return False
    
    # Get all substrands for this subject
    substrands = session.query(SubStrand).join(Strand).filter(
        Strand.subject_id == subject.id
    ).all()
    
    if not substrands:
        print("  No substrands found. Skipping.")
        return False
    
    print(f"  Found {len(substrands)} substrands")
    
    total_lessons_created = 0
    
    for substrand in substrands:
        num_lessons = substrand.lessons_count
        
        if num_lessons and num_lessons > 0:
            # Create lessons for this substrand
            for i in range(1, num_lessons + 1):
                new_lesson = Lesson(
                    substrand_id=substrand.id,
                    lesson_number=i,
                    lesson_title=f"Lesson {i}",
                    sequence_order=i,
                    is_completed=False
                )
                session.add(new_lesson)
                total_lessons_created += 1
    
    # Update subject total_lessons
    subject.total_lessons = total_lessons_created
    session.commit()
    
    print(f"  ✓ Created {total_lessons_created} lessons")
    return True

def main():
    session = Session()
    
    try:
        print("=" * 60)
        print("POPULATING SUBJECTS WITH LESSONS FROM TEMPLATES")
        print("=" * 60)
        
        # Get all subjects
        subjects = session.query(Subject).all()
        print(f"\nFound {len(subjects)} subjects total")
        
        updated_count = 0
        
        for subject in subjects:
            if populate_subject_lessons(session, subject):
                updated_count += 1
        
        print("\n" + "=" * 60)
        print(f"COMPLETE! Updated {updated_count} subjects")
        print("=" * 60)
        
    except Exception as e:
        session.rollback()
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    main()
