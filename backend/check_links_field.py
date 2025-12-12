from database import SessionLocal
from models import TemplateSubstrand, TemplateStrand, CurriculumTemplate
import json
from collections import defaultdict

db = SessionLocal()

try:
    # Get all templates
    templates = db.query(CurriculumTemplate).all()
    
    print(f"{'ID':<6} {'Subject':<30} {'Grade':<15} {'Total':<8} {'With Links':<12} {'%':<6}")
    print("-" * 85)
    
    for t in templates:
        total_sub = 0
        with_links = 0
        
        for strand in t.strands:
            for sub in strand.substrands:
                total_sub += 1
                links = sub.links_to_other_subjects
                if links and isinstance(links, list) and len(links) > 0:
                    with_links += 1
        
        if total_sub > 0:
            pct = (with_links / total_sub) * 100
            print(f"{t.id:<6} {t.subject[:28]:<30} {t.grade:<15} {total_sub:<8} {with_links:<12} {pct:.1f}%")
        else:
            print(f"{t.id:<6} {t.subject[:28]:<30} {t.grade:<15} {total_sub:<8} {with_links:<12} 0.0%")

except Exception as e:
    print(f"Error: {e}")
