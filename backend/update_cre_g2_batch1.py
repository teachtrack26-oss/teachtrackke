#!/usr/bin/env python3
"""
Batch 1: Update CRE Grade 2 - Strands 1.0 Creation & 2.0 The Holy Bible
"""
import json

# Path to the JSON file
json_path = r"C:\Users\MKT\desktop\teachtrack\data\curriculum\G2\grade-2-cre.json"

# Strand 1.0 Creation
strand_1_updates = {
    "1.1": {
        "numberOfLessons": 4,
        "coreCompetencies": [
            "Self-efficacy: the skill of knowing self is exhibited as they mention what they like about themselves",
            "Imagination and Creativity: the skill of exploration is enhanced as learners play games that give an advantage to their uniqueness"
        ],
        "values": [
            "Responsibility: hard work is portrayed as learners engage in assigned roles and duties"
        ],
        "pcis": [
            "Gender Awareness: knowing self and appreciating their gender either as a boy or girl"
        ],
        "linksToOtherSubjects": [
            "Language Activities: they learn new words",
            "Creative Activities: learners role-play different chores they do at home"
        ]
    },
    "1.2": {
        "numberOfLessons": 4,
        "coreCompetencies": [
            "Learning to Learn: the skill of working independently is enhanced as learners draw and colour members of their extended family"
        ],
        "values": [
            "Unity: is demonstrated as the learners share experiences of how they relate with members of the extended family"
        ],
        "pcis": [
            "Health education: the learner lists items that should not be shared at home and gives reasons"
        ],
        "linksToOtherSubjects": [
            "Health and Nutrition: the learner lists items that should not be shared at home and gives reasons",
            "Language Activities: speaking skills are enhanced as they learn new vocabulary and express themselves confidently"
        ]
    },
    "1.3": {
        "numberOfLessons": 5,
        "coreCompetencies": [
            "Learning to Learn: the skill of speaking engagingly is exhibited as learners tell what they see during the day and at night"
        ],
        "values": [
            "Responsibility: is portrayed as learners write Genesis 1:16 on flashcards and display it in class"
        ],
        "pcis": [
            "Environmental Awareness: learners observe the sky and tell what they see during the day and at night"
        ],
        "linksToOtherSubjects": [
            "Environmental Activities: learners observe the sky and relate to God's creation"
        ]
    }
}

# Strand 2.0 The Holy Bible
strand_2_updates = {
    "2.1": {
        "numberOfLessons": 3,
        "coreCompetencies": [
            "Communication and Collaboration: the skill of teamwork is demonstrated as learners list the importance of reading the Bible"
        ],
        "values": [
            "Respect: is demonstrated as learners perform tasks in groups and respect each other's opinions"
        ],
        "pcis": [
            "Social Cohesion: is enhanced as learners in groups sing a song about the Bible"
        ],
        "linksToOtherSubjects": [
            "Mathematical Activities: learners record the number of times they read the Bible",
            "Creative Activities: learners sing the song 'My Bible and I'"
        ]
    },
    "2.2": {
        "numberOfLessons": 4,
        "coreCompetencies": [
            "Learning to Learn: the skill of learning independently is developed as learners use flashcards to write the first two books in the Old Testament",
            "Communication and Collaboration: the skill of teamwork is enhanced as learners in pairs play the game on 'number of books' in the Old Testament"
        ],
        "values": [
            "Patriotism: is exhibited as learners compose songs using different languages"
        ],
        "pcis": [
            "Social Cohesion: our diversity is enhanced as learners compose songs in different languages"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: learners compose songs and play a game on the number of books in the Old Testament",
            "Language Activities: learners read the Bible and express ideas fluently"
        ]
    },
    "2.3": {
        "numberOfLessons": 5,
        "coreCompetencies": [
            "Communication and Collaboration: the skill of teamwork is displayed as learners role-play and sing songs",
            "Imagination and Creativity: the skill of exploration is exhibited as learners sing about the call of Samuel"
        ],
        "values": [
            "Responsibility: is enhanced as learners offer leadership and guidance to others during classroom activities"
        ],
        "pcis": [
            "Social Cohesion: guiding values in life are developed as learners read the story on the call of Samuel and the virtues he exemplified at a young age"
        ],
        "linksToOtherSubjects": [
            "Language Activities: learners read the Bible and communicate fluently and confidently",
            "Creative Activities: learners sing and role-play the call of Samuel",
            "Mathematical Activities: learners mention the number of times Samuel was called by God"
        ]
    },
    "2.4": {
        "numberOfLessons": 5,
        "coreCompetencies": [
            "Communication and Collaboration: learners speak clearly and effectively as they read the story of Daniel in the den of lions"
        ],
        "values": [
            "Responsibility: is enhanced as learners share instances they pray at home, school, or church"
        ],
        "pcis": [
            "Child rights and responsibility: is nurtured as learners share experiences of when they said No! to things that do not please God"
        ],
        "linksToOtherSubjects": [
            "Mathematical Activities: learners record the number of times Daniel prayed",
            "Language Activities: learners read the Bible and write a simple prayer to God for His protection and guidance"
        ]
    },
    "2.5": {
        "numberOfLessons": 5,
        "coreCompetencies": [
            "Learning to learn: the skill of coming up with new ideas is nurtured as learners draw and colour bread"
        ],
        "values": [
            "Love: compassion is nurtured as learners mention lessons learnt from the miracle"
        ],
        "pcis": [
            "Health Education: nutrition and hygiene is reinforced as learners watch a video clip on the multiplication of flour",
            "Social Cohesion: the importance of living together is enhanced as learners mention in groups two lessons learnt from the miracle"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: learners sing, draw and colour the bread"
        ]
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
        "2.0": strand_2_updates
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
                    
                    print(f"  ✅ Updated: {sub_id} - {substrand['subStrandTitle']} ({update_data['numberOfLessons']} lessons)")
                    updated_count += 1
                    total_lessons += update_data['numberOfLessons']
    
    # Write updated JSON
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Batch 1 Complete!")
    print(f"   Updated: {updated_count} sub-strands")
    print(f"   Total lessons (Strands 1.0 + 2.0): {total_lessons}")

if __name__ == "__main__":
    update_json()
