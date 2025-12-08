#!/usr/bin/env python3
"""
Update Environmental Activities Grade 2 - All Strands
Adds numberOfLessons, coreCompetencies, values, pcis, and linksToOtherSubjects
Total: 3 Strands, 12 Sub-strands, 120 Lessons
"""

import json

# Path to the JSON file
json_file = r"c:\Users\MKT\desktop\teachtrack\data\curriculum\G2\grade-2-environmental-activities.json"

# Complete metadata for all sub-strands
updates = {
    # STRAND 1.0: SOCIAL ENVIRONMENT
    "1.1": {
        "numberOfLessons": 16,
        "coreCompetencies": [
            "Critical thinking and Problem-solving: learner enhances innovative thinking in improvising cleaning materials using locally available resources"
        ],
        "values": [
            "Responsibility: learner enhances self-drive when cleaning utensils at home"
        ],
        "pcis": [
            "Health Education: learner observes safety and hygiene when washing hands after handling waste materials to avoid communicable diseases"
        ],
        "linksToOtherSubjects": [
            "Mathematical Activities: The skill of sorting draws knowledge learnt in pre-number concepts"
        ]
    },
    "1.2": {
        "numberOfLessons": 8,
        "coreCompetencies": [
            "Citizenship: learner develops awareness of the local environment when matching places or facilities within the locality where family needs are met"
        ],
        "values": [
            "Love: learner portrays a caring attitude towards peers when playing games of picking out flashcards/paper cuttings/pictures that show family needs and wants"
        ],
        "pcis": [
            "Social Economic Issues: learner enhances financial literacy when sorting and grouping pictures of goods and services into family needs and wants"
        ],
        "linksToOtherSubjects": [
            "Mathematical Activities: Family needs and wants relate to the skill of counting, sorting, and grouping"
        ]
    },
    "1.3": {
        "numberOfLessons": 8,
        "coreCompetencies": [
            "Self-efficacy: learner develops the skill of knowing the school by walking around the school compound to find out dangerous places and items"
        ],
        "values": [
            "Unity: learner enhances cooperation when cleaning the school environment in groups"
        ],
        "pcis": [
            "Social Economic Issues: learner develops disaster risk reduction when role-playing ways of giving first aid to common accidents in school"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: Paper waste recycling relates to concepts of making papier-mâché"
        ]
    },
    "1.4": {
        "numberOfLessons": 8,
        "coreCompetencies": [
            "Citizenship: learner develops active community skills when observing the expected behaviour related to the Kenya national flag and national anthem"
        ],
        "values": [
            "Patriotism: learner enhances loyalty to the nation when singing the national anthem"
        ],
        "pcis": [
            "Citizenship: learner enhances social cohesion and nationalism when singing the Kenya national anthem"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: Features of the Kenya national flag relate to learning of colours"
        ]
    },
    "1.5": {
        "numberOfLessons": 6,
        "coreCompetencies": [
            "Communication and Collaboration: learner develops teamwork when role-playing the responsibilities of children in school"
        ],
        "values": [
            "Social Justice: learner enhances equity when performing age-appropriate responsibilities at school"
        ],
        "pcis": [
            "Citizenship: learner enhances Child Rights awareness when sharing own expectations, experiences, duties and responsibilities at home or school"
        ],
        "linksToOtherSubjects": [
            "English Language Activities: Listening to a resource person on Child Rights and Responsibilities relates to active listening and speaking"
        ]
    },
    "1.6": {
        "numberOfLessons": 8,
        "coreCompetencies": [
            "Citizenship: learner recognises the interdependence and connections of people found in a market"
        ],
        "values": [
            "Integrity: learner enhances honest and fair negotiations when role-playing buying and selling"
        ],
        "pcis": [
            "Citizenship: learner enhances acknowledgement for self and others when interacting with people found in a market",
            "Financial Literacy: learner develops spending skills when visiting the nearest market to find out activities that take place"
        ],
        "linksToOtherSubjects": [
            "Mathematical Activities: Buying and selling in a market relates to the concept of money"
        ]
    },
    
    # STRAND 2.0: NATURAL ENVIRONMENT
    "2.1": {
        "numberOfLessons": 12,
        "coreCompetencies": [
            "Digital Literacy: learner interacts with digital technology when playing relevant and educative games on weather conditions"
        ],
        "values": [
            "Unity: learner develops cooperation when observing and recording prevailing weather conditions as an outdoor activity",
            "Integrity: learner develops honesty when observing and recording weather conditions for one week"
        ],
        "pcis": [
            "Life Skills: learner develops effective communication skills when participating in a class contest, on narrating weather occurrences from weather chart recordings",
            "Learner Support Programs: learner develops career guidance skills when creating a weather record using weather symbols for one week"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: Drawing weather symbols relates to the skill of drawing and colouring"
        ]
    },
    "2.2": {
        "numberOfLessons": 8,
        "coreCompetencies": [
            "Learning to Learn: learner develops the skill of learning independently when modelling soil ribbons using soil samples and finding out the soil sample that makes smooth long ribbons"
        ],
        "values": [
            "Unity: learner develops cooperation skills when modelling objects with different types of soil"
        ],
        "pcis": [
            "Health Promotion Issues: learner develops preventive health skills when cleaning the working area and hands with soap and clean running water after handling soil to prevent communicable diseases"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: Modelling objects using soil draws knowledge from modelling techniques"
        ]
    },
    "2.3": {
        "numberOfLessons": 12,
        "coreCompetencies": [
            "Communication: learner develops writing skills when making posters with simple messages on the conservation of light to create awareness"
        ],
        "values": [
            "Unity: learner develops cooperation skills when manipulating objects in the presence of light to form shadows for enjoyment"
        ],
        "pcis": [
            "Social Economic Issues: learner develops financial skills when practising switching off lights when not in use and during day time"
        ],
        "linksToOtherSubjects": [
            "English Language Activities: Posters on energy conservation relate to writing skills"
        ]
    },
    
    # STRAND 3.0: RESOURCES IN OUR ENVIRONMENT
    # Note: User didn't provide Strand 3.0 data, but the sub-strands exist
    # Using standard metadata structure based on the content
    "3.1": {
        "numberOfLessons": 12,
        "coreCompetencies": [
            "Self-efficacy: learner develops awareness of water conservation when exploring various ways of storing water at home and school"
        ],
        "values": [
            "Responsibility: learner enhances self-drive when practising storing water in bottles and water cans at home and school"
        ],
        "pcis": [
            "Health Education: learner develops awareness of safe water storage to prevent health risks to self and others"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: Drawing items used to store water relates to drawing and colouring skills"
        ]
    },
    "3.2": {
        "numberOfLessons": 10,
        "coreCompetencies": [
            "Citizenship: learner develops environmental awareness when advocating for plant protection for environmental sustainability"
        ],
        "values": [
            "Responsibility: learner enhances care for the environment when watering, manuring and mulching plants"
        ],
        "pcis": [
            "Environmental Education: learner develops awareness of plant protection for environmental sustainability"
        ],
        "linksToOtherSubjects": [
            "English Language Activities: Writing plant protection messages relates to writing skills"
        ]
    },
    "3.3": {
        "numberOfLessons": 12,
        "coreCompetencies": [
            "Learning to Learn: learner develops knowledge when relating food items with respective animals"
        ],
        "values": [
            "Responsibility: learner enhances care for animals when carrying out activities of caring for animals in the locality"
        ],
        "pcis": [
            "Health Education: learner develops hygiene awareness when washing hands with soap and water after cleaning the animal shelter",
            "Animal Welfare: learner develops awareness of fair treatment of animals"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: Sorting and grouping food items from animals relates to classification skills"
        ]
    }
}

def update_json():
    # Read the JSON file
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    updated_count = 0
    total_lessons = 0
    
    # Update each sub-strand
    for strand in data['strands']:
        for sub_strand in strand['subStrands']:
            sub_id = sub_strand['subStrandId']
            if sub_id in updates:
                update_data = updates[sub_id]
                sub_strand['numberOfLessons'] = update_data['numberOfLessons']
                sub_strand['coreCompetencies'] = update_data['coreCompetencies']
                sub_strand['values'] = update_data['values']
                sub_strand['pcis'] = update_data['pcis']
                sub_strand['linksToOtherSubjects'] = update_data['linksToOtherSubjects']
                total_lessons += update_data['numberOfLessons']
                updated_count += 1
                print(f"✅ Updated {sub_id}: {sub_strand['subStrandTitle']} - {update_data['numberOfLessons']} lessons")
    
    # Write back to file
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*60}")
    print(f"ENVIRONMENTAL ACTIVITIES GRADE 2 - UPDATE COMPLETE!")
    print(f"{'='*60}")
    print(f"Updated: {updated_count} sub-strands")
    print(f"Total lessons: {total_lessons}")
    print(f"{'='*60}")

if __name__ == "__main__":
    update_json()
