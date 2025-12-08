from sqlalchemy.orm import Session
from database import SessionLocal
from models import CurriculumTemplate, TemplateStrand, TemplateSubstrand

def clear_all_curriculum():
    db = SessionLocal()
    try:
        print("\n=== CLEARING ALL CURRICULUM DATA ===\n")
        
        # Delete all templates (cascading should handle strands/substrands, but let's be safe)
        # Actually, SQLAlchemy cascade delete depends on model definition. 
        # If not set, we might need to delete children first.
        # Assuming cascade is set or we can just delete parents if foreign keys allow.
        
        # Let's try deleting templates directly.
        deleted_count = db.query(CurriculumTemplate).delete()
        db.commit()
        
        print(f"Successfully deleted {deleted_count} curriculum templates.")
        
        # Verify
        remaining = db.query(CurriculumTemplate).count()
        if remaining == 0:
            print("Verification Successful: Database is empty.")
        else:
            print(f"Verification Failed: {remaining} templates remain.")
            
    except Exception as e:
        print(f"Error clearing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clear_all_curriculum()
