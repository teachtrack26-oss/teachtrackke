import json
import os
import sys

if len(sys.argv) > 1:
    file_path = sys.argv[1]
else:
    file_path = r"c:\Users\MKT\desktop\teachtrack\data\curriculum\G6\grade-6-mathematics.json"

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    total_lessons = 0
    print(f"Subject: {data.get('subject')}")
    
    for strand in data.get('strands', []):
        print(f"Strand: {strand.get('strandName')}")
        for substrand in strand.get('subStrands', []):
            lessons = substrand.get('number_of_lessons', 0)
            print(f"  - {substrand.get('subStrandName')}: {lessons}")
            total_lessons += lessons
            
    print(f"Total Lessons in JSON: {total_lessons}")

except Exception as e:
    print(f"Error: {e}")
