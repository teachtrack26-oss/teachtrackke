import json

file_path = 'data/curriculum/G1/grade-1-math.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Update lesson counts and add details for Strand 1.0
# 1.1 Pre-number activities
data['strands'][0]['subStrands'][0]['numberOfLessons'] = 20
data['strands'][0]['subStrands'][0]['coreCompetencies'] = [
    "Creativity: learner makes patterns of different shapes and sizes using real objects.",
    "Self-efficacy: learner assists in arranging items according to size, colour, shape, and storage at home."
]
data['strands'][0]['subStrands'][0]['values'] = [
    "Unity: in teams, learner matches objects according to size, colour, and shape.",
    "Responsibility: learner assists in arranging items according to size, colour, shape, and storage at home."
]
data['strands'][0]['subStrands'][0]['pcis'] = [
    "Safety: learner observes safety as they collect objects from the immediate environment.",
    "Social Cohesion: learner works with peers as they pair and match objects according to size, colour and shape."
]
data['strands'][0]['subStrands'][0]['linkToOtherSubjects'] = [
    "The learner can relate the skills used in creating patterns to the concept of patterns in Creative Activities."
]

# 1.2 Whole Numbers
data['strands'][0]['subStrands'][1]['numberOfLessons'] = 25
data['strands'][0]['subStrands'][1]['coreCompetencies'] = [
    "Digital Literacy: learner uses digital devices to play games involving numbers 1 to 50.",
    "Creativity: learner creates patterns with numbers up to 20."
]
data['strands'][0]['subStrands'][1]['values'] = [
    "Respect: learner appreciates peers as they take turns in counting numbers forward up to 50."
]
data['strands'][0]['subStrands'][1]['pcis'] = [
    "Social Cohesion: learner takes turns counting numbers forward up to 50.",
    "Environmental Safety: learner observes safety when collecting concrete objects from the immediate environment."
]
data['strands'][0]['subStrands'][1]['linkToOtherSubjects'] = [
    "The learner can relate the skills used in the concept of reading and writing numbers in words and symbols to functional reading and writing in English Language Activities.",
    "The learner can relate the skills used in creating number patterns to the concept of patterns in Creative Activities."
]

# 1.3 Addition
data['strands'][0]['subStrands'][2]['numberOfLessons'] = 25
data['strands'][0]['subStrands'][2]['coreCompetencies'] = [
    "Creativity: learner makes number patterns involving addition.",
    "Collaboration: learner plays games involving addition with peers."
]
data['strands'][0]['subStrands'][2]['values'] = [
    "Social Justice: learner accommodates others as they play games involving addition."
]
data['strands'][0]['subStrands'][2]['pcis'] = [
    "Safety Issues: learner safely puts two groups of objects together and counts to get the total.",
    "Creative thinking: learner creatively makes number patterns involving addition with numbers up to 50."
]
data['strands'][0]['subStrands'][2]['linkToOtherSubjects'] = [
    "The learner can relate the skills used in writing addition sentences to functional writing in English Language Activities."
]

# 1.4 Subtraction
data['strands'][0]['subStrands'][3]['numberOfLessons'] = 20
data['strands'][0]['subStrands'][3]['coreCompetencies'] = [
    "Learning to Learn: learner learns the subtraction of numbers by counting backwards.",
    "Creativity: learner creates patterns involving subtraction."
]
data['strands'][0]['subStrands'][3]['values'] = [
    "Responsibility: learner takes care of concrete objects used in subtraction.",
    "Unity: learner shares number cards or charts as they work out subtraction."
]
data['strands'][0]['subStrands'][3]['pcis'] = [
    "Social Cohesion: learner works with peers to create patterns involving subtraction.",
    "Critical thinking: learner works out subtraction by counting backward."
]
data['strands'][0]['subStrands'][3]['linkToOtherSubjects'] = [
    "The learner can relate the skills of writing subtraction sentences to functional writing in English Language Activities."
]

# Strand 2.0 Measurement
data['strands'][1]['subStrands'][0]['numberOfLessons'] = 10 # Length
data['strands'][1]['subStrands'][1]['numberOfLessons'] = 10 # Mass
data['strands'][1]['subStrands'][2]['numberOfLessons'] = 12 # Capacity
data['strands'][1]['subStrands'][3]['numberOfLessons'] = 8  # Time
data['strands'][1]['subStrands'][4]['numberOfLessons'] = 8  # Money

# Strand 3.0 Geometry
data['strands'][2]['subStrands'][0]['numberOfLessons'] = 6  # Lines
data['strands'][2]['subStrands'][1]['numberOfLessons'] = 6  # Shapes

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print("Successfully updated Grade 1 Math JSON.")
