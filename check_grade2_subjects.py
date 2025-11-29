import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the current directory to the python path so we can import backend modules
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.models import CurriculumTemplate, TemplateStrand
from backend.database import SessionLocal

# Database setup
session = SessionLocal()

def check_grade2_subjects():
    print("Checking Grade 2 subjects...")
    
    subjects = session.query(CurriculumTemplate).filter_by(grade="Grade 2").all()
    
    print("-" * 60)
    print(f"{'Subject':<35} | {'ID':<5} | {'Strands'}")
    print("-" * 60)
    
    for subject in subjects:
        strand_count = session.query(TemplateStrand).filter_by(curriculum_template_id=subject.id).count()
        print(f"{subject.subject:<35} | {subject.id:<5} | {strand_count}")

if __name__ == "__main__":
    check_grade2_subjects()
