from database import SessionLocal
from models import CurriculumTemplate

db = SessionLocal()
templates = db.query(CurriculumTemplate).all()

print(f"Total templates: {len(templates)}")
for t in templates:
    print(f"ID: {t.id}, Subject: {t.subject}, Grade: {t.grade}, Active: {t.is_active}")

db.close()
