import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the current directory to the python path so we can import backend modules
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.models import CurriculumTemplate, TemplateStrand
from backend.database import SessionLocal

# Database setup
session = SessionLocal()

def cleanup_duplicate_strands():
    template_id = 63
    print(f"Checking strands for Template ID: {template_id}")
    
    strands = session.query(TemplateStrand).filter_by(curriculum_template_id=template_id).all()
    
    for strand in strands:
        print(f"Found Strand: ID={strand.id}, Title='{strand.strand_name}', Strand ID='{strand.strand_number}'")
        
        if strand.strand_name == "Measurements":
            print(f"Deleting duplicate strand: {strand.strand_name}")
            session.delete(strand)
            
    session.commit()
    print("Cleanup complete.")

if __name__ == "__main__":
    cleanup_duplicate_strands()
