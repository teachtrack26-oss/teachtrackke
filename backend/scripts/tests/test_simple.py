import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from curriculum_parser import CurriculumParser

import os
test_pdf = os.path.join(os.path.dirname(__file__), "uploads", "curriculum", "2_Grade-7-Mathematics.pdf")

print("\n" + "="*60)
print("Testing AI Curriculum Extraction")
print("="*60)
print(f"File: {os.path.basename(test_pdf)}")

parser = CurriculumParser()
result = parser.parse_pdf(test_pdf, "Grade 7", "Mathematics")

print(f"\nTotal Pages: {result.get('totalPages', 0)}")
print(f"Strands: {len(result.get('strands', []))}")
print(f"Warnings: {result.get('parseWarnings', [])}")

if result.get('strands') and len(result['strands']) > 0:
    for strand in result['strands'][:2]:
        print(f"\n  [{strand.get('strandNumber')}] {strand.get('strandName')}")
        for sub in strand.get('subStrands', [])[:2]:
            print(f"    {sub.get('subStrandNumber')} {sub.get('subStrandName')} ({sub.get('numberOfLessons')} lessons)")

is_default = (len(result.get('strands', [])) == 1 and 
              result['strands'][0].get('strandName') == 'Main Content')

print(f"\nResult: {'DEFAULT STRUCTURE' if is_default else 'AI EXTRACTED!'}")
print("="*60)
