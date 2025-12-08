
import json
import sys

try:
    with open('data/curriculum/G3/grade-3-english.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    missing_fields = []
    required_fields = ['numberOfLessons', 'coreCompetencies', 'values', 'pcis', 'linkToOtherSubjects']
    
    print(f"Checking {len(data['strands'])} strands...")
    
    for strand in data['strands']:
        for sub_strand in strand['subStrands']:
            missing = [field for field in required_fields if field not in sub_strand]
            if missing:
                missing_fields.append(f"{strand['strandTitle']} - {sub_strand['subStrandTitle']}: Missing {missing}")

    if not missing_fields:
        print("✅ VALIDATION SUCCESS: All sub-strands have required metadata.")
    else:
        print(f"❌ VALIDATION FAILED: Found {len(missing_fields)} sub-strands with missing data.")
        for m in missing_fields:
            print(m)
        sys.exit(1)

except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
