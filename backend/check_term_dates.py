from database import SessionLocal
from models import SchoolTerm

db = SessionLocal()
terms = db.query(SchoolTerm).all()

if terms:
    print(f"Found {len(terms)} terms:")
    for term in terms:
        print(f"Term {term.term_number} ({term.year}): {term.start_date} to {term.end_date}")
else:
    print("No terms found in the database.")
