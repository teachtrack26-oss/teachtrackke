from database import SessionLocal
from models import School, SchoolTerm

db = SessionLocal()

# Search for the school
schools = db.query(School).filter(School.name.ilike("%lm%")).all()

print(f"Found {len(schools)} schools matching 'lm':")
for school in schools:
    print(f"ID: {school.id}, Name: {school.name}")

# Also list all schools just in case
if not schools:
    print("Listing all schools:")
    all_schools = db.query(School).all()
    for school in all_schools:
        print(f"ID: {school.id}, Name: {school.name}")

db.close()
