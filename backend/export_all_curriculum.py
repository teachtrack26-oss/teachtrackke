import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import CurriculumTemplate
from config import settings
from urllib.parse import quote_plus
from export_curriculum_to_json import export_curriculum

# Setup database connection
encoded_password = quote_plus(settings.DB_PASSWORD)
DATABASE_URL = f"mysql+pymysql://{settings.DB_USER}:{encoded_password}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def export_all():
    db = SessionLocal()
    try:
        # Create export directory
        output_dir = "../data/curriculum_backup"
        os.makedirs(output_dir, exist_ok=True)

        # Get all templates
        templates = db.query(CurriculumTemplate).order_by(CurriculumTemplate.grade, CurriculumTemplate.subject).all()
        print(f"Found {len(templates)} templates. Starting export to {output_dir}...")

        for t in templates:
            safe_subject = t.subject.replace(" ", "_").replace("/", "_")
            safe_grade = t.grade.replace(" ", "_")
            filename = os.path.join(output_dir, f"{safe_grade}_{safe_subject}.json")
            
            # print(f"Exporting {t.grade} - {t.subject}...")
            export_curriculum(t.grade, t.subject, filename)
            
        print(f"\nSuccessfully exported {len(templates)} curriculum files.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    export_all()
