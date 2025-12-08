"""Delete Kiswahili curriculum to reimport with correct structure"""
from database import SessionLocal
from models import CurriculumTemplate

db = SessionLocal()
try:
    kiswahili = db.query(CurriculumTemplate).filter(
        CurriculumTemplate.subject == 'Kiswahili',
        CurriculumTemplate.grade == 'Grade 9'
    ).first()
    if kiswahili:
        db.delete(kiswahili)
        db.commit()
        print(f'✅ Deleted Kiswahili Grade 9 (ID: {kiswahili.id})')
    else:
        print('❌ Kiswahili Grade 9 not found')
finally:
    db.close()
