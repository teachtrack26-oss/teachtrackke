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
    json_file_path = os.path.join('G2', 'grade-2-environmental-activities.json')
    
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
    subject = data.get('subjectName')
    
    print(f"Validating content for {grade} - {subject}")
    
    # Database session
    db = SessionLocal()
    
    try:
        # Find the curriculum template
        template = db.query(CurriculumTemplate).filter(
            CurriculumTemplate.grade == grade,
            CurriculumTemplate.subject == subject
        ).first()
        
        if not template:
            print(f"Error: Curriculum template for {grade} {subject} not found in database.")
            # List available templates for this grade
            templates = db.query(CurriculumTemplate).filter(CurriculumTemplate.grade == grade).all()
            print(f"Available templates for {grade}:")
            for t in templates:
                print(f"- {t.subject} (ID: {t.id})")
            return
            
        print(f"Found template: {template.subject} (ID: {template.id})")
        
        # Process Strands
        for strand_data in data.get('strands', []):
            strand_id = strand_data.get('strandId')
            strand_title = strand_data.get('strandTitle')
            
            print(f"Processing Strand {strand_id}: {strand_title}")
            
            # Check if strand exists
            strand = db.query(TemplateStrand).filter(
                TemplateStrand.curriculum_template_id == template.id,
                TemplateStrand.strand_number == strand_id
            ).first()
            
            if not strand:
                strand = TemplateStrand(
                    curriculum_template_id=template.id,
                    strand_number=strand_id,
                    strand_name=strand_title,
                    sequence_order=float(strand_id)
                )
                db.add(strand)
                db.flush()
                print(f"  Created Strand: {strand_title}")
            else:
                strand.strand_name = strand_title
                print(f"  Strand already exists: {strand_title}")
                
            # Process Sub-strands
            for sub_data in strand_data.get('subStrands', []):
                sub_id = sub_data.get('subStrandId')
                sub_title = sub_data.get('subStrandTitle')
                
                # Check if sub-strand exists
                sub_strand = db.query(TemplateSubstrand).filter(
                    TemplateSubstrand.strand_id == strand.id,
                    TemplateSubstrand.substrand_number == sub_id
                ).first()
                
                if not sub_strand:
                    sub_strand = TemplateSubstrand(
                        strand_id=strand.id,
                        substrand_number=sub_id,
                        substrand_name=sub_title,
                        specific_learning_outcomes=sub_data.get('specificLearningOutcomes', []),
                        suggested_learning_experiences=sub_data.get('suggestedLearningExperiences', []),
                        key_inquiry_questions=sub_data.get('keyInquiryQuestions', [])
                    )
                    db.add(sub_strand)
                    print(f"    Created Sub-strand: {sub_title}")
                else:
                    # Update existing sub-strand
                    sub_strand.substrand_name = sub_title
                    sub_strand.specific_learning_outcomes = sub_data.get('specificLearningOutcomes', [])
                    sub_strand.suggested_learning_experiences = sub_data.get('suggestedLearningExperiences', [])
                    sub_strand.key_inquiry_questions = sub_data.get('keyInquiryQuestions', [])
                    print(f"    Updated Sub-strand: {sub_title}")
        
        db.commit()
        print("Import completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error during import: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    validate_and_import()
