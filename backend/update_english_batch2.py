#!/usr/bin/env python3
"""
Update Grade 1 English JSON - Batch 2: Themes 6-10
"""
import json

# Load existing JSON
with open('../data/curriculum/G1/grade-1-english.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Complete curriculum data keyed by strandId and subStrandId
themes_data = {
    "6.0": {  # Weather and Our Environment
        "6.1": {
            "numberOfLessons": 4,
            "coreCompetencies": ["Communication: The learner's ability to listen keenly and actively is developed as they listen to audio texts/oral texts and identify words with the target sounds in preparation for reading."],
            "values": ["Unity: Cooperation is nurtured as the learner teams up with peers to role play giving and receiving of simple instructions with peers."],
            "pcis": ["Environmental Education: The learner acquires information on the environment as they learn the new words related to weather and our environment."],
            "linksToOtherSubjects": ["The learner can relate the vocabulary related to weather to their learning in Environmental activities."]
        },
        "6.2": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Learning to Learn: The learner's ability to learn independently is developed as they practise reading sentences with decodable words on their own."],
            "values": ["Respect: This is developed as the learner appreciates the effort of peers as they practise reading words correctly."],
            "pcis": ["Climate Change: This is promoted as the learner interacts with words related to the theme on weather and the environment."],
            "linksToOtherSubjects": ["The learner applies reading skills to read texts in other learning areas."]
        },
        "6.3": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Communication: The learner's ability to speak clearly and correctly is promoted as they use the present continuous tense to describe ongoing activities."],
            "values": ["Unity: This is enhanced as the learner actively participates in role playing events in a story with peers."],
            "pcis": ["Life Skills (Self-esteem): The learner's level of self-esteem is boosted as they use the present continuous tense correctly to describe ongoing activities."],
            "linksToOtherSubjects": ["The learner links the concept of present continuous tense to learning of similar concepts in Kiswahili and Indigenous Language Activities."]
        },
        "6.4": {
            "numberOfLessons": 2,
            "coreCompetencies": [
                "Learning to Learn: The learner's self-discipline is enhanced as they are motivated to practise correct letter formation on their own.",
                "Creativity and Imagination: The learner's originality of ideas and skills are developed as they create a poster with words related to weather and our environment."
            ],
            "values": ["Responsibility: This is enhanced as the learner takes it upon themselves to complete given tasks."],
            "pcis": ["Life Skills (Self-esteem): The learner's self-esteem is enhanced as they spell words dictated by a teacher or peers correctly."],
            "linksToOtherSubjects": ["The learner applies the writing skills as they write texts in other learning areas."]
        }
    },
    "7.0": {  # Hygiene
        "7.1": {
            "numberOfLessons": 4,
            "coreCompetencies": [
                "Communication: The learner's ability to speak fluently is promoted as they recite alliterative words that have the target sounds as modeled by peers, a teacher or from an audio recording/clip.",
                "Digital Literacy: The learner's interaction with digital technology is promoted as they listen to audio recordings/clips for information on hygiene and identify words related to the theme."
            ],
            "values": ["Unity: This is enhanced as learner works collaboratively with peers to recite poems and sing songs on hygiene."],
            "pcis": ["Health Issues (Personal Hygiene): The learner acquires information on how to maintain personal hygiene from texts when reciting rhymes and singing songs related to the theme."],
            "linksToOtherSubjects": ["The learner applies information on hygiene to learning of similar concepts in Environmental Activities."]
        },
        "7.2": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Learning to Learn: The learner's ability to learn independently is improved as they practise reading non-decodable words for reading competency."],
            "values": ["Respect: This is enhanced as the learner appreciates the effort of peers to read non-decodable words and gives positive feedback."],
            "pcis": ["Life Skills (Self-esteem): The learner acquires an enhanced level of self-esteem as they read non-decodable words correctly."],
            "linksToOtherSubjects": ["The learner is able to apply vocabulary related to the theme to words in Environmental Activities."]
        },
        "7.3": {
            "numberOfLessons": 2,
            "coreCompetencies": [
                "Communication: The learner's ability to speak clearly and effectively is enhanced as they create a story to talk about an event using the past simple tense.",
                "Critical Thinking and Problem Solving: This is enhanced as the learner weighs options and thinks critically when playing the scavenger hunt game to scan for words in simple past tense."
            ],
            "values": ["Social Justice: This is enhanced as the learner fosters inclusivity and non-discrimination towards peers as they play language games."],
            "pcis": ["Life Skills (Self-esteem): The learner's self-esteem is nurtured as they use simple past tense in day-to-day communication."],
            "linksToOtherSubjects": ["The learner uses the knowledge of simple past tense to learn similar concepts in Kiswahili Language Activities."]
        },
        "7.4": {
            "numberOfLessons": 2,
            "coreCompetencies": [
                "Communication: The learner's ability to write clearly and correctly is reinforced as they practise writing 3-5 letter words featuring the target sounds correctly.",
                "Learning to Learn: The learner's self-discipline is developed as they practise writing words featuring the target sounds."
            ],
            "values": ["Respect: This is inculcated as the learner appreciates the efforts of peers to write correctly and offers guidance."],
            "pcis": ["Life Skills (Self-esteem): The learner acquires an enhanced level of self-esteem as they write letters correctly."],
            "linksToOtherSubjects": ["The learner applies the writing skills to convey information through writing in all learning areas."]
        }
    },
    "8.0": {  # Parts of the Body
        "8.1": {
            "numberOfLessons": 4,
            "coreCompetencies": ["Critical Thinking and Problem Solving: The learner's ability to think critically is developed as they use picture clues to complete a crossword puzzle with target words."],
            "values": ["Unity: This is advanced as the learner collaborates with peers to recite rhymes and poems related to the theme and featuring the target sounds."],
            "pcis": ["Life Skills (Self-awareness): The learner's self-awareness is developed as they acquire knowledge about the parts of their body from relevant texts."],
            "linksToOtherSubjects": ["The learner uses the pronunciation skills to learn similar concepts in Kiswahili and Indigenous Language Activities."]
        },
        "8.2": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Learning to Learn: The learner's ability to build relationships is developed as they team up to make recordings of the text they are reading and play back the text to peers."],
            "values": ["Patriotism: This is promoted as the learner appreciates the contribution of peers when working jointly to read a grade-appropriate picture book in unison with a peer, a teacher, or recording."],
            "pcis": ["Life Skills (self-esteem): The learner's self-esteem is nurtured as they acquire reading fluency skills."],
            "linksToOtherSubjects": ["The learner applies reading fluency skills when reading materials in other learning areas."]
        },
        "8.3": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Communication: The learner's ability to write clearly and effectively is enhanced as they use demonstratives to talk about near or far objects."],
            "values": ["Unity: This is enhanced as the learner collaboratively works with peers to carry out tasks such as singing songs and reciting rhymes about parts of the body."],
            "pcis": ["Health education: This is promoted as the learner interacts with texts and words on the theme Parts of the body."],
            "linksToOtherSubjects": ["The learner uses the knowledge acquired on vocabulary in learning the parts of the body in Religious Education Activities."]
        },
        "8.4": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Learning to learn: The learner's potential to work jointly is promoted as the learner teams up with peers to take part in a spelling writing mini-contest to spell words correctly."],
            "values": ["Unity: This is enhanced as the learner collaborates with peers to make words related to parts of the body from jumbled letters."],
            "pcis": ["Life Skills (Self-esteem): The learner acquires an enhanced level of self-esteem as they learn how to spell words correctly."],
            "linksToOtherSubjects": ["The learner applies the knowledge acquired to spell words correctly in other learning areas."]
        }
    },
    "9.0": {  # My Friends
        "9.1": {
            "numberOfLessons": 4,
            "coreCompetencies": ["Learning to Learn: The learner's ability to learn independently is scaled up as they practise pronouncing words with the target sounds correctly."],
            "values": ["Unity: Cooperation is developed as the learner collaborates with peers to sing songs and recite poems related to the theme."],
            "pcis": ["Life Skills (Self-awareness): The learner's self-awareness is nurtured as they acquire knowledge about their friends."],
            "linksToOtherSubjects": ["The learner uses the acquired pronunciation skills to express themselves fully when learning content in the words in other learning areas."]
        },
        "9.2": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Communication: The learner's ability to speak clearly and effectively is enhanced as they pronounce words correctly when reading a text."],
            "values": ["Respect: This is achieved as the learner appreciates the effort of peers to read fluently during timed reading activities."],
            "pcis": ["Life Skills (Self-esteem): The learner gains a greater sense of self-esteem as they recite poems and sing songs related to the theme."],
            "linksToOtherSubjects": ["The learner uses reading fluency skills when reading words in Kiswahili and Indigenous Language Activities."]
        },
        "9.3": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Communication: The learner's ability to speak clearly is developed as the learner uses common and proper nouns correctly."],
            "values": ["Respect: The value of respect is enhanced as the learner talks positively about their friends."],
            "pcis": ["Life Skills (Self-esteem): The learner's sense of self-esteem is reinforced as they use proper nouns correctly."],
            "linksToOtherSubjects": ["The learner applies the knowledge of common and proper nouns to learning of similar concepts in Kiswahili Language Activities."]
        },
        "9.4": {
            "numberOfLessons": 2,
            "coreCompetencies": [
                "Communication: The learner's ability to write clearly improves as they use capital letters and the full stop correctly.",
                "Learning to Learn: The learner's ability to learn independently is developed as they practise writing their names/names of their friends starting with capital letters."
            ],
            "values": ["Unity: Cooperation is enhanced as the learner works collaboratively with peers to colour the capital letters and small letters using crayons of different colours."],
            "pcis": ["Life Skills (Self-esteem): The learner's self-esteem is nurtured as they practise using target punctuation marks correctly."],
            "linksToOtherSubjects": ["The learner applies knowledge about capital letters and the full stop when learning concepts in learning areas such as Environmental Activities, Kiswahili, and Indigenous Language Activities."]
        }
    },
    "10.0": {  # Safety
        "10.1": {
            "numberOfLessons": 4,
            "coreCompetencies": [
                "Communication: The learner's ability to speak clearly and effectively is promoted as they pronounce words with the target sounds correctly.",
                "Learning to Learn: The learner's ability to learn independently is developed as they practise pronouncing words containing the target sounds."
            ],
            "values": ["Unity: The value of unity is developed as the learner works collaboratively with peers."],
            "pcis": ["Safety and Security: The learner's safety is enhanced as they acquire information about safety from texts."],
            "linksToOtherSubjects": ["The learner applies the skills of correct pronunciation to the learning of similar concepts in Kiswahili and Indigenous Language Activities."]
        },
        "10.2": {
            "numberOfLessons": 1,
            "coreCompetencies": ["Learning to Learn: The learner's ability to develop relationships is developed as they collaboratively recite poems with words that have the target sounds."],
            "values": ["Responsibility: This is developed as the learner engages actively in activities to excel in reading fluency."],
            "pcis": ["Life Skills (Self-esteem): The learner acquires an enhanced level of self-esteem as they acquire reading fluency skills."],
            "linksToOtherSubjects": ["The learner applies reading fluency skills when reading words in all learning areas."]
        },
        "10.3": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Digital Literacy: This is promoted as the learner interacts with technology as they listen to a story from a recording and lists the prepositions they hear."],
            "values": ["Social Justice: Fairness is enhanced as learners accord each other equal opportunities in sharing roles irrespective of their diversities when reciting a poem."],
            "pcis": ["Life Skills (Self-esteem): The learner's esteem is enhanced as they use prepositions in various contexts correctly."],
            "linksToOtherSubjects": ["Learner applies knowledge about prepositions to the learning of Kiswahili Language Activities and Environmental Activities."]
        },
        "10.4": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Learning to Learn: Independent learning is enhanced as the learner practises how to use the target punctuation marks correctly in writing."],
            "values": ["Responsibility: This is enhanced as the learner takes up assigned roles when taking turns to ask questions and receive answers from peers."],
            "pcis": ["Life Skills (Self-esteem): Learners acquire a high enhanced level of self-esteem as they punctuate their writing correctly."],
            "linksToOtherSubjects": ["Proper use of punctuation is emphasised in Kiswahili and Indigenous Language Activities."]
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

print(f"\n✅ Batch 2 (Themes 6-10) completed!")
print(f"Total sub-strands updated: {updated_count}")
print(f"Total lessons: {sum(themes_data[s][ss]['numberOfLessons'] for s in themes_data for ss in themes_data[s])}")
