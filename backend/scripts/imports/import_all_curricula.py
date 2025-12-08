"""
Import ALL curriculum templates from G1 to G8 JSON files
"""
import sys
import json
import os
sys.path.append('.')

from database import SessionLocal
from models import CurriculumTemplate, TemplateStrand, TemplateSubstrand

# Education level mapping based on grade
def get_education_level(grade: str) -> str:
    grade_num = int(''.join(filter(str.isdigit, grade)))
    if grade_num <= 3:
        return "Lower Primary"
    elif grade_num <= 6:
        return "Upper Primary"
    elif grade_num <= 9:
        return "Junior Secondary"
    else:
        return "Senior Secondary"

# All JSON files to import
CURRICULUM_FILES = {
    # Grade 1
    "G1": [
        ("grade-1-creative-arts.json", "Creative Arts", "Grade 1"),
        ("grade-1-environmental-activities.json", "Environmental Activities", "Grade 1"),
    ],
    # Grade 2
    "G2": [
        ("grade-2-creative-arts.json", "Creative Arts", "Grade 2"),
        ("grade-2-environmental-activities.json", "Environmental Activities", "Grade 2"),
    ],
    # Grade 3
    "G3": [
        ("grade-3-creative-arts.json", "Creative Arts", "Grade 3"),
        ("grade-3-environmental-activities.json", "Environmental Activities", "Grade 3"),
    ],
    # Grade 4
    "G4": [
        ("grade-4-agriculture-nutrition.json", "Agriculture and Nutrition", "Grade 4"),
        ("grade-4-creative-arts.json", "Creative Arts", "Grade 4"),
    ],
    # Grade 5
    "G5": [
        ("grade-5-agriculture-nutrition.json", "Agriculture and Nutrition", "Grade 5"),
        ("grade-5-creative-arts.json", "Creative Arts", "Grade 5"),
    ],
    # Grade 6
    "G6": [
        ("grade-6-agriculture-and-nutrition.json", "Agriculture and Nutrition", "Grade 6"),
        ("grade-6-creative-arts.json", "Creative Arts", "Grade 6"),
        ("grade-6-english-language.json", "English", "Grade 6"),
        ("grade-6-kiswahili.json", "Kiswahili", "Grade 6"),
        ("grade-6-mathematics.json", "Mathematics", "Grade 6"),
        ("grade-6-science-and-technology.json", "Science and Technology", "Grade 6"),
        ("grade-6-social-studies.json", "Social Studies", "Grade 6"),
    ],
    # Grade 7
    "G7": [
        ("grade-7-christian-religious-education.json", "Christian Religious Education", "Grade 7"),
        ("grade-7-creative-arts-and-sports.json", "Creative Arts and Sports", "Grade 7"),
        ("grade-7-english.json", "English", "Grade 7"),
        ("grade-7-kiswahili.json", "Kiswahili", "Grade 7"),
        ("grade-7-mathematics.json", "Mathematics", "Grade 7"),
        ("grade-7-pre-technical-studies.json", "Pre-Technical Studies", "Grade 7"),
        ("grade-7-social-studies.json", "Social Studies", "Grade 7"),
    ],
    # Grade 8
    "G8": [
        ("grade 8 agriculture and nutrition.json", "Agriculture and Nutrition", "Grade 8"),
        ("grade 8 christian religious education.json", "Christian Religious Education", "Grade 8"),
        ("grade 8 creative arts and sports.json", "Creative Arts and Sports", "Grade 8"),
        ("grade 8 english.json", "English", "Grade 8"),
        ("grade 8 integrated science.json", "Integrated Science", "Grade 8"),
        ("grade 8 kiswahili.json", "Kiswahili", "Grade 8"),
        ("grade 8 mathematics.json", "Mathematics", "Grade 8"),
        ("grade 8 pretechnical studies.json", "Pre-Technical Studies", "Grade 8"),
        ("grade 8 social studies.json", "Social Studies", "Grade 8"),
    ],
}

def import_curriculum(db, folder: str, filename: str, default_subject: str, default_grade: str):
    base_path = "c:/Users/MKT/desktop/teachtrack"
    json_path = os.path.join(base_path, folder, filename)
    
    if not os.path.exists(json_path):
        print(f"  ❌ File not found: {json_path}")
        return False
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"  ❌ Invalid JSON in {filename}: {e}")
        return False
    except Exception as e:
        print(f"  ❌ Error reading {filename}: {e}")
        return False
    
    # Get subject and grade from JSON or use defaults
    subject = data.get('subject', default_subject)
    grade = data.get('grade', default_grade)
    education_level = data.get('educationLevel', get_education_level(grade))
    
    # Check if template already exists
    existing = db.query(CurriculumTemplate).filter(
        CurriculumTemplate.subject == subject,
        CurriculumTemplate.grade == grade
    ).first()
    
    if existing:
        print(f"  ⏭️  Already exists: {subject} - {grade}")
        return True
    
    # Create template
    template = CurriculumTemplate(
        subject=subject,
        grade=grade,
        education_level=education_level,
        is_active=True
    )
    db.add(template)
    db.flush()
    
    # Import strands
    strand_count = 0
    substrand_count = 0
    
    strands_data = data.get('strands', [])
    if not strands_data:
        print(f"  ⚠️  No strands in {filename}")
        db.commit()
        return True
    
    for idx, strand_data in enumerate(strands_data):
        strand = TemplateStrand(
            curriculum_template_id=template.id,
            strand_number=strand_data.get('strandNumber', str(idx + 1)),
            strand_name=strand_data.get('strandName', f'Strand {idx + 1}'),
            sequence_order=idx
        )
        db.add(strand)
        db.flush()
        strand_count += 1
        
        # Import substrands
        substrands_data = strand_data.get('subStrands', strand_data.get('substrands', []))
        for ss_idx, substrand_data in enumerate(substrands_data):
            substrand = TemplateSubstrand(
                strand_id=strand.id,
                substrand_number=substrand_data.get('subStrandNumber', substrand_data.get('substrandNumber', str(ss_idx + 1))),
                substrand_name=substrand_data.get('subStrandName', substrand_data.get('substrandName', f'Sub-strand {ss_idx + 1}')),
                number_of_lessons=substrand_data.get('numberOfLessons', 1),
                specific_learning_outcomes=substrand_data.get('specificLearningOutcomes', []),
                suggested_learning_experiences=substrand_data.get('suggestedLearningExperiences', []),
                key_inquiry_questions=substrand_data.get('keyInquiryQuestions', []),
                core_competencies=substrand_data.get('coreCompetencies', []),
                values=substrand_data.get('values', []),
                pcis=substrand_data.get('pcis', []),
                links_to_other_subjects=substrand_data.get('linkToOtherSubjects', substrand_data.get('linksToOtherSubjects', [])),
                sequence_order=ss_idx
            )
            db.add(substrand)
            substrand_count += 1
    
    db.commit()
    print(f"  ✅ Imported: {subject} - {grade} ({strand_count} strands, {substrand_count} substrands)")
    return True

def main():
    db = SessionLocal()
    try:
        print("="*80)
        print("IMPORTING ALL CURRICULUM TEMPLATES (G1-G8)")
        print("="*80)
        
        total_imported = 0
        total_skipped = 0
        total_failed = 0
        
        for folder, files in CURRICULUM_FILES.items():
            print(f"\n📁 {folder}:")
            for filename, subject, grade in files:
                result = import_curriculum(db, folder, filename, subject, grade)
                if result:
                    total_imported += 1
                else:
                    total_failed += 1
        
        print(f"\n{'='*80}")
        print(f"SUMMARY:")
        print(f"  ✅ Successfully imported/existing: {total_imported}")
        print(f"  ❌ Failed: {total_failed}")
        print("="*80)
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
