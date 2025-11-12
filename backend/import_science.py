"""
Import Integrated Science Grade 9
"""
import json
import re
import sys
from database import SessionLocal
from curriculum_importer import import_curriculum_from_json

def camel_to_snake(name):
    name = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', name).lower()

def convert_keys(obj):
    if isinstance(obj, dict):
        return {camel_to_snake(k): convert_keys(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_keys(item) for item in obj]
    else:
        return obj

# Read and prepare file
print('📖 Reading Kiswahili file...')
with open('../G9/grade 9 kiswahili.json', 'r', encoding='utf-8-sig') as f:
    content = f.read()

# Fix smart quotes
content = content.replace('\u201c', '"')
content = content.replace('\u201d', '"')
content = content.replace('\u2018', "'")
content = content.replace('\u2019', "'")

# Fix double-double-quotes (only before comma or bracket)
content = content.replace('"",', '",')
content = content.replace('""', '"')

content = content.strip()

# Parse and convert (use strict=False to be more forgiving)
try:
    data = json.loads(content, strict=False)
except json.JSONDecodeError as e:
    print(f"❌ JSON Error at line {e.lineno}, column {e.colno}: {e.msg}")
    print("Attempting to fix common issues...")
    # Try additional fixes
    import re
    content = re.sub(r'\s+" community"', '', content)  # Remove dangling text
    content = re.sub(r'\\', '', content)  # Remove escapes
    data = json.loads(content, strict=False)

data = convert_keys(data)

print(f"✅ Prepared: {data.get('subject')} {data.get('grade')}")

# Import to database
db = SessionLocal()
try:
    result = import_curriculum_from_json(data, db)
    
    if result['success']:
        print('\n✅ IMPORT SUCCESS!')
        print(f"   {result['message']}")
        print(f"   Curriculum ID: {result['curriculum_id']}")
        print(f"   Strands: {result['stats']['strands']}")
        print(f"   Substrands: {result['stats']['substrands']}")
        print(f"   Lessons: {result['stats']['lessons']}")
    else:
        print(f"\n❌ IMPORT FAILED: {result['message']}")
        sys.exit(1)
finally:
    db.close()
