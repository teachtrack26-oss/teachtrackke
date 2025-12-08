from database import SessionLocal
from models import SchoolTerm

db = SessionLocal()
terms = db.query(SchoolTerm).all()

if terms:
    print(f"Found {len(terms)} terms:")
    for term in terms:
        print(f"ID: {term.id}, Term {term.term_number} ({term.year}), Settings ID: {term.school_settings_id}")
else:
    print("No terms found.")
