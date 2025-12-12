from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import CurriculumTemplate
import sys
import os

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def determine_education_level(grade: str) -> str:
    """Determine CBC education level from grade"""
    if not grade:
        return "Junior Secondary"
        
    grade_upper = str(grade).upper()
    
    if "PP1" in grade_upper or "PP2" in grade_upper:
        return "Pre-Primary"
    elif any(g in grade_upper for g in ["GRADE 1", "GRADE 2", "GRADE 3"]):
        return "Lower Primary"
    elif any(g in grade_upper for g in ["GRADE 4", "GRADE 5", "GRADE 6"]):
        return "Upper Primary"
    elif any(g in grade_upper for g in ["GRADE 7", "GRADE 8", "GRADE 9"]):
        return "Junior Secondary"
    elif any(g in grade_upper for g in ["GRADE 10", "GRADE 11", "GRADE 12"]):
        return "Senior Secondary"
    
    return "Junior Secondary"

def fix_education_levels():
    db = SessionLocal()
    try:
        templates = db.query(CurriculumTemplate).all()
        print(f"Found {len(templates)} templates. Checking education levels...")
        
        updated_count = 0
        for template in templates:
            correct_level = determine_education_level(template.grade)
            
            if template.education_level != correct_level:
                print(f"Updating {template.subject} ({template.grade}): {template.education_level} -> {correct_level}")
                template.education_level = correct_level
                updated_count += 1
        
        if updated_count > 0:
            db.commit()
            print(f"Successfully updated {updated_count} templates.")
        else:
            print("No templates needed updating.")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_education_levels()
