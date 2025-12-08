#!/usr/bin/env python3
"""
Batch 3: Update CRE Grade 1 - Strand 5.0 The Church (Final batch)
"""
import json

# Path to the JSON file
json_path = r"C:\Users\MKT\desktop\teachtrack\data\curriculum\G1\grade-1-cre.json"

# Strand 5.0 The Church
strand_5_updates = {
    "5.1": {
        "numberOfLessons": 4,
        "coreCompetencies": [
            "Imagination and Creativity: the skill of communication and self-expression is exhibited as learners role-play activities they do in church"
        ],
        "values": [
            "Responsibility: is demonstrated as learners share roles during role-plays and take on different characters"
        ],
        "pcis": [
            "Spiritual Awareness: is enhanced as learners attend and participate in Sunday or Sabbath school activities"
        ],
        "linksToOtherSubjects": [
            "Mathematical Activities: learners record the number of times they go to church",
            "Creative Activities: learners role play, sing and dance to the song in Psalms 100:4"
        ]
    },
    "5.2": {
        "numberOfLessons": 4,
        "coreCompetencies": [
            "Communication and Collaboration: the skill of listening critically and understanding concepts is exhibited as learners compose and say simple prayers in groups",
            "Imagination and Creativity: the skill of exploration is portrayed as learners compose simple prayers"
        ],
        "values": [
            "Love: is demonstrated as learners say simple prayers for family members"
        ],
        "pcis": [
            "Social Cohesion: living together in harmony is enhanced as learners in groups compose simple prayers and recite them"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: creative skills are reinforced as learners compose simple prayers",
            "Mathematical Activities: learners record the number of times they pray at home or in Sunday school"
        ]
    }
}

def update_json():
    # Read existing JSON
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    updated_count = 0
    total_lessons = 0
    
    for strand in data['strands']:
        if strand['strandId'] == '5.0':
            print(f"Found Strand: {strand['strandId']} - {strand['strandTitle']}")
            
            for substrand in strand['subStrands']:
                sub_id = substrand['subStrandId']
                if sub_id in strand_5_updates:
                    update_data = strand_5_updates[sub_id]
                    
                    substrand['numberOfLessons'] = update_data['numberOfLessons']
                    substrand['coreCompetencies'] = update_data['coreCompetencies']
                    substrand['values'] = update_data['values']
                    substrand['pcis'] = update_data['pcis']
                    substrand['linksToOtherSubjects'] = update_data['linksToOtherSubjects']
                    
                    print(f"  ✅ Updated: {sub_id} - {substrand['subStrandTitle']} ({update_data['numberOfLessons']} lessons)")
                    updated_count += 1
                    total_lessons += update_data['numberOfLessons']
    
    # Write updated JSON
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Batch 3 Complete!")
    print(f"   Updated: {updated_count} sub-strands")
    print(f"   Total lessons (Strand 5.0): {total_lessons}")

if __name__ == "__main__":
    update_json()
