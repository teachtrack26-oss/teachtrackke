"""
Verify that template data has all curriculum details
"""
from database import engine
from sqlalchemy import text

def verify_template_data():
    print("Verifying Template ID 3 (Grade 9 Mathematics) has curriculum details...")
    
    with engine.connect() as conn:
        # Check template_substrands
        result = conn.execute(text("""
            SELECT 
                ts.substrand_name,
                ts.specific_learning_outcomes IS NOT NULL as has_outcomes,
                ts.suggested_learning_experiences IS NOT NULL as has_experiences,
                ts.core_competencies IS NOT NULL as has_competencies,
                ts.values IS NOT NULL as has_values,
                ts.pcis IS NOT NULL as has_pcis,
                ts.links_to_other_subjects IS NOT NULL as has_links
            FROM template_substrands ts
            JOIN template_strands t ON ts.strand_id = t.id
            WHERE t.curriculum_template_id = 3
            LIMIT 3
        """))
        
        substrands = result.fetchall()
        
        if not substrands:
            print("❌ No template substrands found!")
            return
        
        print(f"\n✓ Found {len(substrands)} substrands to check:\n")
        
        for ss in substrands:
            print(f"Sub-strand: {ss[0]}")
            print(f"  - Has Specific Outcomes: {bool(ss[1])}")
            print(f"  - Has Experiences: {bool(ss[2])}")
            print(f"  - Has Competencies: {bool(ss[3])}")
            print(f"  - Has Values: {bool(ss[4])}")
            print(f"  - Has PCIs: {bool(ss[5])}")
            print(f"  - Has Links: {bool(ss[6])}")
            print()
        
        # Check one sample to see actual data
        result = conn.execute(text("""
            SELECT 
                ts.substrand_name,
                ts.specific_learning_outcomes,
                ts.suggested_learning_experiences
            FROM template_substrands ts
            JOIN template_strands t ON ts.strand_id = t.id
            WHERE t.curriculum_template_id = 3
            LIMIT 1
        """))
        
        sample = result.fetchone()
        if sample:
            print(f"\n📋 Sample data from '{sample[0]}':")
            print(f"\nSpecific Learning Outcomes:")
            print(sample[1])
            print(f"\nSuggested Learning Experiences:")
            print(sample[2])

if __name__ == "__main__":
    verify_template_data()
