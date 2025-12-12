from backend.database import SessionLocal
from backend.models import TemplateSubstrand, CurriculumTemplate
from sqlalchemy import func

db = SessionLocal()

# Check if column exists (by trying to query it)
try:
    # Count total substrands
    total = db.query(TemplateSubstrand).count()
    
    # Count substrands with non-empty links
    # We check for non-null and non-empty JSON array
    # Note: In JSON column, empty array is '[]'
    
    # For MySQL/SQLite JSON, we might need specific syntax, but let's try python side filtering first
    all_substrands = db.query(TemplateSubstrand).all()
    
    with_links = 0
    sample_links = []
    
    for s in all_substrands:
        links = s.links_to_other_subjects
        if links and len(links) > 0 and links != []:
            with_links += 1
            if len(sample_links) < 5:
                sample_links.append({
                    "id": s.id,
                    "name": s.substrand_name,
                    "links": links
                })
                
    print(f"Total Substrands: {total}")
    print(f"Substrands with Links: {with_links}")
    print(f"Percentage: {(with_links/total)*100:.2f}%")
    
    if sample_links:
        print("\nSample Links:")
        for sample in sample_links:
            print(sample)
            
except Exception as e:
    print(f"Error: {e}")
