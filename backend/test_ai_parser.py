"""
Quick test of AI-powered curriculum parser
"""
import os
from curriculum_parser import EnhancedCurriculumParser

# Test file path
test_pdf = os.path.join(os.path.dirname(__file__), "uploads", "curriculum", "2_Grade-7-Mathematics.pdf")

if not os.path.exists(test_pdf):
    print(f"ERROR: Test file not found: {test_pdf}")
    print(f"Available files in uploads/curriculum/:")
    uploads_dir = os.path.join(os.path.dirname(__file__), "uploads", "curriculum")
    if os.path.exists(uploads_dir):
        for f in os.listdir(uploads_dir):
            print(f"   - {f}")
    exit(1)

print("="*80)
print("AI CURRICULUM PARSER TEST")
print("="*80)
print(f"Testing: {os.path.basename(test_pdf)}")
print("="*80)

# Initialize parser with debug enabled
parser = EnhancedCurriculumParser(debug=True)

# Parse the curriculum
result = parser.parse_pdf(test_pdf, "Grade 7", "Mathematics")

# Display results
print("\n" + "="*80)
print("RESULTS SUMMARY")
print("="*80)
print(f"Total Pages: {result['totalPages']}")
print(f"Strands Found: {len(result['strands'])}")
print(f"Processing Time: {result['processingTime']}s")
print(f"Model Used: {result['modelUsed']}")
print(f"Extraction Method: {result['extractionMethod']}")

if result['parseWarnings']:
    print(f"\nWarnings ({len(result['parseWarnings'])}):")
    for w in result['parseWarnings']:
        print(f"   - {w}")

print(f"\nStrands Extracted:")
for i, strand in enumerate(result['strands'][:3], 1):  # Show first 3
    print(f"\n  {i}. [{strand['strandNumber']}] {strand['strandName']}")
    for sub in strand['subStrands'][:2]:  # Show first 2 sub-strands
        print(f"     +- {sub['subStrandNumber']} {sub['subStrandName']} ({sub['numberOfLessons']} lessons)")

total_lessons = parser.count_total_lessons(result)
print(f"\nTotal Lessons: {total_lessons}")

# Check if it's default structure or actual extraction
is_default = (len(result['strands']) == 1 and 
              result['strands'][0]['strandName'] == 'Main Content')

if is_default:
    print("\nRESULT: Default structure (AI extraction failed)")
else:
    print("\nRESULT: AI extraction successful!")

print("="*80)
