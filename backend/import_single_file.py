
import os
import json
import sys
from sqlalchemy.orm import Session
from database import SessionLocal
from models import CurriculumTemplate
from curriculum_importer import import_curriculum_from_json

def import_single_file(file_path: str):
    db: Session = SessionLocal()
    try:
        print(f"Processing {file_path}...")
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        subject_name = data.get("subject") or data.get("subjectName")
        grade_name = data.get("grade")
        
        if isinstance(grade_name, int):
            grade_name = f"Grade {grade_name}"
        
        if not subject_name or not grade_name:
            print(f"Skipping {file_path}: Missing subject or grade")
            return

        # Find existing template
        existing = db.query(CurriculumTemplate).filter(
            CurriculumTemplate.subject == subject_name,
            CurriculumTemplate.grade == grade_name
        ).first()
        
        if existing:
            print(f"  Deleting existing template for {subject_name} {grade_name} (ID: {existing.id})")
            db.delete(existing)
            db.commit()
        
        # Import new
        print(f"  Importing {subject_name} {grade_name}...")
        result = import_curriculum_from_json(data, db)
        if result["success"]:
            print(f"    Success! ID: {result['curriculum_id']}, Lessons: {result['stats']['lessons']}")
        else:
            print(f"    Failed: {result['message']}")
            
    except Exception as e:
        print(f"  Error processing {file_path}: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_single_file.py <path_to_json>")
        sys.exit(1)
    
    import_single_file(sys.argv[1])
