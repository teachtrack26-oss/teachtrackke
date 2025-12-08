#!/usr/bin/env python3
"""
Batch 2: Update CRE Grade 2 - Strands 3.0 Early Life of Jesus, 4.0 Christian Values, 5.0 The Church
"""
import json

# Path to the JSON file
json_path = r"C:\Users\MKT\desktop\teachtrack\data\curriculum\G2\grade-2-cre.json"

# Strand 3.0 The Early Life of Jesus Christ
strand_3_updates = {
    "3.1": {
        "numberOfLessons": 5,
        "coreCompetencies": [
            "Communication and Collaboration: the skill of teamwork and recognising the ideas of others is portrayed as learners work in groups",
            "Learning to Learn: the skills of self-discipline and motivation to learn is shown as learners role-play and sing songs related to the birth of Jesus Christ"
        ],
        "values": [
            "Patriotism: devotion is enhanced as they role-play the dedication of baby Jesus"
        ],
        "pcis": [
            "Animal welfare education: introduction to animal welfare; learners draw and colour a dove and a pigeon",
            "Patriotism: devotion is enhanced as they role-play the dedication of baby Jesus"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: are reinforced through singing and role-play",
            "Language Activities: speaking skills are nurtured as learners read the Bible"
        ]
    },
    "3.2": {
        "numberOfLessons": 4,
        "coreCompetencies": [
            "Learning to Learn: the skill of self-discipline is developed as learners are guided to avoid receiving gifts from strangers"
        ],
        "values": [
            "Integrity: is developed as learners are guided to avoid confidentiality and security breaches by not accepting gifts from strangers"
        ],
        "pcis": [
            "Safety and Security: is enhanced as learners ensure safety inside and outside the school environment by not accepting gifts from strangers"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: learners draw and colour gifts given to baby Jesus"
        ]
    },
    "3.3": {
        "numberOfLessons": 4,
        "coreCompetencies": [
            "Imagination and Creativity: the skill of developing new ideas is enhanced as learners draw and colour the boat",
            "Communication and Collaboration: the skill of reasoning is enhanced as learners in groups say what they do when faced with difficulties"
        ],
        "values": [
            "Unity: is exhibited as learners in groups sing a song about calming the storm"
        ],
        "pcis": [
            "Environmental Awareness: is enhanced as they learn about calming the storm"
        ],
        "linksToOtherSubjects": [
            "Environmental Activities: calming the storm (weather)",
            "Creative Activities: learners sing, draw and colour a boat"
        ]
    },
    "3.4": {
        "numberOfLessons": 4,
        "coreCompetencies": [
            "Digital Literacy: the skill of observing safety precautions when using digital gadgets is portrayed as learners watch a video clip on the miraculous catch of fish",
            "Imagination and Creativity: the skill of generating ideas is enhanced as learners draw and colour the fish"
        ],
        "values": [
            "Unity: is nurtured as learners picture-read in turns Luke 5:3-9"
        ],
        "pcis": [
            "Social Cohesion: is enhanced as learners sing using different languages"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: learners sing and draw a fish"
        ]
    },
    "3.5": {
        "numberOfLessons": 4,
        "coreCompetencies": [
            "Communication and Collaboration: the skill of communication and self-expression is exhibited as learners picture-read Matthew 12:9-11,13",
            "Imagination and Creativity: the skill of originality is expressed as learners role-play how to care for those abled differently"
        ],
        "values": [
            "Love: is nurtured as learners role-play caring for those abled differently"
        ],
        "pcis": [
            "Non-communicable diseases: learners learn about paralysis and that it is non-communicable"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: creative skills are nurtured as learners role-play",
            "Language Activities: speaking skills are applied as learners write Matthew 12:13 on flashcards and recite it aloud in class"
        ]
    },
    "3.6": {
        "numberOfLessons": 3,
        "coreCompetencies": [
            "Communication: learners actively listen and communicate effectively as they work in groups"
        ],
        "values": [
            "Love: is nurtured as they learn about the selfless love of Christ"
        ],
        "pcis": [
            "Social cohesion: is enhanced as learners perform different activities in groups"
        ],
        "linksToOtherSubjects": [
            "Language Activities: learners recite Bible verses",
            "Creative Activities: learners draw an empty cross"
        ]
    }
}

# Strand 4.0 Christian Values
strand_4_updates = {
    "4.1": {
        "numberOfLessons": 3,
        "coreCompetencies": [
            "Collaboration: the skill of teamwork is portrayed as learners role-play sharing in class",
            "Learning to Learn: the skill of developing relations is enhanced as learners carry out activities with peers"
        ],
        "values": [
            "Unity: is portrayed as learners work in pairs and talk about instances they shared items with those in need"
        ],
        "pcis": [
            "Social Cohesion: the importance of living together is exhibited as learners role-play sharing items in class"
        ],
        "linksToOtherSubjects": [
            "Environmental Activities: learners list various items that can be shared at school"
        ]
    },
    "4.2": {
        "numberOfLessons": 3,
        "coreCompetencies": [
            "Citizenship: the skill of information and communication is enhanced as learners tell why they should obey teachers and the children's government"
        ],
        "values": [
            "Patriotism: is enhanced as learners obey teachers and the children's government"
        ],
        "pcis": [
            "Peace Education: is nurtured as learners obey rules and regulations"
        ],
        "linksToOtherSubjects": [
            "Environmental Education: learners share experiences of how they obey their teachers and the importance of obedience in day-to-day life"
        ]
    },
    "4.3": {
        "numberOfLessons": 3,
        "coreCompetencies": [
            "Learning to Learn: the skill of learning independently is nurtured as learners tell why they should complete their homework on time",
            "Self-efficacy: is nurtured as learners avoid taking other people's property without permission"
        ],
        "values": [
            "Integrity: learners display honesty by taking lost and found items to the teacher"
        ],
        "pcis": [
            "Social cohesion: is nurtured as they learn ways of showing integrity by telling the truth always"
        ],
        "linksToOtherSubjects": [
            "Environmental Activities: learners practise honesty by not taking other people's items"
        ]
    },
    "4.4": {
        "numberOfLessons": 3,
        "coreCompetencies": [
            "Imagination and Creativity: the skill of originality is enhanced as learners role-play and compose a poem"
        ],
        "values": [
            "Social Justice: is nurtured as learners live harmoniously with others"
        ],
        "pcis": [
            "Social Cohesion: is enhanced as they learn the importance of thanking those who show them kindness"
        ],
        "linksToOtherSubjects": [
            "Language Activities: speaking skills are applied as learners use polite language (etiquette) like 'thank you'",
            "Creative Activities: learners role-play and compose poems"
        ]
    },
    "4.5": {
        "numberOfLessons": 4,
        "coreCompetencies": [
            "Learning to Learn: the skill of developing healthy relationships is nurtured as learners forgive each other",
            "Digital Literacy: the skill of observing safety precautions is enhanced as learners interact with digital devices"
        ],
        "values": [
            "Love: learners learn to forgive each other just as the prodigal son was forgiven by his father"
        ],
        "pcis": [
            "Safety and Security: learners exercise precaution in an environment where they are interacting with digital devices"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: learners role-play the story of the prodigal son",
            "Mathematical Activities: the skill of multiplication is applied as they learn to forgive 70 x 7 times"
        ]
    },
    "4.6": {
        "numberOfLessons": 4,
        "coreCompetencies": [
            "Self-efficacy: the skill of using resources responsibly is exhibited as learners take care of their items",
            "Learning to Learn: the skill of self-reflection is nurtured as learners say why they should not forget school items at home"
        ],
        "values": [
            "Responsibility: is nurtured as learners care for their own property"
        ],
        "pcis": [
            "Social cohesion: learners show integrity by being responsible as they take care of their personal property"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: learners sing songs, draw, and colour items"
        ]
    },
    "4.7": {
        "numberOfLessons": 3,
        "coreCompetencies": [
            "Learning to Learn: is enhanced as learners exercise self-discipline and help their parents with simple chores at home",
            "Communication and Collaboration: the skill of speaking clearly and effectively is nurtured as learners say how they help their parents at home"
        ],
        "values": [
            "Patriotism: learners assist with chores at home, in class and keep the compound clean"
        ],
        "pcis": [
            "Environmental Awareness: is portrayed as learners show responsibility by keeping the compound clean"
        ],
        "linksToOtherSubjects": [
            "Environmental Activities: learners keep the compound clean",
            "Language Activities: writing skills are applied as learners write a poem about work"
        ]
    }
}

# Strand 5.0 The Church
strand_5_updates = {
    "5.1": {
        "numberOfLessons": 4,
        "coreCompetencies": [
            "Communication and Collaboration: the skill of speaking clearly and effectively is exhibited as learners recite the Lord's prayer"
        ],
        "values": [
            "Social Justice: is enhanced as they learn about the value of sharing from the story of a friend at midnight"
        ],
        "pcis": [
            "Peace Education: good neighbourhood is nurtured as learners role-play the story of a friend at midnight"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: learners sing, dance, and role play",
            "Mathematical Activities: learners count and record the number of times they recite the Lord's Prayer"
        ]
    },
    "5.2": {
        "numberOfLessons": 4,
        "coreCompetencies": [
            "Communication and Collaboration: the skill of communication and self-expression is portrayed as learners mention examples of good promises they have been given by their parents"
        ],
        "values": [
            "Unity: is nurtured as learners work in groups to write the work of the Holy Spirit on flashcards"
        ],
        "pcis": [
            "Social Cohesion: is developed as they learn about the work of the Holy Spirit in uniting Christians"
        ],
        "linksToOtherSubjects": [
            "Language Activities: learners learn new words and express themselves confidently",
            "Creative Activities: learners sing a song about the work of the Holy Spirit"
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
        "4.0": strand_4_updates,
        "5.0": strand_5_updates
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
    print(f"   Total lessons (Strands 3.0 + 4.0 + 5.0): {total_lessons}")

if __name__ == "__main__":
    update_json()
