#!/usr/bin/env python3
"""
Update Grade 1 English JSON - Batch 3: Themes 11-15
"""
import json

with open('../data/curriculum/G1/grade-1-english.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

themes_data = {
    "11.0": {
        "11.1": {
            "numberOfLessons": 4,
            "coreCompetencies": ["Creativity and Imagination: This is enhanced as the learner is inspired to embrace creative ways of embracing ideas when reciting poems/ rhymes/ tongue twisters using words with the target sounds."],
            "values": ["Respect: This is developed as the learner works exhibits tolerance with peers when playing a game of swapping flashcards to make new words."],
            "pcis": ["Life Skills (Self-esteem): The learner acquires an enhanced level of self-esteem as they pronounce words correctly."],
            "linksToOtherSubjects": ["The learner applies knowledge about pronunciation to express themselves clearly when learning concepts in Kiswahili Language Activities and Indigenous Languages Activities."]
        },
        "11.2": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Self-efficacy: This is enhanced as the learner sharpens their public speaking skills by displaying the right emotions when reading a text."],
            "values": ["Responsibility: This is developed as the learner takes up accountability tasks when practicing to read within set timelines."],
            "pcis": ["Learner Support Programmes (Clubs and Society): The learner's ability to read is developed as they team up to recite poems/ rhymes related to the theme during club activities."],
            "linksToOtherSubjects": ["The learner's capacity to read and understand concepts in other learning areas is greatly improved as they become more fluent in reading."]
        },
        "11.3": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Creativity and Imagination: This is enhanced as the learner practises making predictions of what will happen in a story based on the title and the pictures."],
            "values": ["Respect: This is developed as the learner displays patience with each other as they take turns to read simple sentences."],
            "pcis": ["Life Skills (Self-esteem): The learner's self-esteem is nurtured as they answer direct and indirect questions from a text correctly to show comprehension."],
            "linksToOtherSubjects": ["The learner applies the comprehension skills to learning areas of texts in Kiswahili and Indigenous Language Activities."]
        },
        "11.4": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Creativity and imagination: This is promoted as the learner uses words to describe things around them."],
            "values": ["Unity: This is developed as the learner embraces a team spirit during language games involving one and two syllable adjectives."],
            "pcis": ["Environmental awareness: This is promoted as the learner gets to identify things and people around them and describe them to peers in terms of shape, size and colour."],
            "linksToOtherSubjects": ["The learner applies knowledge about adjectives to describe things in Creative Activities."]
        },
        "11.5": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Creativity and Imagination: The learner's ability to make connections is developed as the learner makes sentences from picture prompts."],
            "values": ["Unity: The learner acquires the ability to cooperate with others as they complete a word search or crossword puzzle with peers."],
            "pcis": ["Nationalism: This is addressed as the learner interacts with texts tied to the theme on community leaders."],
            "linksToOtherSubjects": ["The learner is able to apply inferencing skills on pictures to their learning of similar concepts in Creative Activities."]
        }
    },
    "12.0": {
        "12.1": {
            "numberOfLessons": 4,
            "coreCompetencies": ["Communication: The learner's ability to listen keenly and actively is enhanced as they listen to an audio text and pick out the target sounds.", "Learning to Learn: The learner's ability to learn independently is enhanced as they practise using vocabulary learnt in a variety of texts."],
            "values": ["Peace: This is enhanced as the learner works harmoniously with peers to take turns to respond to simple one-directional instructions orally or by using appropriate gestures."],
            "pcis": ["Social Cohesion: This is enhanced as the learner interacts with texts on the theme - Living together."],
            "linksToOtherSubjects": ["The learner is able to apply attentive listening skills to learning concepts in other learning areas."]
        },
        "12.2": {
            "numberOfLessons": 1,
            "coreCompetencies": ["Self-efficacy: This is enhanced as the learner builds on their fluency by taking part in timed-reading of a text while displaying the right expressions."],
            "values": ["Respect: This is enhanced as the learner appreciates the effort of peers in reading fluently as they read words with target sounds correctly."],
            "pcis": ["Learner Support Programmes (Clubs and Societies): The learner practises reading fluently and is able to apply the same in reading clubs."],
            "linksToOtherSubjects": ["The learner applies reading fluency as they read texts in Kiswahili Language Activities."]
        },
        "12.3": {
            "numberOfLessons": 1,
            "coreCompetencies": ["Creativity and Imagination: The learner practises making connections as they talk about their own experiences related to the events in the story."],
            "values": ["Responsibility: This is enhanced as the learner engages in assigned roles and duties during role-play activities with peers."],
            "pcis": ["Social Cohesion: This is promoted as the learner interacts with texts on living together and shares with peers their real life experiences that relate to events in the story."],
            "linksToOtherSubjects": ["The learner applies comprehension skills to learning of texts in Kiswahili and Indigenous Language Activities."]
        },
        "12.4": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Creativity and imagination: This is nurtured as the learners creatively express their ideas when engaging in a role-play to show ownership of various items."],
            "values": ["Integrity: This is enhanced as the learner shows due regard for other's property when learning about possessives."],
            "pcis": ["Life Skills (Self-awareness): The learner's self-awareness is enhanced as they learn about possessive pronouns."],
            "linksToOtherSubjects": ["The learner can link the concept of possessive pronouns to learning of similar concepts in Kiswahili Language Activities."]
        },
        "12.5": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Critical thinking and problem solving: The learner is able to think critically when picking out correct words that can be used to fill in gaps in sentences appropriately."],
            "values": ["Unity: This is enhanced as the learner works collaboratively with peers to match pictures with words."],
            "pcis": ["Life Skills (Self-esteem): The learner acquires an enhanced level of self-esteem as they fill in gaps to complete sentences."],
            "linksToOtherSubjects": ["The learner can apply the writing skills to write sentences in other learning areas."]
        }
    },
    "13.0": {
        "13.1": {
            "numberOfLessons": 4,
            "coreCompetencies": ["Digital Literacy: This is embraced as the learner is guided to interact with technology when teaming up to record each other recite poems/rhymes/tongue twisters with target words and sounds."],
            "values": ["Responsibility: This is enhanced as the learner handles digital devices carefully and keeps each other accountable as they record their performances."],
            "pcis": ["Life Skills (Self-esteem): The learner's self-esteem is nurtured as they learn how to use the digital devices appropriately."],
            "linksToOtherSubjects": ["The learner applies the vocabulary learnt on technology to learning of other related concepts in other learning areas."]
        },
        "13.2": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Creativity and Imagination: The learner's ability to make connections is enhanced as they make predictions on where the events would be happening."],
            "values": ["Respect: This is enhanced as the learner appreciates the opinions of peers during discussions about the titles and pictures of a story."],
            "pcis": ["ICT: This is promoted as the learner interacts with texts tied to the theme on technology."],
            "linksToOtherSubjects": ["The learner applies comprehension strategies when reading texts in Kiswahili and Indigenous Language Activities."]
        },
        "13.3": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Communication: The learner's ability to speak clearly and effectively is enhanced as they take turns to ask and answer Yes/No questions related to the theme using can, may, and will."],
            "values": ["Love: This is enhanced as the learner acknowledges peer's views during question and answer activities."],
            "pcis": ["Life Skills (Self-esteem): The learner's self-esteem is enhanced as they ask and answer questions appropriately."],
            "linksToOtherSubjects": ["The learner uses question and answer as a mode of learning in all learning areas."]
        },
        "13.4": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Collaboration: The learner's teamwork spirit is enhanced as they play sentence-building drills collaboratively with peers while observing the rules of engagement."],
            "values": ["Social justice: This is enhanced as the learner fosters inclusivity and non-discrimination to peers as they team up to match pictures with the correct sentences."],
            "pcis": ["Life Skills (Self-esteem): The learner's self-esteem is enhanced as they write correct and meaningful sentences and words."],
            "linksToOtherSubjects": ["The learner can use the writing skills acquired to write sentences in Kiswahili and Indigenous Language Activities."]
        }
    },
    "14.0": {
        "14.1": {
            "numberOfLessons": 4,
            "coreCompetencies": ["Communication: The learner's ability to listen keenly and actively is enhanced as they listen to words with the target sounds and articulate them correctly."],
            "values": ["Unity: Cooperation is enhanced as the learner works collaboratively with peers on specific tasks like singing songs/chants using words related to the theme."],
            "pcis": ["Life Skills (Self-esteem): The learner's self-esteem is enhanced as they pronounce words correctly."],
            "linksToOtherSubjects": ["The learner uses the pronunciation skills to learn similar concepts in Kiswahili and Indigenous Language Activities."]
        },
        "14.2": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Learning to Learn: The learner's ability to learn independently is enhanced as they practise reading sentences containing decodable and non-decodable words for reading fluency."],
            "values": ["Responsibility: This is enhanced as the learner offers guidance to those with difficulties during reading activities."],
            "pcis": ["Peer Education and Mentorship: This is promoted as the learner engages in a readers' theatre to build on their fluency."],
            "linksToOtherSubjects": ["The learner uses reading fluency skills to read texts Kiswahili and Indigenous Language Activities."]
        },
        "14.3": {
            "numberOfLessons": 1,
            "coreCompetencies": ["Creativity and Imagination: The learner's ability to make connections is enhanced as they talk about their own experiences in relation to the story with peers."],
            "values": ["Respect: This is enhanced as the learner appreciates the opinions of peers during discussions on the title and pictures."],
            "pcis": ["Life Skills (Creative and Critical thinking skills): The skills are enhanced as the learner uses contextual clues to answer indirect questions."],
            "linksToOtherSubjects": ["The learner uses numeracy skills as learnt in the vocabulary in learning similar concepts in Mathematics Activities."]
        },
        "14.4": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Communication: The learner's ability to speak clearly and correctly is enhanced as they use adverbs of place to describe the position of objects and people."],
            "values": ["Responsibility: This is enhanced as the learner takes up roles during role-play activities with peers."],
            "pcis": ["Environmental awareness: This is enhanced as the learner identifies different positions of things in the classroom."],
            "linksToOtherSubjects": ["The learner uses the knowledge of adverbs to learn similar concepts in Kiswahili Language Activities."]
        },
        "14.5": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Communication: The learner's ability to write clearly and correctly is enhanced as they write simple meaningful sentences."],
            "values": ["Responsibility: This is enhanced as the learner ensures they complete allocated tasks when working jointly to write sentences from a substitution table."],
            "pcis": ["Life Skills (Self-esteem): The learner's self-esteem is nurtured as they write correct sentences for effective communication."],
            "linksToOtherSubjects": ["The learner can use the writing skills to write correct sentences in other learning areas."]
        }
    },
    "15.0": {
        "15.1": {
            "numberOfLessons": 4,
            "coreCompetencies": ["Communication: The learner's ability to speak clearly and correctly is enhanced as they use the new words learnt in short sentences.", "Critical thinking and Problem solving: The learner's ability to apply what they have learnt is enhanced as they use knowledge learnt to conserve resources."],
            "values": ["Respect: This is developed as the learner accepts diverse opinions from others when playing language games to practise pronouncing and using new words."],
            "pcis": ["Environmental Education: The learner is sensitised on avoiding wastage and using resources in the right way through texts they interact with."],
            "linksToOtherSubjects": ["The learner can apply attentive listening skills to learning concepts in other learning areas."]
        },
        "15.2": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Learning to Learn: The learner's self-discipline is enhanced as they practise reading sentences containing decodable and non-decodable words for fluency in reading.", "Citizenship: The learner becomes ethically responsible as they use time responsibly when engage in timed reading."],
            "values": ["Integrity: The learner's discipline is enhanced as they utilise time as a resource prudently."],
            "pcis": ["Life Skills (Self-esteem): The learner's self-esteem is enhanced as they acquire reading fluency skills."],
            "linksToOtherSubjects": ["The learner can use fluency skills to read fluently in Kiswahili Language Activities."]
        },
        "15.3": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Creativity and Imagination: The learner's communication and self-expression skills are nurtured as they draw pictures to show what is happening in the story."],
            "values": ["Respect: This is developed as the learner appreciates diverse opinions from peers during discussions on whether the predictions made are accurate."],
            "pcis": ["Environmental Education: This is promoted as the learner is sensitised on how to use resources properly through texts and stories read."],
            "linksToOtherSubjects": ["The learner can apply comprehension skills when reading texts in Kiswahili and Indigenous Language Activities."]
        },
        "15.4": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Digital Literacy: The learner's interaction with digital technology is enhanced as they use digital devices to search for emojis showing surprise.", "Communication: The learner's ability to write clearly and correctly is developed as they use interjections of surprise in simple sentences."],
            "values": ["Unity: This is reinforced as the learner works collaboratively with peers to role play the interjections of surprise as modelled by peers, the teacher or from a video recording."],
            "pcis": ["Life Skills (Self-esteem): The learner's self-esteem is nurtured as they use interjections correctly in communication."],
            "linksToOtherSubjects": ["The learner can use the knowledge on interjections of surprise to learn similar concepts in Kiswahili Language and Indigenous Language Activities."]
        },
        "15.5": {
            "numberOfLessons": 2,
            "coreCompetencies": ["Communication: The learner's ability to write clearly and correctly is developed as they write sentences of not more than five words."],
            "values": ["Unity: Cooperation is enhanced as the learner displays a team spirit as they work with peers to create a list of words describing people, things, and places."],
            "pcis": ["Life Skills (Self-esteem): The learner acquires a greater level of self-esteem as they express himself/herself creatively in writing."],
            "linksToOtherSubjects": ["The learner can apply writing skills to write correctly in other learning areas."]
        }
    }
}

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
                print(f"Updated: Strand {strand_id} - SubStrand {substrand_id}: {ss_data['numberOfLessons']} lessons")

with open('../data/curriculum/G1/grade-1-english.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\nBatch 3 (Themes 11-15) completed!")
print(f"Total sub-strands updated: {updated_count}")
total_lessons = sum(themes_data[s][ss]["numberOfLessons"] for s in themes_data for ss in themes_data[s])
print(f"Total lessons: {total_lessons}")
