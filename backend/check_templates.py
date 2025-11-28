"""
Check template data - verify strands and substrands exist in templates
"""
import sys
sys.path.append('.')

from database import SessionLocal
from models import CurriculumTemplate, TemplateStrand, TemplateSubstrand

def check_templates():
    db = SessionLocal()
    try:
        templates = db.query(CurriculumTemplate).filter(
            CurriculumTemplate.grade == "Grade 9"
        ).all()
        
        print(f"\n{'='*80}")
        print(f"GRADE 9 CURRICULUM TEMPLATES")
        print(f"{'='*80}")
        
        for t in templates:
            strand_count = db.query(TemplateStrand).filter(TemplateStrand.curriculum_template_id == t.id).count()
            substrand_count = db.query(TemplateSubstrand).join(TemplateStrand).filter(
                TemplateStrand.curriculum_template_id == t.id
            ).count()
            
            print(f"\n📘 Template ID {t.id}: {t.subject} - {t.grade}")
            print(f"   Education Level: {t.education_level}")
            print(f"   Strands: {strand_count}")
            print(f"   SubStrands: {substrand_count}")
            
            if substrand_count == 0:
                print(f"   ⚠️  NO SUBSTRANDS - This template is incomplete!")
                
                # Show strands
                strands = db.query(TemplateStrand).filter(TemplateStrand.curriculum_template_id == t.id).all()
                print(f"   Strands in DB:")
                for s in strands:
                    print(f"      - {s.strand_number}: {s.strand_name}")
        
        print(f"\n{'='*80}")
        
    finally:
        db.close()

if __name__ == "__main__":
    check_templates()
