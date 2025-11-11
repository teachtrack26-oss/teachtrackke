"""
Quick test to verify AI curriculum extraction is working
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from curriculum_parser import CurriculumParser

# Test file path
test_pdf = r"c:\Users\MKT\desktop\teachtrack\backend\uploads\curriculum\2_Grade-8-English.pdf"

if not os.path.exists(test_pdf):
    print(f"❌ Test PDF not found: {test_pdf}")
    print("Available files:")
    curriculum_dir = r"c:\Users\MKT\desktop\teachtrack\backend\uploads\curriculum"
    for f in os.listdir(curriculum_dir):
        print(f"  - {f}")
    test_pdf = os.path.join(curriculum_dir, os.listdir(curriculum_dir)[0])
    print(f"\n✓ Using first available: {os.path.basename(test_pdf)}")

print("\n🔍 Testing AI curriculum extraction...")
print(f"📄 File: {os.path.basename(test_pdf)}")
print("-" * 60)

parser = CurriculumParser()
result = parser.parse_pdf(test_pdf, "Grade 8", "English")

print(f"\n📊 Results:")
print(f"  Total Pages: {result.get('totalPages')}")
print(f"  Strands Found: {len(result.get('strands', []))}")
print(f"  Warnings: {len(result.get('parseWarnings', []))}")

if result.get('parseWarnings'):
    print(f"\n⚠️  Parse Warnings:")
    for warning in result['parseWarnings']:
        print(f"    • {warning}")

if result.get('strands'):
    print(f"\n✅ Extracted Strands:")
    for i, strand in enumerate(result['strands'], 1):
        strand_name = strand.get('strandName', 'Unknown')
        strand_code = strand.get('strandNumber', '?')
        sub_count = len(strand.get('subStrands', []))
        print(f"  {i}. [{strand_code}] {strand_name} ({sub_count} sub-strands)")
        
        # Show first 2 sub-strands
        for j, sub in enumerate(strand.get('subStrands', [])[:2], 1):
            sub_code = sub.get('subStrandNumber', '?')
            sub_name = sub.get('subStrandName', 'Unknown')
            lessons = sub.get('numberOfLessons', 0)
            print(f"       {sub_code} {sub_name} ({lessons} lessons)")
        
        if len(strand.get('subStrands', [])) > 2:
            print(f"       ... and {len(strand['subStrands']) - 2} more")

# Check if it's the default structure
is_default = (len(result.get('strands', [])) == 1 and 
              result['strands'][0].get('strandName') == 'Main Content')

print(f"\n{'❌ Using Default Structure' if is_default else '✅ Real Curriculum Extracted!'}")

# Count total lessons
total_lessons = parser.count_total_lessons(result)
print(f"📚 Total Lessons: {total_lessons}")

print("\n" + "=" * 60)
if is_default:
    print("⚠️  AI extraction may have failed. Check:")
    print("  1. OPENROUTER_API_KEY is set in backend/.env")
    print("  2. Internet connection is working")
    print("  3. OpenRouter API status: https://status.openrouter.ai/")
else:
    print("🎉 SUCCESS! AI is working and extracting real curriculum data!")
