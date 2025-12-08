import json

file_path = '../data/curriculum/G4/grade-4-english.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Helper to find strand by ID
def get_strand(strand_id):
    for s in data['strands']:
        if s['strandId'] == strand_id:
            return s
    return None

# Helper to find sub-strand by ID
def get_sub_strand(strand, sub_id):
    for s in strand['subStrands']:
        if s['subStrandId'] == sub_id:
            return s
    return None

# Update Theme 9.0
s9 = get_strand("9.0")
if s9:
    # 9.1
    ss = get_sub_strand(s9, "9.1")
    if ss:
        ss['number_of_lessons'] = 2
        ss['coreCompetencies'] = [
            "Communication and Collaboration: This is enhanced when the learner recites poems related to the theme at an appropriate pace",
            "Self-efficacy: It is developed as the learner develops confidence in speaking when they repeat oral texts without hesitation and at a reasonable speed"
        ]
        ss['values'] = ["Peace: It is enhanced as the learner respects self and others when they repeat words with target sounds inaccurately"]
        ss['pcis'] = [
            "HIV and AIDs Education: This is promoted through the learner’s engagement in oral language tasks like listening comprehension, poems and songs related to HIV and AIDs",
            "Clubs and societies: Engaging in activities of clubs and societies is encouraged as the learner makes speeches featuring moral values"
        ]
        ss['linkToOtherSubjects'] = ["The learner can apply the skill of speaking fluency when making presentation in all learning areas including Religious Education"]

    # 9.2
    ss = get_sub_strand(s9, "9.2")
    if ss:
        ss['number_of_lessons'] = 3
        ss['coreCompetencies'] = [
            "Communication and Collaboration: This is enhanced as the learner answers factual and inferential questions in groups",
            "Self-efficacy: This is achieved when the learner answers inferential and factual questions correctly"
        ]
        ss['values'] = ["Love: It is nurtured when the learner respects others as they read texts online or offline and answer questions"]
        ss['pcis'] = [
            "Clubs and Societies: Reading clubs, writing clubs, journalism clubs among others build the learner’s self-esteem to become more confident readers as they manoeuvre to give the sequence of events in a story"
        ]
        ss['linkToOtherSubjects'] = ["The learner can link the content obtained from the theme of HIV and AIDS to concepts taught in Agriculture and,Science and Technology"]

    # 9.3
    ss = get_sub_strand(s9, "9.3")
    if ss:
        ss['number_of_lessons'] = 3
        ss['coreCompetencies'] = [
            "Communication and Collaboration: This is manifested when the learner play games involving categorising different types of adverbs collaboratively",
            "Self-efficacy: This is gained when learner constructs sentences using adverbs for daily communication"
        ]
        ss['values'] = ["Integrity: This is nurtured when the learner displays honesty as they create a list of adverbs and construct sentences individually"]
        ss['pcis'] = [
            "HIV and AIDS Education, Communicable and Non-communicable Diseases: These issues are enhanced as the learner interacts with the theme in various activities and makes sentences with adverbs that are derived from the theme of HIV and AIDS"
        ]
        ss['linkToOtherSubjects'] = ["The learner applies the knowledge gained from studying adverbs to their learning of word classes in Kiswahili"]

    # 9.4
    ss = get_sub_strand(s9, "9.4")
    if ss:
        ss['number_of_lessons'] = 3
        ss['coreCompetencies'] = [
            "Self-efficacy: This is developed as the learner plays punctuation games and punctuates sentences",
            "Digital Literacy: It is enhanced as the learner uses digital devices to type sentences and text, as well as access and play online and offline games"
        ]
        ss['values'] = [
            "Responsibility: This is encouraged as the learner engages in assigned roles of typing sentences, making stickers and drawing commas and question marks to display in the classroom",
            "Love: It is nurtured as the learner displays trustworthiness by portraying a caring attitude when appreciating peers’ work displayed in the classroom"
        ]
        ss['pcis'] = [
            "Personal Safety and Security Education: These aspects are learnt as the learner is taught HIV prevention and the need for balanced meals for those suffering from AIDs",
            "Assertiveness: This is enhanced as the learner understands mechanics of proper punctuation in writing which boosts their self-esteem for self-expression"
        ]
        ss['linkToOtherSubjects'] = ["The learner applies the skill of proper punctuation and in particular the use of the comma and question mark to all other learning areas as they write essays and other written assignments"]

# Update Theme 10.0
s10 = get_strand("10.0")
if s10:
    # 10.1
    ss = get_sub_strand(s10, "10.1")
    if ss:
        ss['number_of_lessons'] = 2
        ss['coreCompetencies'] = [
            "Communication and Collaboration: This competence are developed when the learner says the words correctly and when working with peers",
            "Self-efficacy: It is developed when the learner communicates accurately thereby enhancing their confidence"
        ]
        ss['values'] = [
            "Love: It is nurtured when the learner puts the interest of others before their own interests during collaborative activities",
            "Responsibility: This is encouraged as the learner solves the given problems proactively by making oral presentations as assigned"
        ]
        ss['pcis'] = ["The learner’s self-esteem is enhanced as they acquire better self-expression and pronunciation ability through engaging in various activities for interactive listening and turn-taking"]
        ss['linkToOtherSubjects'] = ["The learner applies the skills of interactive listening to all learning areas as listening is a key skill for effective learning"]

    # 10.2
    ss = get_sub_strand(s10, "10.2")
    if ss:
        ss['number_of_lessons'] = 3
        ss['coreCompetencies'] = [
            "Digital Literacy: This is enhanced as the learner manipulates electronic devices to read factual information based on the theme of hygiene and sanitation",
            "Learning to Learn: It is developed as the learner uses resource materials like the encyclopaedia to obtain relevant information"
        ]
        ss['values'] = [
            "Respect: This is developed as the learner displays open mindedness to the factual information read from different sources",
            "Unity: This is achieved as the learner shares resources amicably with other learners during the activities that require the use of electronic devices"
        ]
        ss['pcis'] = ["Personal Hygiene: It is enhanced as the learner reads stories on hygiene and watches a video on how to take care of oneself by focusing on personal hygiene and sanitation"]
        ss['linkToOtherSubjects'] = [
            "The learner applies the knowledge of reading for factual information to all other areas of learning as they require this skill",
            "The learner also uses the skills gained in using the dictionary and other reference materials to other learning areas like Kiswahili which require them to use dictionaries as well"
        ]

    # 10.3
    ss = get_sub_strand(s10, "10.3")
    if ss:
        ss['number_of_lessons'] = 3
        ss['coreCompetencies'] = [
            "Communication and Collaboration: This competence are realised as the learner engages in assigned activities collaboratively",
            "Digital Literacy: This is enhanced as the learner interacts with technology while typing their sentences on a digital device"
        ]
        ss['values'] = [
            "Responsibility: It is seen as the learner engages in assigned roles and duties in different activities while learning conjunctions",
            "Unity: This is achieved as the learner shares the available resources like the digital devices so that peers can as well type their sentences on the device"
        ]
        ss['pcis'] = ["Personal Hygiene: This is promoted as the learner listens to short dialogues on sanitation and how to take care of oneself"]
        ss['linkToOtherSubjects'] = [
            "The learner relates the knowledge on conjunctions to similar concepts taught in Kiswahili",
            "The learner relates content learnt from the theme of hygiene and sanitation to what is learnt in Agriculture and Creative Arts"
        ]

    # 10.4
    ss = get_sub_strand(s10, "10.4")
    if ss:
        ss['number_of_lessons'] = 3
        ss['coreCompetencies'] = [
            "Self-efficacy: This is achieved as the learner writes descriptive compositions for effective communication",
            "Learning to learn: It is enhanced as the learner works with peers to discover how to write descriptive compositions"
        ]
        ss['values'] = [
            "Responsibility: This is nurtured as the learner engages in assigned roles and duties in different activities of planning and writing a descriptive composition",
            "Unity: It is achieved as the learner shares the available resources like the digital devices so that peers can as well type their descriptive compositions on the device"
        ]
        ss['pcis'] = ["Proper Sanitation: This is achieved as the learner talks about ‘how to clean a house’ before peers making them learn sanitation from each other"]
        ss['linkToOtherSubjects'] = ["The learner relates the skill of descriptive writing to writing skills taught in Kiswahili"]

# Update Theme 11.0
s11 = get_strand("11.0")
if s11:
    # 11.1
    ss = get_sub_strand(s11, "11.1")
    if ss:
        ss['number_of_lessons'] = 2
        ss['coreCompetencies'] = [
            "Creativity and Imagination: This is enhanced when the learner engages in activities such as giving a speech using non- verbal cues",
            "Self-efficacy: This is realised when the learner ably interprets the nonverbal cues used by peers in communication"
        ]
        ss['values'] = ["Social Justice is encouraged as the learner accords equal opportunities and shares resources equitably while they watch and give a speech about sports"]
        ss['pcis'] = [
            "Effective Communication skills: These skills are developed as the learner engages in activities such as giving brief speeches",
            "Peer Education and Career Guidance: These are enhanced as the learner participates in making speeches in club meetings as well as sporting activities"
        ]
        ss['linkToOtherSubjects'] = [
            "The learner applies the skill of listening in all learning areas",
            "The learner also relates the content gained in listening to speeches on sports in learning of similar content in Creative Arts"
        ]

    # 11.2
    ss = get_sub_strand(s11, "11.2")
    if ss:
        ss['number_of_lessons'] = 3
        ss['coreCompetencies'] = [
            "Critical Thinking and Problem Solving: This is developed when the learner engages in watching and interpreting mimes and visuals",
            "Digital Literacy: This is enhanced when the learner uses digital devices to read on issues or topics online and offline"
        ]
        ss['values'] = [
            "Unity: This is developed as the learner works together with peers as they discuss and interpret visuals and mimes collaboratively",
            "Love: This is enhanced as the learner appreciates each other’s opinions in viewing and interpreting visuals collaboratively"
        ]
        ss['pcis'] = ["Self-esteem is achieved as the learner’s confidence level is nurtured when they watch videos or mimes and answer questions, interpret visual representations such as mind maps and carry out simple online research on how to play their favourite game"]
        ss['linkToOtherSubjects'] = ["The learner is able to apply research skills to look for information in all learning areas that they engage in"]

    # 11.3
    ss = get_sub_strand(s11, "11.3")
    if ss:
        ss['number_of_lessons'] = 3
        ss['coreCompetencies'] = [
            "Learning to Learn: This is enhanced as the learner uses appropriate interrogatives to ask questions",
            "Digital Literacy: The learner interacts with digital devices to watch videos and type sentences"
        ]
        ss['values'] = [
            "Unity: The learner collaborates with peers to perform task such as watching videos and typing sentences on a digital device",
            "Respect: This is promoted as the learner is able to accommodate the views of others during the discussion"
        ]
        ss['pcis'] = ["Self-esteem: This is built in the learner as they ask and answer questions using interrogatives about their favourite sports making them discover their talents"]
        ss['linkToOtherSubjects'] = ["The learner can relate the concept of interrogatives to question and answer sessions in Religious Education among other learning areas"]

    # 11.4
    ss = get_sub_strand(s11, "11.4")
    if ss:
        ss['number_of_lessons'] = 2
        ss['coreCompetencies'] = [
            "Critical Thinking and Problem Solving: This is nurtured as the learner makes words from jumbled up letters",
            "Learning to learn: This is enhanced as the learner learns how to spell commonly misspelt words through learner centred- activities"
        ]
        ss['values'] = ["Responsibility is encouraged as the learner engages in assigned roles of searching for commonly misspelt words and creating puzzles"]
        ss['pcis'] = [
            "Effective Communication: The learner learns how to spell words correctly and can therefore communicate by writing effectively",
            "Self-esteem is developed as the learner engages in games-related activities such as creating a puzzle with commonly misspelt words"
        ]
        ss['linkToOtherSubjects'] = ["The learner is able to apply knowledge on proper spelling skills to all learning areas as they all insist on correct spelling"]

# Update Theme 12.0
s12 = get_strand("12.0")
if s12:
    # 12.1
    ss = get_sub_strand(s12, "12.1")
    if ss:
        ss['number_of_lessons'] = 2
        ss['coreCompetencies'] = [
            "Communication and Collaboration: This iss achieved as the learner makes short speeches in collaboration with peers",
            "Creativity and Imagination: The learner creatively composes a speech on clean environment and delivers it fluently to the peers"
        ]
        ss['values'] = ["Respect is nurtured as the learner respects the peers’ opinions when reciting poems collaboratively"]
        ss['pcis'] = ["Social Cohesion and integrity are enhanced as the learner engages with peers in doing activities such as reciting poems and making short speeches"]
        ss['linkToOtherSubjects'] = ["The learner is able to link fluency in speaking to all learning areas as fluency is required when making presentations"]

    # 12.2
    ss = get_sub_strand(s12, "12.2")
    if ss:
        ss['number_of_lessons'] = 3
        ss['coreCompetencies'] = [
            "Communication and Collaboration: The learner discusses and role plays with peers events in the passage or in the song",
            "Self-efficacy: This is achieved as the learner answers questions from songs and poems, and takes part in the role play confidently"
        ]
        ss['values'] = ["Responsibility: It is inculcated in the learner as they take upon assigned duties of reading the poems, discussing the events and identifying the proverbs in the passage"]
        ss['pcis'] = ["Online Safety: The learner’s knowledge on personal safety is emphasised when accessing internet resources to watch a video on how people recite poems"]
        ss['linkToOtherSubjects'] = ["The learner applies the skills acquired in reading intensively to their learning of reading skills in other areas such as Kiswahili"]

    # 12.3
    ss = get_sub_strand(s12, "12.3")
    if ss:
        ss['number_of_lessons'] = 3
        ss['coreCompetencies'] = [
            "Communication and Collaboration: The learner engages in responding to questions on activities they have just completed collaboratively with peers",
            "Self-efficacy: This is developed when the learner confidently makes correct sentences while creating a list of sentences in present and past perfect aspect"
        ]
        ss['values'] = ["Love: This is nurtured as the learner puts the interest of others before own interest when engaging in language games featuring sentences in present and past perfect aspect"]
        ss['pcis'] = ["Effective Communication Skills: These skills are perfected as the learner uses the present and past perfect aspects correctly in sentences and learns how to communicate with clarity"]
        ss['linkToOtherSubjects'] = ["The learner can apply the knowledge of present and past perfect aspect in learning similar concepts in Kiswahili"]

    # 12.4
    ss = get_sub_strand(s12, "12.4")
    if ss:
        ss['number_of_lessons'] = 3
        ss['coreCompetencies'] = [
            "Critical Thinking and Problem Solving: These competencies are manifested when the learner comes up with their own diary and displays it for the rest of the class members",
            "Digital Literacy: This is achieved as learner ably manipulates digital devices when searching for information on how to write a diary from electronic resources"
        ]
        ss['values'] = ["Responsibility: This is inculcated as the learner applies their diary in their day-to-day operations"]
        ss['pcis'] = ["Self-esteem: The learner’s self-esteem is enhanced as they search for information on how to write a diary and apply it in their writing of a diary"]
        ss['linkToOtherSubjects'] = ["The learner applies the knowledge of writing a diary to learning of the same concept in Kiswahili"]

# Update Theme 13.0
s13 = get_strand("13.0")
if s13:
    # 13.1
    ss = get_sub_strand(s13, "13.1")
    if ss:
        ss['number_of_lessons'] = 3
        ss['coreCompetencies'] = ["Communication and collaboration: This is enhanced as the learner plays with peers the telephone game"]
        ss['values'] = [
            "Respect: This is enhanced as the learner displays humility while playing the telephone game with peers",
            "Responsibility: The learner offers leadership and guidance to others while preparing to play the telephone game"
        ]
        ss['pcis'] = ["Financial Literacy: It is developed as the learner listens to stories about money either recorded or from the teacher"]
        ss['linkToOtherSubjects'] = ["The learner applies the skill of intensive listening to all other learning areas. The learner can also relate the stories listened to about money to the same concept in Mathematics"]

    # 13.2
    ss = get_sub_strand(s13, "13.2")
    if ss:
        ss['number_of_lessons'] = 3
        ss['coreCompetencies'] = [
            "Communication and Collaboration: This is enhanced when the learner sets up after-school clubs for reading purposes",
            "Learning to Learn: This is achieved as the learner develops independent reading skills that enable them to look for information on their own"
        ]
        ss['values'] = ["Responsibility: This is nurtured as the learner offers leadership and guidance to others while preparing to play the telephone game"]
        ss['pcis'] = [
            "Financial Literacy: It is nurtured as the learner interacts with reading materials on money",
            "Problem solving skills for better living: The learner reads stories on how people handle money and the consequences of that"
        ]
        ss['linkToOtherSubjects'] = ["The learner can ably link extensive reading to other subjects such as Kiswahili which have such concepts taught and encouraged"]

    # 13.3
    ss = get_sub_strand(s13, "13.3")
    if ss:
        ss['number_of_lessons'] = 2
        ss['coreCompetencies'] = [
            "Self-efficacy: The learner develops confidence and self-esteem when using prepositions correctly",
            "Digital Literacy: The learner interacts with technology through watching videos and television programmes and seeing how people use prepositions in conversation",
            "Learning to Learn: This is enhanced as the learner creates and displays charts featuring prepositions in the classroom"
        ]
        ss['values'] = [
            "Love: It is achieved as the learner respects others’ work as created and displayed on preposition charts",
            "Responsibility: The learner offers leadership and guidance to others while preparing to play appropriate preposition online and offline games"
        ]
        ss['pcis'] = [
            "Financial Literacy: This is realised when the learner interacts with materials about money as they watch videos about how people use money in their daily lives",
            "Citizenship: This is nurtured as the learner learns about money and the importance of paying taxes to foster patriotism"
        ]
        ss['linkToOtherSubjects'] = ["The learner can link the content taught here to Social Studies where as a concept patriotism is promoted through sensitising learners about money and payment of tax"]

    # 13.4
    ss = get_sub_strand(s13, "13.4")
    if ss:
        ss['number_of_lessons'] = 2
        ss['coreCompetencies'] = [
            "Critical Thinking and Problem Solving: The learner forms words with double consonants from jumbled up letters",
            "Learning to Learn: This is encouraged as the learner learns how to spell words through learner centred activities such as peer dictation, jigsaw puzzles and watching video as they write words learnt from peers"
        ]
        ss['values'] = [
            "Unity: It is portrayed as the learner takes turns while watching a video with peers and also shares the resources amicably to watch videos",
            "Integrity: This is achieved as the learner displays self-discipline and honesty when watching videos online and writing down words with double consonants used in the video"
        ]
        ss['pcis'] = [
            "Effective Communication: This is enhanced as the learner learns how to spell words correctly thereby effectively communicating especially in written form",
            "Financial Literacy: The learner listens to audio recordings and watches videos about the theme of money to pick out words on double consonants"
        ]
        ss['linkToOtherSubjects'] = ["The learner ably transfers the knowledge on proper spelling to all other learning areas as they all emphasise on correct spelling in written work"]

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print("Updated Themes 9-13 with details.")
