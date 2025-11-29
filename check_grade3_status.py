import sys
import os

# Add the current directory and backend directory to sys.path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.database import SessionLocal
from backend.models import CurriculumTemplate, TemplateStrand

def check_grade_3_status():
    session = SessionLocal()
    try:
        templates = session.query(CurriculumTemplate).filter(CurriculumTemplate.grade == "Grade 3").all()
        
        print(f"Found {len(templates)} Grade 3 subjects in database:")
        print("-" * 60)
        print(f"{'Subject':<35} | {'ID':<5} | {'Strands':<8}")
        print("-" * 60)
        for t in templates:
            strand_count = session.query(TemplateStrand).filter(TemplateStrand.curriculum_template_id == t.id).count()
            print(f"{t.subject:<35} | {t.id:<5} | {strand_count:<8}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    check_grade_3_status()
