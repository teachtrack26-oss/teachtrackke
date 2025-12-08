#!/usr/bin/env python3
"""
Batch 2: Update CRE Grade 1 - Strand 3.0 (Early Life of Jesus) metadata + Strand 4.0 (Christian Values)
"""
import json

# Path to the JSON file
json_path = r"C:\Users\MKT\desktop\teachtrack\data\curriculum\G1\grade-1-cre.json"

# Strand 3.0 The Early Life of Jesus Christ - Complete metadata
strand_3_updates = {
    "3.1": {
        "numberOfLessons": 8,
        "coreCompetencies": [
            "Communication: is portrayed as learners listen actively and picture-read the birth of Jesus Christ",
            "Imagination and Creativity: is demonstrated as learners come up with creative ways and role-play the birth of Jesus Christ",
            "Digital Literacy: is enhanced as learners interact with digital technology and watch a video clip of angels worshipping baby Jesus"
        ],
        "values": [
            "Unity: is exhibited as learners work together in groups"
        ],
        "pcis": [
            "Social cohesion: is portrayed as learners in groups role play, sing, listen to, and dance to a recorded carol 'We wish you a Merry Christmas'"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: creative skills are reinforced as learners sing and role-play the birth of Jesus Christ",
            "Language Activities: learner's picture-read the Bible text and retell the story"
        ]
    },
    "3.2": {
        "numberOfLessons": 4,
        "coreCompetencies": [
            "Communication and Collaboration: the skill of speaking clearly and effectively is enhanced as learners picture read the Bible in turns"
        ],
        "values": [
            "Peace: learners tell how Jesus obeyed His parents and share experiences of how they obey their parents at home"
        ],
        "pcis": [
            "Peace Education: is enhanced as learners share experiences of how they obey their parents at home"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: learners draw and colour the church"
        ]
    },
    "3.3": {
        "numberOfLessons": 5,
        "coreCompetencies": [
            "Digital Literacy: the skill of digital citizenship is demonstrated as learners act safely and responsibly in digital environments"
        ],
        "values": [
            "Respect: is nurtured as learners take turns to picture-read Matthew 3:13-15"
        ],
        "pcis": [
            "Social Cohesion: is portrayed as learners sing songs in different languages"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: learners draw, colour and sing baptismal songs familiar to them"
        ]
    },
    "3.4": {
        "numberOfLessons": 8,
        "coreCompetencies": [
            "Imagination and Creativity: the skill of communicating ideas is enhanced as learners draw and colour the six jars of wine",
            "Self-efficacy: the skill of self-expression is demonstrated as learners confidently share experiences of how they depend on God to provide for their needs"
        ],
        "values": [
            "Peace: is exhibited as learners display tolerance and respect for each other as they engage in different activities"
        ],
        "pcis": [
            "Peace Education: is enhanced as learners role-play how they obey their parents and teachers"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: learners sing, draw, colour and role-play",
            "Mathematical Activities: learners draw six jars of water",
            "Language Activities: learners read the Bible text and learn new words"
        ]
    },
    "3.5": {
        "numberOfLessons": 6,
        "coreCompetencies": [
            "Self-efficacy: is enhanced as learners role-play an instance they helped a learner in need"
        ],
        "values": [
            "Love: is portrayed as learners write a 'thank you' note to parents and those who help them in their daily lives"
        ],
        "pcis": [
            "Problem-solving: is demonstrated as learners share experiences of how they help those in need"
        ],
        "linksToOtherSubjects": [
            "Creative Arts: creative skills are applied as learners role-play the healing of Simon's mother-in-law"
        ]
    }
}

# Strand 4.0 Christian Values
strand_4_updates = {
    "4.1": {
        "numberOfLessons": 4,
        "coreCompetencies": [
            "Learning to Learn: the skill of developing relationships is enhanced as learners work in pairs and groups",
            "Imagination and Creativity: is exhibited as learners role-play the story of the little boy with two fish and five loaves"
        ],
        "values": [
            "Unity: is portrayed as learners work together in groups and take turns to perform different activities"
        ],
        "pcis": [
            "Social cohesion: is portrayed as learners mention items shared at home and school, in pairs"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: learners sing a song on sharing and role-play the story of the little boy with two fish and five loaves"
        ]
    },
    "4.2": {
        "numberOfLessons": 4,
        "coreCompetencies": [
            "Communication and Collaboration: is promoted as learners listen keenly to the song and speak clearly and effectively during Bible reading",
            "Learning to Learn: is enhanced as learners share experiences on the benefits of obeying parents"
        ],
        "values": [
            "Respect: is enhanced as learners appreciate each other's opinions and take turns to share experiences"
        ],
        "pcis": [
            "Social Cohesion: is enhanced as learners sing songs on obedience"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: are reinforced as learners listen and sing songs on obedience",
            "Language Activities: speaking skills are enhanced as learners engage in activities such as mentioning why they should obey their parents"
        ]
    },
    "4.3": {
        "numberOfLessons": 4,
        "coreCompetencies": [
            "Citizenship: the skill of information and communication is enhanced as learners share stories on instances they practised punctuality"
        ],
        "values": [
            "Responsibility: is demonstrated as learners become accountable of their own actions and respect other people's items",
            "Peace: is enhanced as learners avoid hurting others by not taking their items without permission"
        ],
        "pcis": [
            "Social Cohesion: integrity is promoted as learners in groups say why they should speak the truth always"
        ],
        "linksToOtherSubjects": [
            "Language Activities: learners speak clearly and effectively when telling stories on instances took lost and found items to the teacher"
        ]
    },
    "4.4": {
        "numberOfLessons": 4,
        "coreCompetencies": [
            "Imagination and Creativity: the skill of coming up with new ideas is exhibited as they compose poems and role-play how to thank parents",
            "Communication and Collaboration: the skill of speaking clearly and effectively is portrayed as learners say why they should thank their parents"
        ],
        "values": [
            "Respect: is demonstrated as learners take turns to role-play and listen to each other's opinions"
        ],
        "pcis": [
            "Social cohesion: the importance of having guiding values in life is enhanced as learners become thankful to their parents"
        ],
        "linksToOtherSubjects": [
            "Language Activities: learners recite the Bible verses and learn new words"
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
        "3.0": strand_3_updates,
        "4.0": strand_4_updates
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
    
    print(f"\n✅ Batch 2 Complete!")
    print(f"   Updated: {updated_count} sub-strands")
    print(f"   Total lessons (Strands 3.0 + 4.0): {total_lessons}")

if __name__ == "__main__":
    update_json()
