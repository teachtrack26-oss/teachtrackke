from sqlalchemy.orm import Session
from database import SessionLocal
from models import CurriculumTemplate, TemplateStrand, TemplateSubstrand

def check_grade1():
    db = SessionLocal()
    try:
        print("\n=== EXISTING GRADE 1 CURRICULUM IN DATABASE ===\n")
        
        # Query for Grade 1 templates
        templates = db.query(CurriculumTemplate).filter(
            CurriculumTemplate.grade.ilike("%Grade 1%")
        ).all()
        
        if not templates:
            print("No Grade 1 curriculum found.")
            return

        for temp in templates:
            # Count lessons
            total_lessons = 0
            strands = db.query(TemplateStrand).filter_by(curriculum_template_id=temp.id).all()
            
            for strand in strands:
                substrands = db.query(TemplateSubstrand).filter_by(strand_id=strand.id).all()
                for sub in substrands:
                    total_lessons += sub.number_of_lessons
            
            print(f"ID: {temp.id} | Subject: {temp.subject} | Grade: {temp.grade}")
            print(f"   - Strands: {len(strands)}")
            print(f"   - Total Lessons: {total_lessons}")
            print("-" * 50)
            
    finally:
        db.close()

if __name__ == "__main__":
    check_grade1()
