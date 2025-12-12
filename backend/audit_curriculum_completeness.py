from database import SessionLocal
from models import TemplateSubstrand, CurriculumTemplate
import json

db = SessionLocal()

def is_empty(value):
    if value is None:
        return True
    if isinstance(value, list) and len(value) == 0:
        return True
    if isinstance(value, str) and not value.strip():
        return True
    return False

try:
    templates = db.query(CurriculumTemplate).order_by(CurriculumTemplate.grade, CurriculumTemplate.subject).all()
    
    print(f"{'Grade':<10} {'Subject':<30} {'Missing Fields ( > 50% empty)'}")
    print("-" * 100)
    
    for t in templates:
        total_sub = 0
        missing_counts = {
            "Specific Outcomes": 0,
            "Learning Exp.": 0,
            "Inquiry Qs": 0,
            "Core Comp.": 0,
            "Values": 0,
            "PCIs": 0,
            "Links": 0
        }
        
        for strand in t.strands:
            for sub in strand.substrands:
                total_sub += 1
                if is_empty(sub.specific_learning_outcomes): missing_counts["Specific Outcomes"] += 1
                if is_empty(sub.suggested_learning_experiences): missing_counts["Learning Exp."] += 1
                if is_empty(sub.key_inquiry_questions): missing_counts["Inquiry Qs"] += 1
                if is_empty(sub.core_competencies): missing_counts["Core Comp."] += 1
                if is_empty(sub.values): missing_counts["Values"] += 1
                if is_empty(sub.pcis): missing_counts["PCIs"] += 1
                if is_empty(sub.links_to_other_subjects): missing_counts["Links"] += 1
        
        if total_sub == 0:
            print(f"{t.grade:<10} {t.subject[:28]:<30} NO SUBSTRANDS FOUND")
            continue

        missing_fields = []
        for field, count in missing_counts.items():
            percentage_missing = (count / total_sub) * 100
            if percentage_missing > 50: # Threshold for reporting
                missing_fields.append(f"{field} ({percentage_missing:.0f}%)")
        
        if missing_fields:
            print(f"{t.grade:<10} {t.subject[:28]:<30} {', '.join(missing_fields)}")

except Exception as e:
    print(f"Error: {e}")
