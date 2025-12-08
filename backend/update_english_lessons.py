import json

file_path = '../data/curriculum/G4/grade-4-english.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

lesson_counts = {
    "1.1": 3, "1.2": 3, "1.3": 3, "1.4": 3,
    "2.1": 3, "2.2": 3, "2.3": 3, "2.4": 3,
    "3.1": 3, "3.2": 3, "3.3": 3, "3.4": 3,
    "4.1": 3, "4.2": 3, "4.3": 3, "4.4": 3,
    "5.1": 3, "5.2": 3, "5.3": 3, "5.4": 3,
    "6.1": 3, "6.2": 3, "6.3": 3, "6.4": 3,
    "7.1": 3, "7.2": 3, "7.3": 3, "7.4": 3,
    "8.1": 3, "8.2": 2, "8.3": 3, "8.4": 3
}

for strand in data['strands']:
    for sub_strand in strand['subStrands']:
        sub_id = sub_strand.get('subStrandId')
        if sub_id in lesson_counts:
            sub_strand['number_of_lessons'] = lesson_counts[sub_id]
        # Also fix the key name if it's different in the importer
        # The importer usually looks for 'number_of_lessons' or 'numberOfLessons'
        # Let's use 'number_of_lessons' as per other files.

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print("Updated lesson counts.")
