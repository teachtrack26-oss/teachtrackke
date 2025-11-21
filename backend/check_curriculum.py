"""Quick script to check curriculum data"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from urllib.parse import quote_plus

load_dotenv()

engine = create_engine(f'mysql+pymysql://root:{quote_plus(os.getenv("DB_PASSWORD"))}@localhost:3306/teachtrack')

with engine.connect() as conn:
    # Check templates
    result = conn.execute(text('''
        SELECT ct.id, ct.subject, ct.grade, 
               COUNT(DISTINCT ts.id) as strands, 
               COUNT(DISTINCT tss.id) as substrands
        FROM curriculum_templates ct
        LEFT JOIN template_strands ts ON ct.id = ts.curriculum_template_id
        LEFT JOIN template_substrands tss ON ts.id = tss.strand_id
        GROUP BY ct.id
        ORDER BY ct.id DESC
        LIMIT 5
    '''))
    
    print("\nRecent Curriculum Templates:")
    print(f"{'ID':<5} {'Subject':<25} {'Grade':<10} {'Strands':<10} {'Sub-strands':<15}")
    print("-" * 75)
    for row in result:
        print(f"{row[0]:<5} {row[1]:<25} {row[2]:<10} {row[3]:<10} {row[4]:<15}")
