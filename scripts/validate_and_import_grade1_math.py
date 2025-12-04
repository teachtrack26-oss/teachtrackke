import json
import os
import sys
from datetime import datetime

# Add the current directory and backend directory to sys.path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.database import SessionLocal
from backend.models import CurriculumTemplate, TemplateStrand, TemplateSubstrand

def validate_and_import():
    json_file_path = os.path.join('G1', 'grade-1-math.json')
    
    if not os.path.exists(json_file_path):
        print(f"Error: File not found at {json_file_path}")
        return

    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print("JSON structure is valid.")
    except json.JSONDecodeError as e:
        print(f"Invalid JSON: {e}")
        return

    grade = data.get('grade')
    subject_name = data.get('subject')
    
    print(f"Validating content for {grade} - {subject_name}")

    session = SessionLocal()
    try:
        # Find the curriculum template
        template = session.query(CurriculumTemplate).filter(
            CurriculumTemplate.grade == grade,
            CurriculumTemplate.subject == subject_name
        ).first()

        if not template:
            print(f"Error: Subject '{subject_name}' for '{grade}' not found in database.")
            # List available subjects for this grade to help debug
            available = session.query(CurriculumTemplate).filter(CurriculumTemplate.grade == grade).all()
            print(f"Available subjects for {grade}: {[t.subject for t in available]}")
            return

        print(f"Found template: {template.subject} (ID: {template.id})")

        # Process Strands
        for strand_data in data.get('strands', []):
            strand_title = strand_data.get('strandTitle')
            strand_id_code = strand_data.get('strandId') # e.g., "1.0"
            
            print(f"Processing Strand {strand_id_code}: {strand_title}")

            # Check if strand exists
            strand = session.query(TemplateStrand).filter(
                TemplateStrand.curriculum_template_id == template.id,
                TemplateStrand.strand_name == strand_title
            ).first()

            if not strand:
                strand = TemplateStrand(
                    curriculum_template_id=template.id,
                    strand_name=strand_title,
                    strand_number=strand_id_code
                )
                session.add(strand)
                session.flush() # Get ID
                print(f"  Created Strand: {strand_title}")
            else:
                print(f"  Strand already exists: {strand_title}")

            # Process Sub-strands
            for sub_strand_data in strand_data.get('subStrands', []):
                sub_title = sub_strand_data.get('subStrandTitle')
                sub_code = sub_strand_data.get('subStrandId') # e.g., "1.1"
                
                # Check if sub-strand exists
                sub_strand = session.query(TemplateSubstrand).filter(
                    TemplateSubstrand.strand_id == strand.id,
                    TemplateSubstrand.substrand_name == sub_title
                ).first()

                if not sub_strand:
                    sub_strand = TemplateSubstrand(
                        strand_id=strand.id,
                        substrand_name=sub_title,
                        substrand_number=sub_code,
                        specific_learning_outcomes=sub_strand_data.get('specificLearningOutcomes', []),
                        suggested_learning_experiences=sub_strand_data.get('suggestedLearningExperiences', []),
                        key_inquiry_questions=sub_strand_data.get('keyInquiryQuestions', [])
                    )
                    session.add(sub_strand)
                    print(f"    Created Sub-strand: {sub_code} - {sub_title}")
                else:
                    # Update existing sub-strand
                    sub_strand.specific_learning_outcomes = sub_strand_data.get('specificLearningOutcomes', [])
                    sub_strand.suggested_learning_experiences = sub_strand_data.get('suggestedLearningExperiences', [])
                    sub_strand.key_inquiry_questions = sub_strand_data.get('keyInquiryQuestions', [])
                    print(f"    Updated Sub-strand: {sub_code} - {sub_title}")

        session.commit()
        print("Import completed successfully!")

    except Exception as e:
        session.rollback()
        print(f"Error during import: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    validate_and_import()
