from sqlalchemy.orm import Session
from database import SessionLocal
from models import CurriculumTemplate, TemplateStrand, TemplateSubstrand

def check_all_grades():
    db = SessionLocal()
    try:
        print("\n=== CURRICULUM IMPORT SUMMARY ===\n")
        
        # Get all templates ordered by grade and subject
        templates = db.query(CurriculumTemplate).order_by(CurriculumTemplate.grade, CurriculumTemplate.subject).all()
        
        if not templates:
            print("No curriculum found.")
            return

        current_grade = ""
        for temp in templates:
            if temp.grade != current_grade:
                print(f"\n--- {temp.grade} ---")
                current_grade = temp.grade
            
            # Count lessons
            total_lessons = 0
            strands = db.query(TemplateStrand).filter_by(curriculum_template_id=temp.id).all()
            
            for strand in strands:
                substrands = db.query(TemplateSubstrand).filter_by(strand_id=strand.id).all()
                for sub in substrands:
                    total_lessons += sub.number_of_lessons
            
            status = "✅ OK" if total_lessons > 20 else "⚠️ LOW"
            print(f"{temp.subject:<40} | Lessons: {total_lessons:<5} | {status}")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_all_grades()
