import argparse
import os
import json
import sys

# Allow running from repo root (adds backend/ to sys.path)
BACKEND_DIR = os.path.abspath(os.path.dirname(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from sqlalchemy.orm import Session

from database import SessionLocal
from models import CurriculumTemplate
from curriculum_importer import import_curriculum_from_json

def _default_base_dir() -> str:
    # backend/force_reimport_curriculum.py -> repo root/data/curriculum
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    return os.path.join(repo_root, "data", "curriculum")


def force_reimport_all(db: Session, base_dir: str, grade_filter: str | None = None):
    base_dir = os.path.abspath(base_dir)
    if grade_filter:
        grade_filter = grade_filter.strip()
        if grade_filter.isdigit():
            grade_filter = f"Grade {grade_filter}"
    
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

                if grade_filter and str(grade_name).strip().lower() != grade_filter.lower():
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
    parser = argparse.ArgumentParser(description="Force re-import curriculum JSON files (delete and re-create templates)")
    parser.add_argument(
        "--base-dir",
        default=_default_base_dir(),
        help="Directory containing curriculum JSONs (default: repo-root/data/curriculum)",
    )
    parser.add_argument(
        "--grade",
        default=None,
        help='Optional grade filter. Examples: "Grade 8" or "8"',
    )
    args = parser.parse_args()

    db = SessionLocal()
    try:
        force_reimport_all(db, args.base_dir, args.grade)
    finally:
        db.close()
