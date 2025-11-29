import json
import sys
import os
from sqlalchemy.orm import Session

# Add the current directory and backend directory to sys.path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.database import SessionLocal
from backend.models import CurriculumTemplate, TemplateStrand, TemplateSubstrand

def validate_and_import_kiswahili():
    json_file_path = r"c:\Users\MKT\desktop\teachtrack\G4\grade-4-kiswahili.json"
    
    if not os.path.exists(json_file_path):
        print(f"Error: File not found at {json_file_path}")
        return

    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print("JSON structure is valid.")
    except json.JSONDecodeError as e:
        print(f"JSON Error: {e}")
        return

    # Validate structure
    required_fields = ["grade", "subject", "strands"]
    for field in required_fields:
        if field not in data:
            print(f"Missing required field: {field}")
            return

    print(f"Validating content for {data['grade']} - {data['subject']}")
    
    session = SessionLocal()
    try:
        # Get the template
        # ID 113 is Kiswahili
        template_id = 113
        template = session.query(CurriculumTemplate).filter(CurriculumTemplate.id == template_id).first()
        
        if not template:
            print(f"Error: CurriculumTemplate with ID {template_id} not found.")
            return
            
        print(f"Found template: {template.subject} (ID: {template.id})")

        # Process Strands
        for strand_data in data['strands']:
            strand_number = strand_data['strandId']
            strand_name = strand_data['strandTitle']
            
            print(f"Processing Strand {strand_number}: {strand_name}")
            
            # Check if strand exists
            strand = session.query(TemplateStrand).filter(
                TemplateStrand.curriculum_template_id == template.id,
                TemplateStrand.strand_number == strand_number
            ).first()
            
            if not strand:
                strand = TemplateStrand(
                    curriculum_template_id=template.id,
                    strand_number=strand_number,
                    strand_name=strand_name
                )
                session.add(strand)
                session.flush() # Get ID
                print(f"  Created Strand: {strand.strand_name}")
            else:
                print(f"  Strand already exists: {strand.strand_name}")
                # Update title if needed
                if strand.strand_name != strand_name:
                    strand.strand_name = strand_name
                    print(f"  Updated Strand title to: {strand_name}")

            # Process Sub-strands
            for sub_data in strand_data['subStrands']:
                sub_number = sub_data['subStrandId']
                sub_name = sub_data['subStrandTitle']
                
                # Check if sub-strand exists
                sub_strand = session.query(TemplateSubstrand).filter(
                    TemplateSubstrand.strand_id == strand.id,
                    TemplateSubstrand.substrand_number == sub_number
                ).first()
                
                if not sub_strand:
                    sub_strand = TemplateSubstrand(
                        strand_id=strand.id,
                        substrand_number=sub_number,
                        substrand_name=sub_name,
                        specific_learning_outcomes=sub_data.get('specificLearningOutcomes', []),
                        suggested_learning_experiences=sub_data.get('suggestedLearningExperiences', []),
                        key_inquiry_questions=sub_data.get('keyInquiryQuestions', [])
                    )
                    session.add(sub_strand)
                    print(f"    Created Sub-strand: {sub_number} - {sub_name}")
                else:
                    # Update existing sub-strand
                    sub_strand.substrand_name = sub_name
                    sub_strand.specific_learning_outcomes = sub_data.get('specificLearningOutcomes', [])
                    sub_strand.suggested_learning_experiences = sub_data.get('suggestedLearningExperiences', [])
                    sub_strand.key_inquiry_questions = sub_data.get('keyInquiryQuestions', [])
                    print(f"    Updated Sub-strand: {sub_number} - {sub_name}")

        session.commit()
        print("Import completed successfully!")

    except Exception as e:
        session.rollback()
        print(f"Error during import: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    validate_and_import_kiswahili()
