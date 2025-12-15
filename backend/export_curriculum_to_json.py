import sys
import json
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import CurriculumTemplate, TemplateStrand, TemplateSubstrand
from config import settings
from urllib.parse import quote_plus

# Setup database connection
encoded_password = quote_plus(settings.DB_PASSWORD)
DATABASE_URL = f"mysql+pymysql://{settings.DB_USER}:{encoded_password}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def export_curriculum(grade, subject, output_file=None):
    db = SessionLocal()
    try:
        # Find the template
        template = db.query(CurriculumTemplate).filter(
            CurriculumTemplate.grade == grade,
            CurriculumTemplate.subject == subject
        ).first()

        if not template:
            print(f"Error: No curriculum found for {grade} - {subject}")
            return

        data = {
            "grade": template.grade,
            "subject": template.subject,
            "education_level": template.education_level,
            "strands": []
        }

        # Get strands sorted by sequence
        strands = db.query(TemplateStrand).filter(
            TemplateStrand.curriculum_template_id == template.id
        ).order_by(TemplateStrand.sequence_order, TemplateStrand.strand_number).all()

        for strand in strands:
            strand_data = {
                "strand_number": strand.strand_number,
                "strand_name": strand.strand_name,
                "substrands": []
            }

            # Get substrands sorted by sequence
            substrands = db.query(TemplateSubstrand).filter(
                TemplateSubstrand.strand_id == strand.id
            ).order_by(TemplateSubstrand.sequence_order, TemplateSubstrand.substrand_number).all()

            for sub in substrands:
                sub_data = {
                    "substrand_number": sub.substrand_number,
                    "substrand_name": sub.substrand_name,
                    "number_of_lessons": sub.number_of_lessons,
                    "specific_learning_outcomes": sub.specific_learning_outcomes or [],
                    "suggested_learning_experiences": sub.suggested_learning_experiences or [],
                    "key_inquiry_questions": sub.key_inquiry_questions or [],
                    "core_competencies": sub.core_competencies or [],
                    "values": sub.values or [],
                    "pcis": sub.pcis or [],
                    "links_to_other_subjects": sub.links_to_other_subjects or []
                }
                strand_data["substrands"].append(sub_data)
            
            data["strands"].append(strand_data)

        # Determine output filename if not provided
        if not output_file:
            safe_subject = subject.replace(" ", "_").replace("/", "_")
            safe_grade = grade.replace(" ", "_")
            output_file = f"curriculum_export_{safe_grade}_{safe_subject}.json"

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        
        print(f"Successfully exported to {output_file}")
        return output_file

    except Exception as e:
        print(f"Error exporting: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python export_curriculum_to_json.py <Grade> <Subject>")
        print('Example: python export_curriculum_to_json.py "Grade 4" "Mathematics"')
        sys.exit(1)
    
    grade_arg = sys.argv[1]
    subject_arg = sys.argv[2]
    export_curriculum(grade_arg, subject_arg)
