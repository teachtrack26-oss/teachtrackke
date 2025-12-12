
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models import CurriculumTemplate
from config import settings
from urllib.parse import quote_plus

# Setup DB connection
encoded_password = quote_plus(settings.DB_PASSWORD)
DATABASE_URL = f"mysql+pymysql://{settings.DB_USER}:{encoded_password}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def fix_and_report():
    print("--- Fixing and Reporting ---")
    
    # 1. Fix GRADE 9 -> Grade 9
    # Use binary comparison for case sensitivity if needed, or just iterate in python
    templates = db.query(CurriculumTemplate).all()
    
    g9_bad = [t for t in templates if t.grade == "GRADE 9"]
    for t in g9_bad:
        print(f"Fixing {t.subject} (GRADE 9 -> Grade 9)")
        t.grade = "Grade 9"
        
    # 2. Check Darasa la 7
    darasa = [t for t in templates if t.grade == "Darasa la 7"]
    for t in darasa:
        print(f"Found Darasa la 7: {t.subject}")
        # Check if Grade 7 equivalent exists
        g7_equiv = next((x for x in templates if x.grade == "Grade 7" and x.subject == t.subject), None)
        if g7_equiv:
            print(f"  - Duplicate of Grade 7 {g7_equiv.subject} (ID: {g7_equiv.id})")
            print(f"  - Deleting Darasa la 7 version (ID: {t.id})")
            db.delete(t)
        else:
            print(f"  - No Grade 7 equivalent found. Renaming to Grade 7.")
            t.grade = "Grade 7"

    db.commit()
    
    # 3. Identify Missing
    # Refresh templates
    templates = db.query(CurriculumTemplate).all()
    by_grade = {}
    for t in templates:
        if t.grade not in by_grade:
            by_grade[t.grade] = set()
        by_grade[t.grade].add(t.subject)
        
    expected = {
        "Grade 4": ["Science and Technology"],
        "Grade 1": ["Hygiene and Nutrition Activities"],
        "Grade 2": ["Hygiene and Nutrition Activities"],
        "Grade 3": ["Hygiene and Nutrition Activities"],
    }
    
    print("\n--- Missing Subjects Analysis ---")
    for grade, subjects in expected.items():
        current = by_grade.get(grade, set())
        for subj in subjects:
            if subj not in current:
                print(f"MISSING: {grade} - {subj}")
                
                # Create placeholder if missing
                print(f"  - Creating placeholder for {grade} - {subj}")
                new_t = CurriculumTemplate(
                    grade=grade,
                    subject=subj,
                    education_level="Lower Primary" if grade in ["Grade 1", "Grade 2", "Grade 3"] else "Upper Primary"
                )
                db.add(new_t)
                
    # 4. Fix Uppercase Subject
    agri_upper = db.query(CurriculumTemplate).filter(
        CurriculumTemplate.grade == "Grade 9",
        CurriculumTemplate.subject == "AGRICULTURE AND NUTRITION"
    ).first()
    if agri_upper:
        print("Fixing uppercase subject: AGRICULTURE AND NUTRITION -> Agriculture and Nutrition")
        agri_upper.subject = "Agriculture and Nutrition"
        db.commit()

if __name__ == "__main__":
    fix_and_report()
