"""Debug the Kiswahili JSON import"""
import json

# Read the file
with open('../G9/grade 9 kiswahili.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

# Check one strand
strand_14 = [s for s in data['strands'] if s['strandNumber'] == '14.0'][0]
print(f"Strand: {strand_14['strandNumber']} - {strand_14['strandName']}")
print(f"\nKeys in strand data: {strand_14.keys()}")

# Check subStrands
if 'subStrands' in strand_14:
    print(f"\nFound 'subStrands' key!")
    print(f"Number of subStrands: {len(strand_14['subStrands'])}")
    
    # Check first substrand
    sub1 = strand_14['subStrands'][0]
    print(f"\nFirst substrand: {sub1['subStrandNumber']} - {sub1['subStrandName']}")
    print(f"Keys: {sub1.keys()}")
    
    # Check if it has subSubStrands
    if 'subSubStrands' in sub1:
        print(f"\n✅ Found 'subSubStrands' key!")
        print(f"Number of subSubStrands: {len(sub1['subSubStrands'])}")
        
        # Show first subsubstrand
        subsub = sub1['subSubStrands'][0]
        print(f"\nFirst subSubStrand: {subsub['subSubStrandNumber']} - {subsub['subSubStrandName']}")
        print(f"Lessons: {subsub['numberOfLessons']}")
        if 'specificLearningOutcomes' in subsub:
            print(f"Has {len(subsub['specificLearningOutcomes'])} learning outcomes")
else:
    print("\n❌ 'subStrands' key not found!")
    print(f"Available keys: {strand_14.keys()}")
