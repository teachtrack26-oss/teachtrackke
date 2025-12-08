from database import SessionLocal
from models import CurriculumTemplate

db = SessionLocal()
templates = db.query(CurriculumTemplate).order_by(CurriculumTemplate.grade, CurriculumTemplate.subject).all()

print(f"{'ID':<5} {'Grade':<10} {'Subject':<40} {'Active'}")
print("-" * 70)
for t in templates:
    print(f"{t.id:<5} {t.grade:<10} {t.subject:<40} {t.is_active}")

db.close()
