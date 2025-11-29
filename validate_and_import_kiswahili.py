import json
import os
import sys

# Add the current directory and backend directory to sys.path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend.models import CurriculumTemplate, TemplateStrand, TemplateSubstrand

def validate_json(file_path):
    print(f"Validating {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Invalid JSON: {e}")
        return None
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return None

    required_fields = ["subject", "grade", "educationLevel", "strands"]
    for field in required_fields:
        if field not in data:
            print(f"Missing required field: {field}")
            return None

    print("JSON structure is valid.")
    return data

def import_curriculum(data):
    session = SessionLocal()
    try:
        subject = data['subject']
        grade = data['grade']
        education_level = data['educationLevel']

        print(f"Importing {subject} - {grade}...")

        # Check if exists and delete (clean import)
        existing_template = session.query(CurriculumTemplate).filter_by(
            subject=subject, grade=grade
        ).first()

        if existing_template:
            print(f"Found existing template for {subject} {grade}. Deleting...")
            session.delete(existing_template)
            session.commit()

        # Create new template
        new_template = CurriculumTemplate(
            subject=subject,
            grade=grade,
            education_level=education_level,
            is_active=True
        )
        session.add(new_template)
        session.flush() # Get ID

        print(f"Created CurriculumTemplate ID: {new_template.id}")

        for strand_idx, strand_data in enumerate(data['strands']):
            new_strand = TemplateStrand(
                curriculum_template_id=new_template.id,
                strand_number=strand_data['strandNumber'],
                strand_name=strand_data['strandName'],
                sequence_order=strand_idx + 1
            )
            session.add(new_strand)
            session.flush() # Get ID
            
            print(f"  Added Strand: {new_strand.strand_number} - {new_strand.strand_name}")

            for sub_idx, sub_data in enumerate(strand_data['subStrands']):
                new_sub = TemplateSubstrand(
                    strand_id=new_strand.id,
                    substrand_number=sub_data['subStrandNumber'],
                    substrand_name=sub_data['subStrandName'],
                    number_of_lessons=sub_data.get('numberOfLessons', 1),
                    specific_learning_outcomes=sub_data.get('specificLearningOutcomes', []),
                    suggested_learning_experiences=sub_data.get('suggestedLearningExperiences', []),
                    key_inquiry_questions=sub_data.get('keyInquiryQuestions', []),
                    core_competencies=sub_data.get('coreCompetencies', []),
                    values=sub_data.get('values', []),
                    pcis=sub_data.get('pcis', []),
                    links_to_other_subjects=sub_data.get('linkToOtherSubjects', []),
                    sequence_order=sub_idx + 1
                )
                session.add(new_sub)
                print(f"    Added Sub-strand: {new_sub.substrand_number}")

        session.commit()
        print("Import completed successfully!")

    except Exception as e:
        session.rollback()
        print(f"Error during import: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    json_file = r"c:\Users\MKT\desktop\teachtrack\G5\grade-5-kiswahili.json"
    data = validate_json(json_file)
    if data:
        import_curriculum(data)
