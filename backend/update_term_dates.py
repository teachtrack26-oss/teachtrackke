from database import SessionLocal
from models import SchoolTerm

db = SessionLocal()

school_settings_id = 1
year = 2025

terms_data = [
    {
        "term_number": 1,
        "start_date": "2025-01-06",
        "end_date": "2025-04-04",
        "mid_term_break_start": "2025-02-26",
        "mid_term_break_end": "2025-03-02"
    },
    {
        "term_number": 2,
        "start_date": "2025-04-28",
        "end_date": "2025-08-01",
        "mid_term_break_start": "2025-06-25",
        "mid_term_break_end": "2025-06-29"
    },
    {
        "term_number": 3,
        "start_date": "2025-08-25",
        "end_date": "2025-10-24",
        "mid_term_break_start": None,
        "mid_term_break_end": None
    }
]

for data in terms_data:
    term = db.query(SchoolTerm).filter(
        SchoolTerm.school_settings_id == school_settings_id,
        SchoolTerm.year == year,
        SchoolTerm.term_number == data["term_number"]
    ).first()

    if term:
        print(f"Updating Term {data['term_number']}...")
        term.start_date = data["start_date"]
        term.end_date = data["end_date"]
        term.mid_term_break_start = data["mid_term_break_start"]
        term.mid_term_break_end = data["mid_term_break_end"]
    else:
        print(f"Creating Term {data['term_number']}...")
        term = SchoolTerm(
            school_settings_id=school_settings_id,
            year=year,
            term_number=data["term_number"],
            start_date=data["start_date"],
            end_date=data["end_date"],
            mid_term_break_start=data["mid_term_break_start"],
            mid_term_break_end=data["mid_term_break_end"]
        )
        db.add(term)

db.commit()
print("Term dates updated successfully.")
db.close()
