#!/usr/bin/env python3
"""
Batch 1: Update CRE Grade 1 - Strands 1.0 Creation, 2.0 The Holy Bible, 3.0 Early Life of Jesus
"""
import json

# Path to the JSON file
json_path = r"C:\Users\MKT\desktop\teachtrack\data\curriculum\G1\grade-1-cre.json"

# Strand 1.0 Creation
strand_1_updates = {
    "1.1": {
        "numberOfLessons": 5,
        "coreCompetencies": [
            "Self-efficacy: learners identify who they are as they engage in activities such as mentioning their names and singing songs related to their names",
            "Communication: learners can speak clearly and effectively as they read the Bible verses and memorise the scriptures"
        ],
        "values": [
            "Love: is portrayed as learners sing songs and perform activities such as singing together"
        ],
        "pcis": [
            "Gender issues: learners say their gender as guided by the Bible and in accordance with the Christian faith"
        ],
        "linksToOtherSubjects": [
            "Language Activities: they learn new vocabulary",
            "Creative Activities: creative skills are enhanced as they sing and draw"
        ]
    },
    "1.2": {
        "numberOfLessons": 5,
        "coreCompetencies": [
            "Communication: the skill of speaking clearly and effectively is enhanced as learners lead prayers at home",
            "Learning to Learn: learners work on their own in assigned tasks such as listing the number of times they lead prayers at home"
        ],
        "values": [
            "Unity: is enhanced as learners pray with family members"
        ],
        "pcis": [
            "Social cohesion: is portrayed as learners share items with family members and pray together"
        ],
        "linksToOtherSubjects": [
            "Mathematical Activities: learners list the number of times they pray",
            "Language Activities: reading skills are applied as learners read the Bible"
        ]
    },
    "1.3": {
        "numberOfLessons": 5,
        "coreCompetencies": [
            "Learning to Learn: learners recreate learning experiences outside the class as they explore and discover more about plants and animals in their surroundings",
            "Imagination and Creativity: learners come up with new and unique ideas by modelling and drawing animals and plants"
        ],
        "values": [
            "Responsibility: learners participate in keeping the home environment clean"
        ],
        "pcis": [
            "Environmental Awareness: learners identify plants and animals in the environment"
        ],
        "linksToOtherSubjects": [
            "Environmental Activities: learners participate in keeping the home environment clean"
        ]
    }
}

# Strand 2.0 The Holy Bible
strand_2_updates = {
    "2.1": {
        "numberOfLessons": 4,
        "coreCompetencies": [
            "Digital Literacy: learners behave safely and ethically as they use digital devices"
        ],
        "values": [
            "Responsibility: learners handle the Bible with care and respect"
        ],
        "pcis": [
            "Spiritual Awareness: learners mention the first two divisions of the Bible and name two Bible books"
        ],
        "linksToOtherSubjects": [
            "Mathematical Activities: skills are reinforced through the aspect of division and the number of books in the Holy Bible",
            "Creative Activities: creative skills are nurtured as learners role-play handling the Holy Bible with care and respect"
        ]
    },
    "2.2": {
        "numberOfLessons": 8,
        "coreCompetencies": [
            "Digital Literacy: the skill of interacting with digital technology is enhanced as learners watch a video about Joseph and his brothers",
            "Imagination and Creativity: the skill of imagining and coming up with original ideas is exhibited as learners draw and colour a coat"
        ],
        "values": [
            "Love: is nurtured as learners share experiences of how they should treat their brothers and sisters"
        ],
        "pcis": [
            "Social Cohesion: is nurtured as learners list values needed to live well with others"
        ],
        "linksToOtherSubjects": [
            "Language Activities: learners picture-read Bible texts",
            "Creative Activities: learners draw, colour and role-play the story of Joseph"
        ]
    },
    "2.3": {
        "numberOfLessons": 8,
        "coreCompetencies": [
            "Imagination and Creativity: the skill of coming up with new ideas is enhanced as learners role-play the Bible story",
            "Communication: the skills of listening and speaking are demonstrated as learners in groups read the Bible text and retell the story"
        ],
        "values": [
            "Love: is portrayed as learners take turns to air their views and respect each other's opinions"
        ],
        "pcis": [
            "Social Cohesion: is nurtured as learners share ideas and work in groups or pairs"
        ],
        "linksToOtherSubjects": [
            "Language Activities: they learn new words such as 'a chariot'",
            "Creative Activities: learners sing about Elijah and the Chariot of Fire"
        ]
    }
}

# Strand 3.0 Early Life of Jesus (we'll need data for this - using placeholders from patterns)
strand_3_updates = {
    "3.1": {
        "numberOfLessons": 8,
        "coreCompetencies": [],
        "values": [],
        "pcis": [],
        "linksToOtherSubjects": []
    },
    "3.2": {
        "numberOfLessons": 4,
        "coreCompetencies": [],
        "values": [],
        "pcis": [],
        "linksToOtherSubjects": []
    },
    "3.3": {
        "numberOfLessons": 5,
        "coreCompetencies": [],
        "values": [],
        "pcis": [],
        "linksToOtherSubjects": []
    },
    "3.4": {
        "numberOfLessons": 8,
        "coreCompetencies": [],
        "values": [],
        "pcis": [],
        "linksToOtherSubjects": []
    },
    "3.5": {
        "numberOfLessons": 6,
        "coreCompetencies": [],
        "values": [],
        "pcis": [],
        "linksToOtherSubjects": []
    }
}

def update_json():
    # Read existing JSON
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    updated_count = 0
    total_lessons = 0
    
    all_updates = {
        "1.0": strand_1_updates,
        "2.0": strand_2_updates,
        "3.0": strand_3_updates
    }
    
    for strand in data['strands']:
        strand_id = strand['strandId']
        if strand_id in all_updates:
            print(f"Found Strand: {strand_id} - {strand['strandTitle']}")
            
            for substrand in strand['subStrands']:
                sub_id = substrand['subStrandId']
                if sub_id in all_updates[strand_id]:
                    update_data = all_updates[strand_id][sub_id]
                    
                    substrand['numberOfLessons'] = update_data['numberOfLessons']
                    substrand['coreCompetencies'] = update_data['coreCompetencies']
                    substrand['values'] = update_data['values']
                    substrand['pcis'] = update_data['pcis']
                    substrand['linksToOtherSubjects'] = update_data['linksToOtherSubjects']
                    
                    status = "✅" if update_data['coreCompetencies'] else "⚠️ (lessons only)"
                    print(f"  {status} Updated: {sub_id} - {substrand['subStrandTitle']} ({update_data['numberOfLessons']} lessons)")
                    updated_count += 1
                    total_lessons += update_data['numberOfLessons']
    
    # Write updated JSON
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Batch 1 Complete!")
    print(f"   Updated: {updated_count} sub-strands")
    print(f"   Total lessons: {total_lessons}")
    print(f"\n⚠️  Note: Strand 3.0 (Early Life of Jesus) needs CC/Values/PCIs/Links data")

if __name__ == "__main__":
    update_json()
