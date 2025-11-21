"""
Admin Script: Import Grade 7 Pre-Technical Studies Curriculum JSON to Database
"""

import json
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from urllib.parse import quote_plus

# Load environment variables
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME", "teachtrack")

if not DB_PASSWORD:
    print("ERROR: DB_PASSWORD not found in .env file")
    sys.exit(1)

# URL-encode password to handle special characters
DB_PASSWORD_ENCODED = quote_plus(DB_PASSWORD)
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD_ENCODED}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
print(f"[INFO] Connecting to database: {DB_NAME} at {DB_HOST}:{DB_PORT}")

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)


def validate_json_structure(data):
    """Validate curriculum JSON structure (snake_case version)"""
    required_fields = ['subject', 'grade', 'strands']
    
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")
    
    if not isinstance(data['strands'], list) or len(data['strands']) == 0:
        raise ValueError("strands must be a non-empty array")
    
    # Validate first strand structure
    strand = data['strands'][0]
    required_strand_fields = ['strand_number', 'strand_name', 'sub_strands']
    for field in required_strand_fields:
        if field not in strand:
            raise ValueError(f"Missing required strand field: {field}")
    
    # Validate first sub-strand structure
    if len(strand['sub_strands']) > 0:
        substrand = strand['sub_strands'][0]
        required_substrand_fields = [
            'sub_strand_number', 'sub_strand_name', 'number_of_lessons',
            'specific_learning_outcomes', 'suggested_learning_experiences',
            'key_inquiry_questions', 'core_competencies', 'values',
            'pcis', 'link_to_other_subjects'
        ]
        for field in required_substrand_fields:
            if field not in substrand:
                raise ValueError(f"Missing required sub-strand field: {field}")
    
    return True


def import_curriculum(json_file_path):
    """Import curriculum JSON to database"""
    
    print(f"Reading JSON file: {json_file_path}")
    
    # Load JSON
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Subject: {data.get('subject')}")
    print(f"Grade: {data.get('grade')}")
    
    # Validate structure
    try:
        validate_json_structure(data)
        print("✓ JSON structure validated")
    except ValueError as e:
        print(f"✗ Validation error: {e}")
        return False
    
    session = Session()
    
    try:
        # Check if template already exists
        result = session.execute(
            text("SELECT id FROM curriculum_templates WHERE subject = :subject AND grade = :grade"),
            {"subject": data['subject'], "grade": data['grade']}
        )
        existing = result.fetchone()
        
        if existing:
            print(f"⚠ Template already exists for {data['subject']} {data['grade']}")
            # Auto-overwrite for this script as we are in a repair/update loop
            print("Overwriting existing template...")
            
            # Delete existing template (cascades to strands and substrands)
            session.execute(
                text("DELETE FROM curriculum_templates WHERE id = :id"),
                {"id": existing[0]}
            )
            session.commit()
            print("✓ Existing template deleted")
        
        # Insert curriculum template
        result = session.execute(
            text("""
                INSERT INTO curriculum_templates (subject, grade, education_level)
                VALUES (:subject, :grade, :education_level)
            """),
            {
                "subject": data['subject'],
                "grade": data['grade'],
                "education_level": data.get('education_level', 'Junior Secondary')
            }
        )
        template_id = result.lastrowid
        session.commit()
        print(f"✓ Created curriculum template (ID: {template_id})")
        
        # Insert strands and sub-strands
        total_strands = 0
        total_substrands = 0
        
        for strand_idx, strand in enumerate(data['strands']):
            # Insert strand
            result = session.execute(
                text("""
                    INSERT INTO template_strands 
                    (curriculum_template_id, strand_number, strand_name, sequence_order)
                    VALUES (:template_id, :strand_number, :strand_name, :sequence_order)
                """),
                {
                    "template_id": template_id,
                    "strand_number": strand['strand_number'],
                    "strand_name": strand['strand_name'],
                    "sequence_order": strand_idx + 1
                }
            )
            strand_id = result.lastrowid
            total_strands += 1
            
            # Insert sub-strands
            for substrand_idx, substrand in enumerate(strand.get('sub_strands', [])):
                session.execute(
                    text("""
                        INSERT INTO template_substrands (
                            strand_id, substrand_number, substrand_name, number_of_lessons,
                            specific_learning_outcomes, suggested_learning_experiences,
                            key_inquiry_questions, core_competencies, `values`, pcis,
                            links_to_other_subjects, sequence_order
                        ) VALUES (
                            :strand_id, :substrand_number, :substrand_name, :number_of_lessons,
                            :specific_learning_outcomes, :suggested_learning_experiences,
                            :key_inquiry_questions, :core_competencies, :values, :pcis,
                            :links_to_other_subjects, :sequence_order
                        )
                    """),
                    {
                        "strand_id": strand_id,
                        "substrand_number": substrand['sub_strand_number'],
                        "substrand_name": substrand['sub_strand_name'],
                        "number_of_lessons": substrand['number_of_lessons'],
                        "specific_learning_outcomes": json.dumps(substrand.get('specific_learning_outcomes', [])),
                        "suggested_learning_experiences": json.dumps(substrand.get('suggested_learning_experiences', [])),
                        "key_inquiry_questions": json.dumps(substrand.get('key_inquiry_questions', [])),
                        "core_competencies": json.dumps(substrand.get('core_competencies', [])),
                        "values": json.dumps(substrand.get('values', [])),
                        "pcis": json.dumps(substrand.get('pcis', [])),
                        "links_to_other_subjects": json.dumps(substrand.get('link_to_other_subjects', [])),
                        "sequence_order": substrand_idx + 1
                    }
                )
                total_substrands += 1
        
        session.commit()
        
        print(f"\n✓ Import successful!")
        print(f"  - {total_strands} strands imported")
        print(f"  - {total_substrands} sub-strands imported")
        print(f"  - Template ID: {template_id}")
        
        return True
        
    except Exception as e:
        session.rollback()
        print(f"\n✗ Import failed: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        session.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_grade7_pre_technical.py <json_file_path>")
        sys.exit(1)
    
    json_file = sys.argv[1]
    
    if not os.path.exists(json_file):
        print(f"Error: File not found: {json_file}")
        sys.exit(1)
    
    success = import_curriculum(json_file)
    sys.exit(0 if success else 1)
