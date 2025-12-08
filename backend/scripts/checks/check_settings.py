from database import SessionLocal
from models import SchoolSettings, SchoolTerm

db = SessionLocal()

settings = db.query(SchoolSettings).all()
print(f"Found {len(settings)} SchoolSettings entries:")
for s in settings:
    print(f"ID: {s.id}, Name: {s.school_name}")

db.close()
