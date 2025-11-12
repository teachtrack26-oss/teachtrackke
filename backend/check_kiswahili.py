"""Check Kiswahili substrand details"""
from database import SessionLocal
from models import CurriculumTemplate, TemplateStrand, TemplateSubstrand
from sqlalchemy.orm import joinedload

db = SessionLocal()
try:
    # Get Kiswahili template with strands
    template = db.query(CurriculumTemplate).options(
        joinedload(CurriculumTemplate.strands).joinedload(TemplateStrand.substrands)
    ).filter(
        CurriculumTemplate.subject == 'Kiswahili',
        CurriculumTemplate.grade == 'Grade 9'
    ).first()
    
    if template:
        print(f"\n📚 {template.subject} {template.grade}")
        print(f"   Strands: {len(template.strands)}\n")
        
        # Show first few substrands from strand 14.0
        strand_14 = [s for s in template.strands if s.strand_number == '14.0']
        if strand_14:
            strand = strand_14[0]
            print(f"  Strand {strand.strand_number}: {strand.strand_name}")
            print(f"  Sub-strands: {len(strand.substrands)}\n")
            
            for ss in sorted(strand.substrands, key=lambda x: x.sequence_order)[:3]:
                print(f"    {ss.substrand_number} - {ss.substrand_name}")
                print(f"      Lessons: {ss.number_of_lessons}")
                if ss.specific_learning_outcomes:
                    print(f"      Outcomes: {len(ss.specific_learning_outcomes)} items")
                    print(f"        - {ss.specific_learning_outcomes[0][:60]}...")
                print()
    else:
        print("❌ Kiswahili not found")
finally:
    db.close()
