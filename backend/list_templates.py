"""List all curriculum templates"""
from database import SessionLocal
from models import CurriculumTemplate

db = SessionLocal()
try:
    templates = db.query(CurriculumTemplate).all()
    print(f"\n📚 Found {len(templates)} curriculum templates:\n")
    for t in templates:
        print(f"  ID: {t.id:2d} | {t.subject:30s} | {t.grade:10s} | Active: {t.is_active}")
finally:
    db.close()
