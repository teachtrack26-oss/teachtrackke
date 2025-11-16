"""
Grade 8 Kiswahili Curriculum Importer - Three-level hierarchy support
Import curriculum JSON files with strands → sub-strands → sub-sub-strands structure
"""

import json
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# Database connection
from urllib.parse import quote_plus

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME", "teachtrack")

if not DB_PASSWORD:
    print("ERROR: DB_PASSWORD not found in .env file")
    sys.exit(1)

DB_PASSWORD_ENCODED = quote_plus(DB_PASSWORD)
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD_ENCODED}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
print(f"[INFO] Connecting to database: {DB_NAME} at {DB_HOST}:{DB_PORT}")

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)


def validate_three_level_structure(data):
    """Validate three-level curriculum JSON structure"""
    required_fields = ['subject', 'grade', 'educationLevel', 'strands']
    
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")
    
    if not isinstance(data['strands'], list) or len(data['strands']) == 0:
        raise ValueError("strands must be a non-empty array")
    
    # Validate first strand structure
    strand = data['strands'][0]
    required_strand_fields = ['strandNumber', 'strandName', 'subStrands']
    for field in required_strand_fields:
        if field not in strand:
            raise ValueError(f"Missing required strand field: {field}")
    
    # Validate first sub-strand structure
    if len(strand['subStrands']) > 0:
        substrand = strand['subStrands'][0]
        required_substrand_fields = ['subStrandNumber', 'subStrandName', 'subSubStrands']
        for field in required_substrand_fields:
            if field not in substrand:
                raise ValueError(f"Missing required sub-strand field: {field}")
        
        # Validate first sub-sub-strand structure (where actual content is)
        if len(substrand['subSubStrands']) > 0:
            subsubstrand = substrand['subSubStrands'][0]
            required_subsubstrand_fields = [
                'subSubStrandNumber', 'subSubStrandName', 'numberOfLessons',
                'specificLearningOutcomes', 'suggestedLearningExperiences',
                'keyInquiryQuestions', 'coreCompetencies', 'values',
                'pcis', 'linkToOtherSubjects'
            ]
            for field in required_subsubstrand_fields:
                if field not in subsubstrand:
                    raise ValueError(f"Missing required sub-sub-strand field: {field}")
    
    return True


def import_kiswahili_curriculum(json_file_path):
    """Import Grade 8 Kiswahili curriculum JSON to database"""
    
    print(f"Reading JSON file: {json_file_path}")
    
    # Load JSON
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Subject: {data.get('subject')}")
    print(f"Grade: {data.get('grade')}")
    print(f"Education Level: {data.get('educationLevel')}")
    
    # Validate structure
    try:
        validate_three_level_structure(data)
        print("✓ Three-level JSON structure validated")
    except ValueError as e:
        print(f"✗ Validation error: {e}")
        return False
    
    session = Session()
    
    try:
        # Check if curriculum template already exists
        existing_check = text("""
            SELECT id FROM curriculum_templates 
            WHERE subject = :subject AND grade = :grade
        """)
        
        existing = session.execute(existing_check, {
            'subject': data['subject'],
            'grade': data['grade']
        }).fetchone()
        
        if existing:
            print(f"✗ Curriculum for {data['subject']} {data['grade']} already exists (ID: {existing[0]})")
            return False
        
        # Insert curriculum template
        print("Creating curriculum template...")
        insert_template = text("""
            INSERT INTO curriculum_templates (
                subject, grade, education_level, created_at, updated_at
            ) VALUES (
                :subject, :grade, :education_level, :created_at, :updated_at
            )
        """)
        
        now = datetime.utcnow()
        result = session.execute(insert_template, {
            'subject': data['subject'],
            'grade': data['grade'],
            'education_level': data['educationLevel'],
            'created_at': now,
            'updated_at': now
        })
        
        template_id = result.lastrowid
        print(f"✓ Created curriculum template (ID: {template_id})")
        
        # Import strands and sub-sub-strands
        strand_count = 0
        substrand_count = 0
        
        for strand_data in data['strands']:
            # Insert strand
            insert_strand = text("""
                INSERT INTO template_strands (
                    curriculum_template_id, strand_number, strand_name, sequence_order, created_at
                ) VALUES (
                    :curriculum_template_id, :strand_number, :strand_name, :sequence_order, :created_at
                )
            """)
            
            strand_result = session.execute(insert_strand, {
                'curriculum_template_id': template_id,
                'strand_number': strand_data['strandNumber'],
                'strand_name': strand_data['strandName'],
                'sequence_order': strand_count + 1,
                'created_at': now
            })
            
            strand_id = strand_result.lastrowid
            strand_count += 1
            
            # Process sub-strands and their sub-sub-strands
            for substrand_data in strand_data['subStrands']:
                for subsubstrand_data in substrand_data['subSubStrands']:
                    # Insert each sub-sub-strand as a substrand record
                    insert_substrand = text("""
                        INSERT INTO template_substrands (
                            strand_id, substrand_number, substrand_name, number_of_lessons,
                            specific_learning_outcomes, suggested_learning_experiences,
                            key_inquiry_questions, core_competencies, `values`, pcis,
                            links_to_other_subjects, sequence_order, created_at
                        ) VALUES (
                            :strand_id, :substrand_number, :substrand_name, :number_of_lessons,
                            :specific_learning_outcomes, :suggested_learning_experiences,
                            :key_inquiry_questions, :core_competencies, :values, :pcis,
                            :links_to_other_subjects, :sequence_order, :created_at
                        )
                    """)
                    
                    # Create full substrand number (e.g., "1.1.1")
                    full_substrand_number = subsubstrand_data['subSubStrandNumber']
                    
                    session.execute(insert_substrand, {
                        'strand_id': strand_id,
                        'substrand_number': full_substrand_number,
                        'substrand_name': subsubstrand_data['subSubStrandName'],
                        'number_of_lessons': subsubstrand_data['numberOfLessons'],
                        'specific_learning_outcomes': json.dumps(subsubstrand_data['specificLearningOutcomes']),
                        'suggested_learning_experiences': json.dumps(subsubstrand_data['suggestedLearningExperiences']),
                        'key_inquiry_questions': json.dumps(subsubstrand_data['keyInquiryQuestions']),
                        'core_competencies': json.dumps(subsubstrand_data['coreCompetencies']),
                        'values': json.dumps(subsubstrand_data['values']),
                        'pcis': json.dumps(subsubstrand_data['pcis']),
                        'links_to_other_subjects': json.dumps(subsubstrand_data['linkToOtherSubjects']),
                        'sequence_order': substrand_count + 1,
                        'created_at': now
                    })
                    
                    substrand_count += 1
        
        session.commit()
        
        print(f"✓ Successfully imported:")
        print(f"  - Template ID: {template_id}")
        print(f"  - Strands: {strand_count}")
        print(f"  - Sub-sub-strands: {substrand_count}")
        print(f"  - Total lessons: {sum(len(s['subStrands']) * len(ss['subSubStrands']) * ss['subSubStrands'][0]['numberOfLessons'] for s in data['strands'] for ss in s['subStrands'] if ss['subSubStrands'])}")
        
        return True
        
    except Exception as e:
        session.rollback()
        print(f"✗ Import failed: {str(e)}")
        return False
        
    finally:
        session.close()


def main():
    if len(sys.argv) < 2:
        print("Usage: python import_grade8_kiswahili.py <json_file>")
        print("Example: python import_grade8_kiswahili.py 'G8/grade 8 kiswahili.json'")
        sys.exit(1)
    
    json_file = sys.argv[1]
    
    if not os.path.exists(json_file):
        print(f"✗ File not found: {json_file}")
        sys.exit(1)
    
    success = import_kiswahili_curriculum(json_file)
    
    if success:
        print("\n🎉 Grade 8 Kiswahili curriculum imported successfully!")
    else:
        print("\n❌ Import failed. Please check the errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()