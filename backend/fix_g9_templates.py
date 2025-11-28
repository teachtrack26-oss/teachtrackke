"""
Fix Grade 9 curriculum templates that have broken/empty data
Re-import from JSON files
"""
import sys
import json
import os
sys.path.append('.')

from database import SessionLocal
from models import CurriculumTemplate, TemplateStrand, TemplateSubstrand

# Mapping of template IDs to JSON files
TEMPLATE_FIX_MAP = {
    4: "grade 9 integtrated science.json",     # Integrated Science
    7: "grade 9 pretechnical studies.json",    # Pre-Technical Studies
    8: "grade 9 religious education.json",     # Christian Religious Education
    9: "grade 9 social studies.json",          # Social Studies
    5: "grade 9 kiswahili.json",               # Kiswahili
    2: "grade 9 Agriculture.json",             # Agriculture
    3: "grade 9 creative arts.json",           # Creative Arts
}

def fix_template(db, template_id: int, json_file: str):
    json_path = os.path.join("c:/Users/MKT/desktop/teachtrack/G9", json_file)
    
    if not os.path.exists(json_path):
        print(f"  ❌ JSON file not found: {json_path}")
        return False
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Get the template
    template = db.query(CurriculumTemplate).filter(CurriculumTemplate.id == template_id).first()
    if not template:
        print(f"  ❌ Template ID {template_id} not found!")
        return False
    
    print(f"\n  Fixing: {template.subject} - {template.grade}")
    print(f"  Using: {json_file}")
    
    # Delete existing strands and substrands
    existing_strands = db.query(TemplateStrand).filter(
        TemplateStrand.curriculum_template_id == template_id
    ).all()
    
    for strand in existing_strands:
        db.query(TemplateSubstrand).filter(TemplateSubstrand.strand_id == strand.id).delete()
    db.query(TemplateStrand).filter(TemplateStrand.curriculum_template_id == template_id).delete()
    db.commit()
    print(f"  Cleared old strands/substrands")
    
    # Update template metadata
    template.subject = data.get('subject', template.subject)
    template.grade = data.get('grade', template.grade)
    template.education_level = data.get('educationLevel', template.education_level)
    
    # Import strands
    strand_count = 0
    substrand_count = 0
    
    for strand_data in data.get('strands', []):
        strand = TemplateStrand(
            curriculum_template_id=template_id,
            strand_number=strand_data.get('strandNumber', ''),
            strand_name=strand_data.get('strandName', ''),
            sequence_order=strand_count
        )
        db.add(strand)
        db.flush()  # Get ID
        strand_count += 1
        
        # Import substrands
        for substrand_data in strand_data.get('subStrands', []):
            substrand = TemplateSubstrand(
                strand_id=strand.id,
                substrand_number=substrand_data.get('subStrandNumber', ''),
                substrand_name=substrand_data.get('subStrandName', ''),
                number_of_lessons=substrand_data.get('numberOfLessons', 1),
                specific_learning_outcomes=substrand_data.get('specificLearningOutcomes', []),
                suggested_learning_experiences=substrand_data.get('suggestedLearningExperiences', []),
                key_inquiry_questions=substrand_data.get('keyInquiryQuestions', []),
                core_competencies=substrand_data.get('coreCompetencies', []),
                values=substrand_data.get('values', []),
                pcis=substrand_data.get('pcis', []),
                links_to_other_subjects=substrand_data.get('linkToOtherSubjects', []),
                sequence_order=substrand_count
            )
            db.add(substrand)
            substrand_count += 1
    
    db.commit()
    print(f"  ✅ Imported {strand_count} strands, {substrand_count} substrands")
    return True

def main():
    db = SessionLocal()
    try:
        print("="*80)
        print("FIXING GRADE 9 CURRICULUM TEMPLATES")
        print("="*80)
        
        fixed = 0
        for template_id, json_file in TEMPLATE_FIX_MAP.items():
            if fix_template(db, template_id, json_file):
                fixed += 1
        
        print(f"\n{'='*80}")
        print(f"Fixed {fixed} templates")
        print("="*80)
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
