import os
import json
import sys
from sqlalchemy.orm import Session
from database import SessionLocal
from models import CurriculumTemplate, Subject, Strand, SubStrand, Lesson
from curriculum_importer import import_curriculum_from_json

def force_reimport_all(db: Session):
    base_dir = r"c:\Users\MKT\desktop\teachtrack\data\curriculum"
    
    # Iterate G1 to G9
    for i in range(1, 10):
        grade_dir = os.path.join(base_dir, f"G{i}")
        if not os.path.exists(grade_dir):
            continue
            
        print(f"Processing Grade {i}...")
        for filename in os.listdir(grade_dir):
            if not filename.endswith(".json"):
                continue
                
            file_path = os.path.join(grade_dir, filename)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                subject_name = data.get("subject") or data.get("subjectName")
                grade_name = data.get("grade")
                
                if isinstance(grade_name, int):
                    grade_name = f"Grade {grade_name}"
                
                if not subject_name or not grade_name:
                    print(f"Skipping {filename}: Missing subject or grade")
                    continue
                    
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
                print(f"  Error processing {filename}: {e}")

if __name__ == "__main__":
    db = SessionLocal()
    force_reimport_all(db)
    db.close()
