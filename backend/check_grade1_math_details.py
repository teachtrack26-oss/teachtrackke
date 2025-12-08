from sqlalchemy.orm import Session
from database import SessionLocal
from models import CurriculumTemplate, TemplateStrand, TemplateSubstrand

def check_math_details():
    db = SessionLocal()
    try:
        print("\n=== GRADE 1 MATHEMATICS DETAILED BREAKDOWN ===\n")
        
        # Get Grade 1 Math
        template = db.query(CurriculumTemplate).filter(
            CurriculumTemplate.subject == "Mathematics",
            CurriculumTemplate.grade == "Grade 1"
        ).first()
        
        if not template:
            print("Grade 1 Mathematics not found.")
            return

        print(f"Template ID: {template.id}")
        print(f"Subject: {template.subject}")
        print(f"Grade: {template.grade}")
        print("-" * 50)

        total_lessons = 0
        strands = db.query(TemplateStrand).filter_by(curriculum_template_id=template.id).order_by(TemplateStrand.sequence_order).all()
        
        for strand in strands:
            print(f"\nSTRAND {strand.strand_number}: {strand.strand_name}")
            
            substrands = db.query(TemplateSubstrand).filter_by(strand_id=strand.id).order_by(TemplateSubstrand.sequence_order).all()
            
            for sub in substrands:
                print(f"  {sub.substrand_number} {sub.substrand_name:<30} | Lessons: {sub.number_of_lessons}")
                total_lessons += sub.number_of_lessons
                
        print("-" * 50)
        print(f"TOTAL LESSONS: {total_lessons}")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_math_details()
