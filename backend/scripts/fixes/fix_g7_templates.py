"""
Fix G7 templates that have 0 substrands.
Deletes the broken templates and reimports from the proper JSON files.
"""
import sys
sys.path.append('.')
import json
import os
from database import SessionLocal
from models import CurriculumTemplate, TemplateStrand, TemplateSubstrand

db = SessionLocal()

# Templates to fix
templates_to_fix = [
    ("English", "Grade 7"),
    ("Mathematics", "Grade 7"),
    ("Pre-Technical Studies", "Grade 7"),
]

# Step 1: Delete broken templates
print("=" * 60)
print("DELETING BROKEN G7 TEMPLATES")
print("=" * 60)

for subject, grade in templates_to_fix:
    template = db.query(CurriculumTemplate).filter(
        CurriculumTemplate.subject == subject,
        CurriculumTemplate.grade == grade
    ).first()
    
    if template:
        # Delete substrands first
        strands = db.query(TemplateStrand).filter(
            TemplateStrand.curriculum_template_id == template.id
        ).all()
        for strand in strands:
            db.query(TemplateSubstrand).filter(
                TemplateSubstrand.strand_id == strand.id
            ).delete()
        
        # Delete strands
        db.query(TemplateStrand).filter(
            TemplateStrand.curriculum_template_id == template.id
        ).delete()
        
        # Delete template
        db.delete(template)
        print(f"✅ Deleted: {subject} - {grade}")
    else:
        print(f"⚠️ Not found: {subject} - {grade}")

db.commit()

# Step 2: Reimport from JSON files
print()
print("=" * 60)
print("REIMPORTING G7 TEMPLATES FROM JSON")
print("=" * 60)

json_files = {
    "English": "c:/Users/MKT/desktop/teachtrack/G7/grade-7-english.json",
    "Mathematics": "c:/Users/MKT/desktop/teachtrack/G7/grade-7-mathematics.json",
    "Pre-Technical Studies": "c:/Users/MKT/desktop/teachtrack/G7/grade-7-pre-technical-studies.json",
}

for subject, json_path in json_files.items():
    if not os.path.exists(json_path):
        print(f"❌ JSON file not found: {json_path}")
        continue
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Create template
    template = CurriculumTemplate(
        subject=data.get('subject', subject),
        grade=data.get('grade', 'Grade 7'),
        education_level=data.get('education_level', 'Junior Secondary')
    )
    db.add(template)
    db.flush()
    
    strand_count = 0
    substrand_count = 0
    
    # Create strands and substrands
    for strand_data in data.get('strands', []):
        strand = TemplateStrand(
            curriculum_template_id=template.id,
            strand_number=strand_data.get('strand_number', ''),
            strand_name=strand_data.get('strand_name', '')
        )
        db.add(strand)
        db.flush()
        strand_count += 1
        
        # Create substrands
        for sub_data in strand_data.get('sub_strands', []):
            substrand = TemplateSubstrand(
                strand_id=strand.id,
                substrand_number=sub_data.get('sub_strand_number', ''),
                substrand_name=sub_data.get('sub_strand_name', ''),
                number_of_lessons=sub_data.get('number_of_lessons', 0),
                specific_learning_outcomes=sub_data.get('specific_learning_outcomes', []),
                suggested_learning_experiences=sub_data.get('suggested_learning_experiences', []),
                key_inquiry_questions=sub_data.get('key_inquiry_questions', [])
            )
            db.add(substrand)
            substrand_count += 1
    
    db.commit()
    print(f"✅ Imported: {subject} ({strand_count} strands, {substrand_count} substrands)")

db.close()

print()
print("=" * 60)
print("DONE! G7 templates have been fixed.")
print("=" * 60)
