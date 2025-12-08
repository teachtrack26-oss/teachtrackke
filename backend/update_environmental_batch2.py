#!/usr/bin/env python3
"""
Batch 2: Update Environmental Activities Grade 1 - Strand 2.0 Natural Environment & Strand 3.0 Resources
"""
import json

# Path to the JSON file
json_path = r"C:\Users\MKT\desktop\teachtrack\data\curriculum\G1\grade-1-environmental-activities.json"

# Strand 2.0 Natural Environment data
strand_2_updates = {
    "2.1": {
        "numberOfLessons": 12,
        "coreCompetencies": [
            "Communication: learner speaks engagingly when telling age-appropriate stories about weather and weather conditions"
        ],
        "values": [
            "Responsibility: learner fosters commitment when making and maintaining a one-week daily journal on weather conditions"
        ],
        "pcis": [
            "Life Skills: learner develops time management skills when making and reading weather charts"
        ],
        "linksToOtherSubjects": [
            "Appearance of the sky and conditions can be used when learning about creation in Religious Activities"
        ]
    },
    "2.2": {
        "numberOfLessons": 10,
        "coreCompetencies": [
            "Self-efficacy: learner develops high self-esteem when modelling different objects using soil"
        ],
        "values": [
            "Social Justice: learner enhances cooperation when filling and emptying cans with soil in turns"
        ],
        "pcis": [
            "Health Promotion Issues: learner develops the skill of washing hands with soap and clean running water after playing with soil"
        ],
        "linksToOtherSubjects": [
            "Aspects of soil relate to modelling items using soil in Creative Activities"
        ]
    },
    "2.3": {
        "numberOfLessons": 12,
        "coreCompetencies": [
            "Self-efficacy: learner develops confidence when imitating various sounds produced by animals or objects"
        ],
        "values": [
            "Patriotism: learner enhances loyalty when obeying sounds that alert on danger for appropriate response"
        ],
        "pcis": [
            "Life Skills: learner uses common courteous words when engaging with peers to role-play sounds that alert on danger"
        ],
        "linksToOtherSubjects": [
            "Sounds in the immediate environment draw concepts in Creative Activities"
        ]
    }
}

# Strand 3.0 Resources in Our Environment data
strand_3_updates = {
    "3.1": {
        "numberOfLessons": 14,
        "coreCompetencies": [
            "Learning to Learn: learner models water sources in the class learning space or corner using locally available materials",
            "Creativity and Imagination: learner develops originality skills when drawing and colouring different sources of water"
        ],
        "values": [
            "Unity: learner collaboratively models sources of water in class learning spaces or corners using locally available materials"
        ],
        "pcis": [
            "Health promotion issues: learner drinks clean water and role-plays using water sparingly for personal wellbeing"
        ],
        "linksToOtherSubjects": [
            "Making a poster on water conservation at home and school draws knowledge from writing skills in English Language Activities"
        ]
    },
    "3.2": {
        "numberOfLessons": 10,
        "coreCompetencies": [
            "Learning to Learn: learner develops concepts of plants when going for a nature walk to explore different parts of plants in the immediate environment"
        ],
        "values": [
            "Patriotism: learner enriches citizenship when showing love to the country by watering plants found in the immediate environment"
        ],
        "pcis": [
            "Environmental education and climate change: learner observes safety and responsibility when collecting young plants in the locality"
        ],
        "linksToOtherSubjects": [
            "Plants relate to the concept of creation in Religious Activities"
        ]
    },
    "3.3": {
        "numberOfLessons": 10,
        "coreCompetencies": [
            "Learning to Learn: learner develops exploration skills when taking a nature walk to observe and write the names of domestic animals",
            "Communication and Collaboration: learner writes clearly and correctly when gathering more information on care for domestic animals from parents or guardians"
        ],
        "values": [
            "Love: learner enhances compassion when portraying a caring attitude during the watering and feeding of some domestic animals in the immediate environment",
            "Unity: learner enriches cooperation when displaying team spirit during nature walks to observe domestic animals"
        ],
        "pcis": [
            "Health promotion issues: learner develops hand washing skills using clean running water after feeding and watering animals",
            "Life Skills: learner develops empathy and takes precautions while feeding/watering domestic animals"
        ],
        "linksToOtherSubjects": [
            "Listening to stories on animals for enjoyment relates to active listening in English Language Activities"
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
        # Update Strand 2.0
        if strand['strandId'] == '2.0':
            print(f"Found Strand: {strand['strandId']} - {strand['strandTitle']}")
            
            for substrand in strand['subStrands']:
                sub_id = substrand['subStrandId']
                if sub_id in strand_2_updates:
                    update_data = strand_2_updates[sub_id]
                    
                    substrand['numberOfLessons'] = update_data['numberOfLessons']
                    substrand['coreCompetencies'] = update_data['coreCompetencies']
                    substrand['values'] = update_data['values']
                    substrand['pcis'] = update_data['pcis']
                    substrand['linksToOtherSubjects'] = update_data['linksToOtherSubjects']
                    
                    print(f"  Updated: {sub_id} - {substrand['subStrandTitle']} ({update_data['numberOfLessons']} lessons)")
                    updated_count += 1
                    total_lessons += update_data['numberOfLessons']
        
        # Update Strand 3.0
        if strand['strandId'] == '3.0':
            print(f"Found Strand: {strand['strandId']} - {strand['strandTitle']}")
            
            for substrand in strand['subStrands']:
                sub_id = substrand['subStrandId']
                if sub_id in strand_3_updates:
                    update_data = strand_3_updates[sub_id]
                    
                    substrand['numberOfLessons'] = update_data['numberOfLessons']
                    substrand['coreCompetencies'] = update_data['coreCompetencies']
                    substrand['values'] = update_data['values']
                    substrand['pcis'] = update_data['pcis']
                    substrand['linksToOtherSubjects'] = update_data['linksToOtherSubjects']
                    
                    print(f"  Updated: {sub_id} - {substrand['subStrandTitle']} ({update_data['numberOfLessons']} lessons)")
                    updated_count += 1
                    total_lessons += update_data['numberOfLessons']
    
    # Write updated JSON
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Batch 2 Complete!")
    print(f"   Updated: {updated_count} sub-strands")
    print(f"   Total lessons (Strands 2.0 + 3.0): {total_lessons}")

if __name__ == "__main__":
    update_json()
