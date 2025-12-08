from database import SessionLocal
from models import CurriculumTemplate, TemplateStrand, TemplateSubstrand

db = SessionLocal()

subject_name = "Mathematics"
grade = "Grade 6"

template = db.query(CurriculumTemplate).filter(
    CurriculumTemplate.subject == subject_name,
    CurriculumTemplate.grade == grade
).first()

if not template:
    print(f"Template for {subject_name} {grade} not found.")
else:
    print(f"Template ID: {template.id}")
    total_lessons = 0
    for strand in template.strands:
        print(f"Strand: {strand.strand_name}")
        for substrand in strand.substrands:
            print(f"  - {substrand.substrand_name}: {substrand.number_of_lessons} lessons")
            total_lessons += substrand.number_of_lessons
            
    print(f"Total Lessons in Template: {total_lessons}")

db.close()
