#!/usr/bin/env python3
"""
Update Grade 1 English JSON - Batch 1: Themes 1-5
Correctly maps to existing JSON structure
"""
import json

# Load existing JSON
with open('../data/curriculum/G1/grade-1-english.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Complete curriculum data keyed by strandId and subStrandId
themes_data = {
    "1.0": {  # Greetings
        "1.1": {  # Listening and Speaking
            "numberOfLessons": 4,
            "coreCompetencies": [
                "Communication: The learner's ability to listen keenly and actively is enhanced as they listen to audio texts and identify words with the target sounds in preparation for reading.",
                "Digital Literacy: The learner's interaction with digital technology is enhanced as they listen to audio texts and identify words with the target sounds."
            ],
            "values": ["Unity: This is enhanced as the learner collaborates with peers to recite rhymes and sing songs related to the theme."],
            "pcis": ["Life Skills (Self-awareness): The learner's self-awareness is enhanced as they use vocabulary learnt to talk about greetings."],
            "linksToOtherSubjects": ["The learner is able to apply attentive listening skills to learning concepts in Kiswahili Language Activities."]
        },
        "1.2": {  # Reading: Pre-reading
            "numberOfLessons": 2,
            "coreCompetencies": ["Communication: The learner's ability to listen keenly and actively is enhanced as they identify words with the target sounds in preparation for reading."],
            "values": ["Respect: This is developed as the learner appreciates the efforts of peers to identify the sounds as they take turns."],
            "pcis": ["Life Skills (Self-esteem): The learner's self-esteem is nurtured as they identify sounds correctly in preparation for reading."],
            "linksToOtherSubjects": ["The learner is able to apply knowledge of sounds to learning similar concepts in Kiswahili Language Activities."]
        },
        "1.3": {  # Language Use: Verb 'to be'
            "numberOfLessons": 2,
            "coreCompetencies": ["Communication: The learner's ability to speak clearly and effectively is enhanced as they use naming words correctly."],
            "values": ["Unity: Cooperation is enhanced as the learner collaborates with peers to name objects around them."],
            "pcis": ["Life Skills (Self-esteem): The learner's self-esteem is nurtured as they use naming words correctly."],
            "linksToOtherSubjects": ["The learner applies knowledge acquired in the learning of similar concepts in Kiswahili Language Activities."]
        },
        "1.4": {  # Writing: Pre-writing
            "numberOfLessons": 2,
            "coreCompetencies": [
                "Learning to Learn: The learner's self-discipline is enhanced as they practise correct letter formation.",
                "Creativity and Imagination: The learner's originality of ideas and skills are developed as they trace the patterns of the target letters and form letters correctly."
            ],
            "values": ["Responsibility: This is enhanced as the learner takes up assigned roles and duties when working collaboratively with peers."],
            "pcis": ["Life Skills (Self-esteem): The learner acquires an enhanced level of self-esteem as they trace patterns and form letters correctly."],
            "linksToOtherSubjects": ["The learner is able to apply knowledge of letter formation to formation of similar letters in Kiswahili Language Activities."]
        }
    },
    "2.0": {  # School
        "2.1": {
            "numberOfLessons": 4,
            "coreCompetencies": [
                "Communication: The learner's ability to listen keenly and actively is enhanced as they listen to audio texts and identify words with the target sounds.",
                "Digital Literacy: The learner's interaction with digital technology is enhanced as they listen to audio texts."
            ],
            "values": ["Respect: This is developed as the learner appreciates the efforts of peers during oral activities."],
            "pcis": ["Life Skills (Self-awareness): The learner's self-awareness is nurtured as they use vocabulary learnt to talk about school."],
            "linksToOtherSubjects": ["The learner applies attentive listening skills to learning concepts in other learning areas."]
        },
        "2.2": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Learning to Learn: The learner's ability to learn independently is enhanced as they practise identifying letter-sound correspondence."],
            "values": ["Responsibility: This is developed as the learner takes up assigned roles during group activities."],
            "pcis": ["Life Skills (Self-esteem): The learner's self-esteem is enhanced as they identify sounds correctly in preparation for reading."],
            "linksToOtherSubjects": ["The learner applies knowledge of sounds to learning similar concepts in Kiswahili Language Activities."]
        },
        "2.3": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Communication: The learner's ability to speak clearly is developed as they use personal pronouns correctly."],
            "values": ["Respect: This is enhanced as the learner uses personal pronouns to talk about others respectfully."],
            "pcis": ["Life Skills (Self-esteem): The learner's self-esteem is nurtured as they use personal pronouns correctly."],
            "linksToOtherSubjects": ["The learner applies knowledge of personal pronouns to learning of similar concepts in Kiswahili Language Activities."]
        },
        "2.4": {
            "numberOfLessons": 2,
            "coreCompetencies": [
                "Learning to Learn: The learner's self-discipline is developed as they practise correct letter formation.",
                "Critical Thinking and Problem Solving: The learner is able to differentiate between the capital and small letters."
            ],
            "values": ["Unity: Cooperation is enhanced as the learner works collaboratively with peers during handwriting activities."],
            "pcis": ["Life Skills (Self-esteem): The learner acquires an enhanced level of self-esteem as they form letters correctly."],
            "linksToOtherSubjects": ["The learner applies knowledge of letter formation to similar letters in Kiswahili Language Activities."]
        }
    },
    "3.0": {  # Family
        "3.1": {
            "numberOfLessons": 4,
            "coreCompetencies": [
                "Communication: The learner's ability to listen keenly and actively is enhanced as they listen to audio texts and identify words with the target sounds.",
                "Digital Literacy: The learner's interaction with digital technology is enhanced as they watch video clips and identify words with target sounds."
            ],
            "values": ["Love: This is enhanced as the learner interacts with texts on family and learns to appreciate family members."],
            "pcis": ["Parental Empowerment and Engagement: The learner's awareness of the role of parents is enhanced as they interact with texts on the theme."],
            "linksToOtherSubjects": ["The learner applies pronunciation skills to learning of similar concepts in Kiswahili and Indigenous Language Activities."]
        },
        "3.2": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Learning to Learn: The learner's ability to learn independently is enhanced as they practise matching letters and sounds."],
            "values": ["Unity: Cooperation is developed as the learner collaborates with peers during reading activities."],
            "pcis": ["Life Skills (Self-esteem): The learner's self-esteem is nurtured as they match letters and sounds correctly."],
            "linksToOtherSubjects": ["The learner applies knowledge of letter-sound correspondence to reading words in other learning areas."]
        },
        "3.3": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Communication: The learner's ability to speak clearly and effectively is enhanced as they use articles correctly."],
            "values": ["Respect: This is developed as the learner appreciates the efforts of peers during language activities."],
            "pcis": ["Life Skills (Self-esteem): The learner's self-esteem is enhanced as they use articles correctly in sentences."],
            "linksToOtherSubjects": ["The learner applies knowledge of articles to learning of similar concepts in other learning areas."]
        },
        "3.4": {
            "numberOfLessons": 2,
            "coreCompetencies": [
                "Learning to Learn: The learner's self-discipline is enhanced as they practise correct letter formation.",
                "Creativity and Imagination: The learner's originality is developed as they form letters in correct shapes and sizes."
            ],
            "values": ["Unity: Cooperation is enhanced as the learner works collaboratively with peers during handwriting activities."],
            "pcis": ["Life Skills (Self-esteem): The learner acquires an enhanced level of self-esteem as they write letters legibly."],
            "linksToOtherSubjects": ["The learner applies handwriting skills to writing in all other learning areas."]
        }
    },
    "4.0": {  # Home
        "4.1": {
            "numberOfLessons": 4,
            "coreCompetencies": [
                "Digital Literacy: The learner's interaction with digital technology is enhanced as they listen to audio or video texts related to the theme.",
                "Communication: The learner's ability to listen keenly and actively is enhanced as they identify words with the target sounds."
            ],
            "values": ["Love: This is enhanced as the learner interacts with texts about home and learns to appreciate family."],
            "pcis": ["Life Skills (Self-awareness): The learner's self-awareness is enhanced as they use vocabulary to talk about their home."],
            "linksToOtherSubjects": ["The learner applies vocabulary related to home to their learning in Environmental Activities."]
        },
        "4.2": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Learning to Learn: The learner's ability to learn independently is enhanced as they practise reading words with target sounds."],
            "values": ["Responsibility: This is developed as the learner takes up roles during group reading activities."],
            "pcis": ["Life Skills (Self-esteem): The learner's self-esteem is enhanced as they read words correctly."],
            "linksToOtherSubjects": ["The learner applies reading skills to reading texts in other learning areas."]
        },
        "4.3": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Communication: The learner's ability to speak clearly and correctly is enhanced as they use verbs to describe actions."],
            "values": ["Respect: This is developed as the learner appreciates the efforts of peers during language activities."],
            "pcis": ["Life Skills (Self-esteem): The learner's self-esteem is nurtured as they use verbs correctly."],
            "linksToOtherSubjects": ["The learner applies knowledge of verbs to learning of similar concepts in Kiswahili Language Activities."]
        },
        "4.4": {
            "numberOfLessons": 2,
            "coreCompetencies": [
                "Learning to Learn: The learner's self-discipline is enhanced as they practise correct letter formation.",
                "Critical Thinking and Problem Solving: The learner is able to match capital and small letters correctly."
            ],
            "values": ["Unity: Cooperation is enhanced as the learner works collaboratively with peers during handwriting activities."],
            "pcis": ["Life Skills (Self-esteem): The learner acquires an enhanced level of self-esteem as they form letters correctly."],
            "linksToOtherSubjects": ["The learner applies handwriting skills to writing in all other learning areas."]
        }
    },
    "5.0": {  # Time
        "5.1": {
            "numberOfLessons": 4,
            "coreCompetencies": [
                "Creativity and imagination: The learner's ability to explore new ways of presenting ideas is inculcated as they retell stories and show appropriate eye contact and facial expressions.",
                "Digital Literacy: The learner's ability to connect with technology is promoted as they watch a video or live performance of a story and say what the eye contact or the facial expressions mean."
            ],
            "values": ["Responsibility: This is enhanced as the learner takes up assigned roles during role play activities with peers."],
            "pcis": ["Life Skills (Self-esteem): The learner's self-esteem is enhanced as they use new words learnt to talk about different times of the day."],
            "linksToOtherSubjects": ["The learner applies information on time to their learning of similar concepts of time in Environmental Activities."]
        },
        "5.2": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Collaboration: Teamwork is developed as the learner collaborates with peers to play a fishing game to identify specific sounds."],
            "values": ["Social Justice: This is enhanced as the learner fosters fairness and non-discrimination to peers as they accord peers equal opportunities to play the language game."],
            "pcis": ["Life Skills (Self-esteem): The learner acquires an improved level of self-esteem as they acquire reading skills."],
            "linksToOtherSubjects": ["The learner applies their reading skills to the reading of materials in other learning areas."]
        },
        "5.3": {
            "numberOfLessons": 2,
            "coreCompetencies": [
                "Communication: The learner's ability to speak clearly and correctly is enhanced as they talk about the activities they do every day.",
                "Digital Literacy: This is enhanced as the learner interacts with digital content when watching a video on children participating in routine activities."
            ],
            "values": ["Respect: This is developed as the learner appreciates and understands peers' opinions as they talk about their routine activities."],
            "pcis": ["Life Skills (Self-awareness): The learner acquires self-awareness as they talk about their sequence routine or daily activities using present simple tense."],
            "linksToOtherSubjects": ["The learner applies the vocabulary learnt to talk about activities taking place at different times of the day in Environmental Activities."]
        },
        "5.4": {
            "numberOfLessons": 2,
            "coreCompetencies": [
                "Critical thinking and problem solving: The learner is able to think logically when matching lower case (small) and upper case (capital) letters Ss, Ll, Ii and Pp on flashcards.",
                "Learning to Learn: The learner's ability to build relationships is promoted as they work with peers to write 3-4 letter words from left to right."
            ],
            "values": ["Unity: This is enhanced as the learner collaborates with others to sort out flashcards with small letters and capital letters."],
            "pcis": ["Life Skills (Self-esteem): The learner acquires a high level of self-esteem as they form letters correctly for effective communication."],
            "linksToOtherSubjects": ["The learner can apply the concept of neatness and legibility in writing to their learning in all other learning areas."]
        }
    }
}

# Update the strands
updated_count = 0
for strand in data.get("strands", []):
    strand_id = strand.get("strandId", "")
    
    if strand_id in themes_data:
        theme_substrands = themes_data[strand_id]
        
        for substrand in strand.get("subStrands", []):
            substrand_id = substrand.get("subStrandId", "")
            
            if substrand_id in theme_substrands:
                ss_data = theme_substrands[substrand_id]
                substrand["numberOfLessons"] = ss_data["numberOfLessons"]
                substrand["coreCompetencies"] = ss_data["coreCompetencies"]
                substrand["values"] = ss_data["values"]
                substrand["pcis"] = ss_data["pcis"]
                substrand["linksToOtherSubjects"] = ss_data["linksToOtherSubjects"]
                updated_count += 1
                print(f"✅ Updated: Strand {strand_id} - SubStrand {substrand_id}: {ss_data['numberOfLessons']} lessons")

# Save updated JSON
with open('../data/curriculum/G1/grade-1-english.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\n✅ Batch 1 (Themes 1-5) completed!")
print(f"Total sub-strands updated: {updated_count}")
print(f"Total lessons: {sum(themes_data[s][ss]['numberOfLessons'] for s in themes_data for ss in themes_data[s])}")
