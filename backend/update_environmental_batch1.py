#!/usr/bin/env python3
"""
Batch 1: Update Environmental Activities Grade 1 - Strand 1.0 Social Environment (5 sub-strands)
"""
import json

# Path to the JSON file
json_path = r"C:\Users\MKT\desktop\teachtrack\data\curriculum\G1\grade-1-environmental-activities.json"

# Strand 1.0 Social Environment data
strand_1_updates = {
    "1.1": {
        "numberOfLessons": 13,
        "coreCompetencies": [
            "Creativity and Imagination: learner exhibits the skill of originality when making a healthy habit poster showing the importance of oral habits"
        ],
        "values": [
            "Responsibility: learner enhances diligence and excellence while cleaning body parts without wasting cleaning agents and water"
        ],
        "pcis": [
            "Life Skills: learner develops self-awareness when taking care of different body parts",
            "Health Promotion Issues: learner develops the skill of cleaning own body parts as a way of practising personal cleanliness"
        ],
        "linksToOtherSubjects": [
            "Taking an account of cleaning the body parts relates to the skill of journaling in English Language Activities"
        ]
    },
    "1.2": {
        "numberOfLessons": 8,
        "coreCompetencies": [
            "Learning to Learn: learner develops independence when cleaning furniture using suitable materials"
        ],
        "values": [
            "Responsibility: learner enhances self-drive when keeping the home environment clean such as practising cleaning assorted home items using suitable cleaning materials"
        ],
        "pcis": [
            "Disaster risk reduction: learner develops awareness of potential risk areas and objects that can cause harm/accidents to foster the safety of self and others"
        ],
        "linksToOtherSubjects": [
            "Materials used for cleaning relate to items used in Creative Activities to clean self after finger painting activities"
        ]
    },
    "1.3": {
        "numberOfLessons": 13,
        "coreCompetencies": [
            "Digital Literacy: learner manipulates digital devices when recording poems and songs on different family needs",
            "Self-efficacy: learner sorts and groups locally assorted food items into types of tastes"
        ],
        "values": [
            "Respect: learner appreciates diverse opinions when sharing information on different family needs"
        ],
        "pcis": [
            "Life Skills: learner develops the skill of self-awareness when drawing, colouring and grouping different family needs"
        ],
        "linksToOtherSubjects": [
            "Basic needs of the family such as water relates to filling and emptying activities in Mathematical Activities"
        ]
    },
    "1.4": {
        "numberOfLessons": 9,
        "coreCompetencies": [
            "Digital Literacy: learner interacts with digital technology when playing educative games to locate main features between home and school"
        ],
        "values": [
            "Unity: learner enriches cooperation and team spirit when role-playing safety measures to take on the way to school"
        ],
        "pcis": [
            "Safety: learner acquires child road safety awareness when role-playing safety measures to take on the way to school and back"
        ],
        "linksToOtherSubjects": [
            "Drawing physical features between home and school relates to the skill of drawing and colouring in Creative Activities"
        ]
    },
    "1.5": {
        "numberOfLessons": 9,
        "coreCompetencies": [
            "Communication and Collaboration: learner listens keenly and speaks effectively when sharing information with peers on the roles of people found in a market"
        ],
        "values": [
            "Unity: learner enhances cooperation with peers when drawing and colouring different food items found in the market"
        ],
        "pcis": [
            "Social-economic issues: learner develops the skill of career awareness when sharing information with peers on the roles of people found in a market"
        ],
        "linksToOtherSubjects": [
            "Food items found in a market relate to concepts of sorting and grouping in Mathematical Activities"
        ]
    }
}

def update_json():
    # Read existing JSON
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    updated_count = 0
    total_lessons = 0
    
    # Find Strand 1.0
    for strand in data['strands']:
        if strand['strandId'] == '1.0':
            print(f"Found Strand: {strand['strandId']} - {strand['strandTitle']}")
            
            for substrand in strand['subStrands']:
                sub_id = substrand['subStrandId']
                if sub_id in strand_1_updates:
                    update_data = strand_1_updates[sub_id]
                    
                    # Apply updates
                    substrand['numberOfLessons'] = update_data['numberOfLessons']
                    substrand['coreCompetencies'] = update_data['coreCompetencies']
                    substrand['values'] = update_data['values']
                    substrand['pcis'] = update_data['pcis']
                    substrand['linksToOtherSubjects'] = update_data['linksToOtherSubjects']
                    
                    print(f"  Updated: {sub_id} - {substrand['subStrandTitle']} ({update_data['numberOfLessons']} lessons)")
                    updated_count += 1
                    total_lessons += update_data['numberOfLessons']
            break
    
    # Write updated JSON
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Batch 1 Complete!")
    print(f"   Updated: {updated_count} sub-strands")
    print(f"   Total lessons: {total_lessons}")

if __name__ == "__main__":
    update_json()
