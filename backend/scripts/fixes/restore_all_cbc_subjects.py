"""
Restore ALL official CBC curriculum subjects for all grades.
This adds missing subjects while preserving existing templates that have content.

CBC Structure:
- PP1-PP2: 5 activities each
- Grade 1-3: 6 learning areas each  
- Grade 4-6: 12 subjects each (8 core + 4 foreign languages)
- Grade 7-9: 14 subjects each (10 core + 4 foreign languages)
"""
import sys
sys.path.append('.')
from database import SessionLocal
from models import CurriculumTemplate, TemplateStrand, TemplateSubstrand

db = SessionLocal()

# ============================================
# Official CBC Subjects by Education Level
# ============================================

CBC_CURRICULUM = {
    # PRE-PRIMARY (PP1 & PP2) - 5 Activities
    "Pre-Primary": {
        "grades": ["PP1", "PP2"],
        "subjects": [
            "Language Activities",
            "Mathematical Activities",
            "Environmental Activities",
            "Psychomotor and Creative Activities",
            "Religious Education Activities",
        ]
    },
    
    # LOWER PRIMARY (Grade 1, 2, 3) - 6 Learning Areas
    "Lower Primary": {
        "grades": ["Grade 1", "Grade 2", "Grade 3"],
        "subjects": [
            "English Activities",
            "Kiswahili/Kenyan Sign Language",
            "Mathematics",
            "Environmental Activities",
            "Religious Education (CRE/IRE/HRE)",
            "Movement and Creative Activities",
        ]
    },
    
    # UPPER PRIMARY (Grade 4, 5, 6) - 8 Core + 4 Foreign Languages = 12
    "Upper Primary": {
        "grades": ["Grade 4", "Grade 5", "Grade 6"],
        "subjects": [
            # Core subjects
            "English",
            "Kiswahili/Kenyan Sign Language",
            "Mathematics",
            "Religious Education (CRE/IRE/HRE)",
            "Creative Arts and Sports",
            "Agriculture and Nutrition",
            "Science and Technology",
            "Social Studies",
            # Foreign Languages (optional)
            "French",
            "German",
            "Arabic",
            "Mandarin",
        ]
    },
    
    # JUNIOR SECONDARY (Grade 7, 8, 9) - 10 Core + 4 Foreign Languages = 14
    "Junior Secondary": {
        "grades": ["Grade 7", "Grade 8", "Grade 9"],
        "subjects": [
            # Core subjects
            "English",
            "Kiswahili/Kenyan Sign Language",
            "Mathematics",
            "Integrated Science",
            "Health Education",
            "Pre-Technical and Pre-Career Education",
            "Social Studies",
            "Religious Education (CRE/IRE/HRE)",
            "Creative Arts and Sports",
            "Agriculture and Nutrition",
            # Foreign Languages (optional)
            "French",
            "German",
            "Arabic",
            "Mandarin",
        ]
    },
}

# Subject name mapping - maps existing names to official names
SUBJECT_MAPPINGS = {
    # Grade 1-3 mappings
    "Creative Arts Activities": "Movement and Creative Activities",
    
    # Grade 4-6 mappings
    "Creative Arts": "Creative Arts and Sports",
    "English Language": "English",
    "Kiswahili": "Kiswahili/Kenyan Sign Language",
    
    # Grade 7-9 mappings
    "Christian Religious Education": "Religious Education (CRE/IRE/HRE)",
    "Pre-Technical Studies": "Pre-Technical and Pre-Career Education",
    "Kiswahili": "Kiswahili/Kenyan Sign Language",
}

print("=" * 70)
print("RESTORING ALL OFFICIAL CBC CURRICULUM SUBJECTS")
print("=" * 70)

added_count = 0
skipped_count = 0
existing_subjects = {}

# First, get all existing templates
existing = db.query(CurriculumTemplate).all()
for t in existing:
    key = f"{t.grade}|{t.subject}"
    existing_subjects[key] = t
    # Also check mapped names
    if t.subject in SUBJECT_MAPPINGS:
        mapped_key = f"{t.grade}|{SUBJECT_MAPPINGS[t.subject]}"
        existing_subjects[mapped_key] = t

print(f"\nExisting templates: {len(existing)}")

# Add all official subjects
for level_name, level_data in CBC_CURRICULUM.items():
    print(f"\n📚 {level_name}")
    print("-" * 50)
    
    for grade in level_data["grades"]:
        grade_added = 0
        grade_skipped = 0
        
        for subject in level_data["subjects"]:
            key = f"{grade}|{subject}"
            
            # Check if already exists (exact match or mapped)
            exists = False
            for existing_key in existing_subjects.keys():
                if existing_key == key:
                    exists = True
                    break
                # Check if existing subject maps to this official name
                existing_grade, existing_subject = existing_key.split("|", 1)
                if existing_grade == grade:
                    mapped_name = SUBJECT_MAPPINGS.get(existing_subject, existing_subject)
                    if mapped_name == subject:
                        exists = True
                        break
            
            if exists:
                grade_skipped += 1
                skipped_count += 1
            else:
                # Add new template
                template = CurriculumTemplate(
                    subject=subject,
                    grade=grade,
                    education_level=level_name,
                    is_active=True
                )
                db.add(template)
                grade_added += 1
                added_count += 1
        
        status = "✅" if grade_added > 0 else "⏭️"
        print(f"  {status} {grade}: +{grade_added} new, {grade_skipped} existing")

db.commit()

print("\n" + "=" * 70)
print(f"✅ DONE! Added {added_count} new templates, {skipped_count} already existed")
print("=" * 70)

# Final summary
print("\n📊 FINAL TEMPLATE COUNT BY GRADE:")
print("-" * 50)

for level_name, level_data in CBC_CURRICULUM.items():
    print(f"\n{level_name}:")
    for grade in level_data["grades"]:
        count = db.query(CurriculumTemplate).filter(
            CurriculumTemplate.grade == grade
        ).count()
        expected = len(level_data["subjects"])
        status = "✅" if count >= expected else f"⚠️ (expected {expected})"
        print(f"  {grade}: {count} subjects {status}")

db.close()
