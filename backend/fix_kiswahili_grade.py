"""Fix Kiswahili template grade from 'Darasa la 7' to 'Grade 7'"""
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from urllib.parse import quote_plus

env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

engine = create_engine(f'mysql+pymysql://root:{quote_plus(os.getenv("DB_PASSWORD"))}@localhost:3306/teachtrack')

with engine.connect() as conn:
    # Check current state
    result = conn.execute(text("""
        SELECT id, subject, grade, education_level
        FROM curriculum_templates
        WHERE id = 140
    """))
    
    row = result.fetchone()
    print(f"Before update:")
    print(f"  ID: {row[0]}")
    print(f"  Subject: {row[1]}")
    print(f"  Grade: '{row[2]}'")
    print(f"  Education Level: {row[3]}")
    
    # Update to Grade 7
    conn.execute(text("""
        UPDATE curriculum_templates 
        SET grade = 'Grade 7'
        WHERE id = 140
    """))
    conn.commit()
    
    print("\n✓ Updated grade from 'Darasa la 7' to 'Grade 7'")
    
    # Verify
    result = conn.execute(text("""
        SELECT id, subject, grade, education_level
        FROM curriculum_templates
        WHERE id = 140
    """))
    
    row = result.fetchone()
    print(f"\nAfter update:")
    print(f"  Grade: '{row[2]}'")
    print(f"\nNow Kiswahili should appear in the Grade 7 curriculum list!")
