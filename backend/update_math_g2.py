#!/usr/bin/env python3
"""
Update Mathematics Grade 2 - All Strands
Adds numberOfLessons, coreCompetencies, values, pcis, and linksToOtherSubjects
Total: 3 Strands, 14 Sub-strands, 150 Lessons
"""

import json

# Path to the JSON file
json_file = r"c:\Users\MKT\desktop\teachtrack\data\curriculum\G2\grade-2-math.json"

# Complete metadata for all sub-strands
updates = {
    # STRAND 1.0: NUMBERS (7 sub-strands)
    
    "1.1": {
        # Number Concept (8 lessons based on user data)
        "numberOfLessons": 8,
        "coreCompetencies": [
            "Digital Literacy: learner uses digital devices to play number games",
            "Learning to Learn: learner discovers ways of representing numbers as they match a group of objects to their number value"
        ],
        "values": [
            "Unity: learner respects peers' opinions as they in turn, discuss, choose, and play number games",
            "Responsibility: learner observes safety practices as they collect concrete objects for learning from the environment"
        ],
        "pcis": [
            "Social Cohesion: learner discusses, chooses, and plays number games in turns",
            "Safety Issues: learner observes safety as they collect concrete objects for learning from the environment"
        ],
        "linksToOtherSubjects": [
            "Environmental Activities: The learner relates the concept of using concrete objects from the environment to represent numbers to the concept of resources in the environment"
        ]
    },
    
    "1.2": {
        # Whole Numbers (20 lessons)
        "numberOfLessons": 20,
        "coreCompetencies": [
            "Creativity and Imagination: learner improvises place value apparatus by use of place value tins and pockets from locally available materials",
            "Communication and Collaboration: the learner discusses the place value of digits written on the number cards"
        ],
        "values": [
            "Unity: the learner, in turn, plays a game of putting number cards in place-value tins or pockets according to the place value of digits",
            "Responsibility: learner observes safety precautions as they use locally available materials to improvise place value tins and pockets"
        ],
        "pcis": [
            "Effective Communication: learner reads and writes numbers 1 to 100 in symbols in different situations",
            "Creative Thinking: learner improvises place value tins and pockets from locally available materials"
        ],
        "linksToOtherSubjects": [
            "English Language Activities: The learner relates the skills used in reading and writing numbers in symbols to reading and writing skills",
            "Creative Activities: The learner relates the skills used in making number patterns to the concept of patterns"
        ]
    },
    
    "1.3": {
        # Addition (20 lessons)
        "numberOfLessons": 20,
        "coreCompetencies": [
            "Communication and Collaboration: The learner speaks and listens to peers as they discuss different ways of adding two 2-digit numbers without and with regrouping",
            "Learning to Learn: learner discovers ways of presenting addition as they write addition statements in horizontal and vertical forms"
        ],
        "values": [
            "Social Justice: learner accommodates others as they play games involving addition",
            "Unity: The learner discusses and comes up with different ways of adding two 2-digit numbers without and with regrouping"
        ],
        "pcis": [
            "Critical Thinking: learner works out missing numbers in patterns involving addition",
            "Friendship Formation: learner plays games with peers involving addition using different resources"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: The learner relates the skills used in making patterns to the concept of patterns",
            "English Language Activities: The learner relates the skills used in writing additional sentences in horizontal and vertical forms to functional writing"
        ]
    },
    
    "1.4": {
        # Subtraction (20 lessons)
        "numberOfLessons": 20,
        "coreCompetencies": [
            "Learning to Learn: the learner discovers steps of subtracting a 2-digit number from a 2-digit number with regrouping using place value apparatus",
            "Critical Thinking: learner discusses and works out missing numbers in patterns involving subtraction up to 100"
        ],
        "values": [
            "Unity: learner collaborates as they discuss and work out missing numbers in patterns involving subtraction up to 100",
            "Social Justice: The learner accommodates peers as they discuss and work out missing numbers in patterns involving subtraction"
        ],
        "pcis": [
            "Social Cohesion: learner jointly with others discusses and works out missing numbers in patterns involving subtraction up to 100",
            "Critical Thinking: learner subtracts a 2-digit number from a 2-digit number with regrouping using place value apparatus"
        ],
        "linksToOtherSubjects": [
            "English Language Activities: The learner relates the skills used in discussion to speaking and listening skills"
        ]
    },
    
    "1.5": {
        # Multiplication (12 lessons)
        "numberOfLessons": 12,
        "coreCompetencies": [
            "Digital Literacy: learner uses digital devices to play games involving multiplication",
            "Critical Thinking and Problem-solving: learner uses locally available materials to model a multiplication chart"
        ],
        "values": [
            "Responsibility: learner shares resources amicably as they model a multiplication chart",
            "Patriotism: learner participates in community activities as they visit the local market and assist in grouping items for sale"
        ],
        "pcis": [
            "Financial Literacy: the learner visits the local market to see how fruits and other items are arranged in groups for selling",
            "Community Involvement: the learner visits the local market to assist in grouping items for sale"
        ],
        "linksToOtherSubjects": [
            "Environmental Activities: The learner relates the skills used in improvising learning materials to waste management skills"
        ]
    },
    
    "1.6": {
        # Division (8 lessons)
        "numberOfLessons": 8,
        "coreCompetencies": [
            "Learning to Learn: learner learns to organise numbers up to 25 into groups of 4 or 5 without a remainder",
            "Digital Literacy: learner uses digital devices to play games involving division"
        ],
        "values": [
            "Love: the learner shares a given number of objects equally by each picking one object at a time until all the objects are finished",
            "Unity: learner works harmoniously in teams as they place objects together"
        ],
        "pcis": [
            "Positive Discipline: learner works harmoniously in teams as they place and share objects",
            "Social Cohesion: learner plays games involving division using digital devices or other resources with peers"
        ],
        "linksToOtherSubjects": [
            "English Language Activities: The learner relates the skills of writing division statements to functional writing",
            "Religious Activities: The learner relates the concept of equal sharing to the concept of values"
        ]
    },
    
    "1.7": {
        # Fractions (12 lessons)
        "numberOfLessons": 12,
        "coreCompetencies": [
            "Learning to Learn: the learner identifies halves and quarters as part of a whole in different situations",
            "Self-efficacy: learner practises making halves and quarters of a whole from paper cut-outs"
        ],
        "values": [
            "Responsibility: learner observes safety as they use scissors to make circular paper cut-outs",
            "Unity: learner collaborates with peers as they use digital devices to play games involving fractions"
        ],
        "pcis": [
            "Life Skills: learner uses fractions in day-to-day activities",
            "Self-esteem: learner practises making halves and quarters of a whole from paper cut-outs"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: The learner can relate the skills of making halves and quarters of a whole from paper cut-outs to pattern and modelling skills"
        ]
    },
    
    # STRAND 2.0: MEASUREMENT (5 sub-strands)
    # Based on summary table: Length-10, Mass-10, Capacity-12, Time-8, Money-8
    
    "2.1": {
        # Length (10 lessons)
        "numberOfLessons": 10,
        "coreCompetencies": [
            "Learning to Learn: learner discovers methods of measuring length using fixed units",
            "Creativity and Imagination: learner uses locally available materials to make 1-metre sticks"
        ],
        "values": [
            "Unity: learner collaborates with peers in teams to make 1-metre sticks and measure objects",
            "Responsibility: learner records measurements accurately and discusses them with peers"
        ],
        "pcis": [
            "Life Skills: learner measures the length of different objects at home and school",
            "Critical Thinking: learner compares measurements using different length units"
        ],
        "linksToOtherSubjects": [
            "Environmental Activities: The learner relates measuring length to understanding distances in the environment",
            "Creative Activities: The learner uses measuring skills when creating objects"
        ]
    },
    
    "2.2": {
        # Mass (10 lessons)
        "numberOfLessons": 10,
        "coreCompetencies": [
            "Creativity and Imagination: learner uses locally available materials to make an improvised beam balance",
            "Learning to Learn: learner discovers ways to measure mass using fixed units"
        ],
        "values": [
            "Unity: learner works with peers to make improvised beam balances",
            "Patriotism: learner participates in community activities by visiting shops and markets to assist vendors"
        ],
        "pcis": [
            "Financial Literacy: learner assists vendors in measuring the mass of items for sale",
            "Community Involvement: learner visits shops or markets and engages with vendors"
        ],
        "linksToOtherSubjects": [
            "Environmental Activities: The learner collects safe materials from the environment for measuring mass",
            "Creative Activities: The learner improvises beam balances using available materials"
        ]
    },
    
    "2.3": {
        # Capacity (12 lessons)
        "numberOfLessons": 12,
        "coreCompetencies": [
            "Learning to Learn: learner discovers the relationship between container sizes and capacity",
            "Communication and Collaboration: learner discusses and measures capacity in teams"
        ],
        "values": [
            "Responsibility: learner uses water properly to avoid wetting floors during measurement activities",
            "Unity: learner participates in team activities involving measuring liquids"
        ],
        "pcis": [
            "Environmental Education: learner uses water carefully during capacity measurement activities",
            "Life Skills: learner participates in activities involving measuring liquids such as milk and water"
        ],
        "linksToOtherSubjects": [
            "Environmental Activities: The learner relates measuring capacity to understanding water as a resource",
            "Creative Activities: The learner uses containers of different shapes for measuring"
        ]
    },
    
    "2.4": {
        # Time (8 lessons)
        "numberOfLessons": 8,
        "coreCompetencies": [
            "Communication and Collaboration: learner discusses special occasions and relates them to months of the year",
            "Digital Literacy: learner reads time from both analogue and digital clocks"
        ],
        "values": [
            "Responsibility: learner appreciates the importance of keeping time for different activities",
            "Unity: learner works with peers to discuss how to read, tell, and write dates"
        ],
        "pcis": [
            "Life Skills: learner develops time management skills through understanding calendars and clocks",
            "Social Cohesion: learner discusses special occasions that take place in different months"
        ],
        "linksToOtherSubjects": [
            "Environmental Activities: The learner relates time measurement using shadows to natural environment",
            "English Language Activities: The learner reads and writes dates and time in words"
        ]
    },
    
    "2.5": {
        # Money (8 lessons)
        "numberOfLessons": 8,
        "coreCompetencies": [
            "Digital Literacy: learner records videos during role play of classroom shopping activities",
            "Communication and Collaboration: learner works collaboratively to make currency cut-outs"
        ],
        "values": [
            "Unity: learner works in teams to make and sort currency cut-outs",
            "Responsibility: learner appreciates the use of money in buying items"
        ],
        "pcis": [
            "Financial Literacy: learner identifies and counts Kenyan currency denominations",
            "Life Skills: learner practices buying items through role play activities"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: The learner makes paper cut-outs of coins and notes",
            "English Language Activities: The learner reads and writes money amounts"
        ]
    },
    
    # STRAND 3.0: GEOMETRY (2 sub-strands)
    # Based on summary table: Lines-6, Shapes-6
    
    "3.1": {
        # Lines (6 lessons)
        "numberOfLessons": 6,
        "coreCompetencies": [
            "Creativity and Imagination: learner safely models straight and curved lines using various materials",
            "Digital Literacy: learner uses digital devices to draw lines and share with peers"
        ],
        "values": [
            "Responsibility: learner observes safety when modelling lines using sticks, plasticine/clay, or strings",
            "Unity: learner shares line drawings with peers"
        ],
        "pcis": [
            "Safety Issues: learner safely handles materials when modelling lines",
            "Creative Thinking: learner models lines in different ways using available materials"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: The learner relates modelling lines to art and craft skills",
            "Environmental Activities: The learner recognises lines in the real-life environment"
        ]
    },
    
    "3.2": {
        # Shapes (6 lessons)
        "numberOfLessons": 6,
        "coreCompetencies": [
            "Learning to Learn: learner identifies different shapes in the environment",
            "Digital Literacy: learner plays games involving pattern-making using digital devices"
        ],
        "values": [
            "Unity: learner shares shape drawings and patterns with peers",
            "Responsibility: learner displays shapes in the learning environment"
        ],
        "pcis": [
            "Creative Thinking: learner makes patterns using triangles, rectangles, squares, circles, and ovals",
            "Social Cohesion: learner plays games involving pattern-making with peers"
        ],
        "linksToOtherSubjects": [
            "Creative Activities: The learner relates shapes to patterns in fabrics and art",
            "Environmental Activities: The learner recognises shapes of objects in the classroom and environment"
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
        strand_title = strand['strandTitle']
        print(f"\n📚 Processing Strand: {strand['strandId']} {strand_title}")
        
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
                print(f"  ✅ {sub_id}: {sub_strand['subStrandTitle']} - {update_data['numberOfLessons']} lessons")
    
    # Write back to file
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*60}")
    print(f"MATHEMATICS GRADE 2 - UPDATE COMPLETE!")
    print(f"{'='*60}")
    print(f"Updated: {updated_count} sub-strands")
    print(f"Total lessons: {total_lessons}")
    
    # Breakdown
    print(f"\nBreakdown:")
    print(f"  Strand 1.0 Numbers: 7 sub-strands")
    print(f"    1.1 Number Concept: 8 lessons")
    print(f"    1.2 Whole Numbers: 20 lessons")
    print(f"    1.3 Addition: 20 lessons")
    print(f"    1.4 Subtraction: 20 lessons")
    print(f"    1.5 Multiplication: 12 lessons")
    print(f"    1.6 Division: 8 lessons")
    print(f"    1.7 Fractions: 12 lessons")
    print(f"    Subtotal: 100 lessons")
    print(f"  Strand 2.0 Measurement: 5 sub-strands")
    print(f"    2.1 Length: 10 lessons")
    print(f"    2.2 Mass: 10 lessons")
    print(f"    2.3 Capacity: 12 lessons")
    print(f"    2.4 Time: 8 lessons")
    print(f"    2.5 Money: 8 lessons")
    print(f"    Subtotal: 48 lessons")
    print(f"  Strand 3.0 Geometry: 2 sub-strands")
    print(f"    3.1 Lines: 6 lessons")
    print(f"    3.2 Shapes: 6 lessons")
    print(f"    Subtotal: 12 lessons")
    print(f"\n  GRAND TOTAL: {100 + 48 + 12} lessons")
    print(f"{'='*60}")

if __name__ == "__main__":
    update_json()
