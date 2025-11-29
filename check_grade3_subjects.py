import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the current directory and backend directory to sys.path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.database import SessionLocal
from backend.models import CurriculumTemplate, TemplateStrand

def check_grade3_subjects():
    db = SessionLocal()
    try:
        print("Checking Grade 3 subjects...")
        print("-" * 60)
        print(f"{'Subject':<35} | {'ID':<5} | {'Strands'}")
        print("-" * 60)
        
        subjects = db.query(CurriculumTemplate).filter(
            CurriculumTemplate.grade == "Grade 3"
        ).all()
        
        for subject in subjects:
            strand_count = db.query(TemplateStrand).filter(
                TemplateStrand.curriculum_template_id == subject.id
            ).count()
            print(f"{subject.subject:<35} | {subject.id:<5} | {strand_count}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_grade3_subjects()
