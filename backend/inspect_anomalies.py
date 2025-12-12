
from sqlalchemy import create_engine
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

def inspect_anomalies():
    print("--- Inspecting Anomalies ---")
    
    # 1. Check Grade 9 Agriculture
    g9_agri = db.query(CurriculumTemplate).filter(CurriculumTemplate.grade == "GRADE 9").first()
    if g9_agri:
        print(f"Found GRADE 9 subject: {g9_agri.subject}")
    
    # 2. Check Darasa la 7
    darasa = db.query(CurriculumTemplate).filter(CurriculumTemplate.grade == "Darasa la 7").first()
    if darasa:
        print(f"Found Darasa la 7 subject: {darasa.subject}")
        
    # 3. Check Grade 7 Kiswahili
    g7_kiswahili = db.query(CurriculumTemplate).filter(
        CurriculumTemplate.grade == "Grade 7", 
        CurriculumTemplate.subject == "Kiswahili"
    ).first()
    if g7_kiswahili:
        print(f"Found Grade 7 Kiswahili")

    # 5. Check Hygiene
    hygiene = db.query(CurriculumTemplate).filter(
        CurriculumTemplate.subject.ilike("%Hygiene%")
    ).all()
    print(f"Hygiene subjects found: {[s.subject for s in hygiene]}")

if __name__ == "__main__":
    inspect_anomalies()
