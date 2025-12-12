
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from models import CurriculumTemplate
from config import settings

from urllib.parse import quote_plus

# Setup DB connection
encoded_password = quote_plus(settings.DB_PASSWORD)
DATABASE_URL = f"mysql+pymysql://{settings.DB_USER}:{encoded_password}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def check_curriculum():
    print("--- Curriculum Template Audit ---")
    
    # Get all templates
    templates = db.query(CurriculumTemplate).order_by(CurriculumTemplate.grade, CurriculumTemplate.subject).all()
    
    # Group by grade
    by_grade = {}
    for t in templates:
        if t.grade not in by_grade:
            by_grade[t.grade] = []
        by_grade[t.grade].append(t.subject)
        
    total_count = 0
    
    # Print summary
    print(f"\nTotal Templates Found: {len(templates)}")
    
    # Define expected order for clarity
    grade_order = [
        "Grade 1", "Grade 2", "Grade 3", 
        "Grade 4", "Grade 5", "Grade 6", 
        "Grade 7", "Grade 8", "Grade 9"
    ]
    
    for grade in grade_order:
        if grade in by_grade:
            subjects = by_grade[grade]
            count = len(subjects)
            total_count += count
            print(f"\n{grade} ({count} subjects):")
            for sub in sorted(subjects):
                print(f"  - {sub}")
        else:
            print(f"\n{grade}: No templates found")

    # Check for any other grades
    for grade, subjects in by_grade.items():
        if grade not in grade_order:
            count = len(subjects)
            total_count += count
            print(f"\n{grade} (Other) ({count} subjects):")
            for sub in sorted(subjects):
                print(f"  - {sub}")

if __name__ == "__main__":
    check_curriculum()
