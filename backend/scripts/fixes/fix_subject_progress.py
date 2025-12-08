"""
Fix Script: Recalculate Total Lessons for All Subjects
This script iterates through all subjects, counts their actual lessons, and updates the 'total_lessons' field.
It also recalculates 'lessons_completed' and 'progress_percentage' to ensure data consistency.
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from urllib.parse import quote_plus

# Add backend directory to path to import models
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.models import Subject, Strand, SubStrand, Lesson
from backend.database import Base

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

def fix_subject_progress():
    session = Session()
    try:
        print("Starting Subject Progress Fix...")
        
        # Get all subjects
        subjects = session.query(Subject).all()
        print(f"Found {len(subjects)} subjects to check.")
        
        updated_count = 0
        
        for subject in subjects:
            print(f"\nChecking Subject: {subject.subject_name} (ID: {subject.id})")
            
            # Count total lessons for this subject
            # Join Subject -> Strand -> SubStrand -> Lesson
            total_lessons = session.query(Lesson).join(SubStrand).join(Strand).filter(
                Strand.subject_id == subject.id
            ).count()
            
            # Count completed lessons
            completed_lessons = session.query(Lesson).join(SubStrand).join(Strand).filter(
                Strand.subject_id == subject.id,
                Lesson.is_completed == True
            ).count()
            
            # Calculate progress percentage
            if total_lessons > 0:
                progress_percentage = (completed_lessons / total_lessons) * 100
            else:
                progress_percentage = 0.0
            
            # Check if updates are needed
            needs_update = False
            
            if subject.total_lessons != total_lessons:
                print(f"  - Updating total_lessons: {subject.total_lessons} -> {total_lessons}")
                subject.total_lessons = total_lessons
                needs_update = True
                
            if subject.lessons_completed != completed_lessons:
                print(f"  - Updating lessons_completed: {subject.lessons_completed} -> {completed_lessons}")
                subject.lessons_completed = completed_lessons
                needs_update = True
                
            # Compare float values with small tolerance
            if abs(float(subject.progress_percentage or 0) - progress_percentage) > 0.01:
                print(f"  - Updating progress_percentage: {subject.progress_percentage}% -> {progress_percentage:.2f}%")
                subject.progress_percentage = progress_percentage
                needs_update = True
            
            if needs_update:
                updated_count += 1
            else:
                print("  - Data is already correct.")
        
        session.commit()
        print(f"\nFix Complete! Updated {updated_count} subjects.")
        
    except Exception as e:
        session.rollback()
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    fix_subject_progress()
