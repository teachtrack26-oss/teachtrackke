#!/usr/bin/env python3
"""
Manual extraction of Grade 7 Mathematics curriculum from extracted text
"""

import json
import re

def extract_grade7_mathematics():
    """Extract Grade 7 Mathematics curriculum manually"""
    
    curriculum = {
        "subject": "Mathematics",
        "grade": "Grade 7",
        "educationLevel": "Junior Secondary",
        "strands": []
    }
    
    # Define the strands based on the structure observed
    strands_data = [
        {
            "strandNumber": "1.0",
            "strandName": "NUMBERS",
            "subStrands": [
                {"number": "1.1", "name": "Whole Numbers", "lessons": 20},
                {"number": "1.2", "name": "Factors", "lessons": 8},
                {"number": "1.3", "name": "Fractions", "lessons": 12},
                {"number": "1.4", "name": "Decimals", "lessons": 8},
                {"number": "1.5", "name": "Squares and Square Roots", "lessons": 6}
            ]
        },
        {
            "strandNumber": "2.0", 
            "strandName": "ALGEBRA",
            "subStrands": [
                {"number": "2.1", "name": "Algebraic Expressions", "lessons": 8},
                {"number": "2.2", "name": "Linear Equations", "lessons": 10},
                {"number": "2.3", "name": "Linear Inequalities", "lessons": 6}
            ]
        },
        {
            "strandNumber": "3.0",
            "strandName": "MEASUREMENTS", 
            "subStrands": [
                {"number": "3.1", "name": "Pythagorean Relationship", "lessons": 6},
                {"number": "3.2", "name": "Length", "lessons": 4},
                {"number": "3.3", "name": "Area", "lessons": 8},
                {"number": "3.4", "name": "Volume and Capacity", "lessons": 8},
                {"number": "3.5", "name": "Time, Distance and Speed", "lessons": 6},
                {"number": "3.6", "name": "Temperature", "lessons": 4},
                {"number": "3.7", "name": "Money", "lessons": 6}
            ]
        },
        {
            "strandNumber": "4.0",
            "strandName": "GEOMETRY",
            "subStrands": [
                {"number": "4.1", "name": "Angles", "lessons": 8},
                {"number": "4.2", "name": "Geometrical Constructions", "lessons": 8}
            ]
        },
        {
            "strandNumber": "5.0",
            "strandName": "DATA HANDLING AND PROBABILITY",
            "subStrands": [
                {"number": "5.1", "name": "Data handling", "lessons": 10}
            ]
        }
    ]
    
    # Add detailed content for first strand (Numbers) as example
    numbers_strand = {
        "strandNumber": "1.0",
        "strandName": "NUMBERS",
        "subStrands": [
            {
                "subStrandNumber": "1.1",
                "subStrandName": "Whole Numbers",
                "numberOfLessons": 20,
                "specificLearningOutcomes": [
                    "use place value and total value of digits up to hundreds of millions in real life",
                    "read and write numbers in symbols up to hundreds of millions in real life situations", 
                    "read and write numbers in words up to millions for fluency",
                    "round off numbers up to the nearest hundreds of millions in real life situations",
                    "classify natural numbers as even, odd and prime in different situations",
                    "apply operations of whole numbers in real life situations",
                    "identify number sequence in different situations", 
                    "create number sequence for playing number games",
                    "appreciate use of whole numbers in real life situations"
                ],
                "suggestedLearningExperiences": [
                    "identify and write place value and total value of digits using place value apparatus",
                    "read and write numbers in symbols on number cards or charts",
                    "read and write numbers in words on number cards or charts and practice writing dummy cheques for different sums of money",
                    "prepare and use place value charts to round off numbers",
                    "play a number game, make number cards, sort and classify numbers according to those that are even, odd or prime",
                    "work out or perform 2, 3 or more combined operations in the correct order using digital devices",
                    "identify the number patterns to work out number sequences",
                    "play games of creating number puzzles that involve number sequences using IT devices or other materials"
                ],
                "keyInquiryQuestions": [
                    "Why do we write numbers in words and/or symbols?",
                    "Where do we write numbers in words or symbols?"
                ],
                "coreCompetencies": [
                    "Communication and collaboration: Speaking, listening and team work as learners work in pairs or groups to prepare and use place value charts to round off numbers",
                    "Critical thinking and problem solving: Interpretation and inference as learners work together to identify number patterns", 
                    "Creativity and Imagination: Making observations as learners play games of creating number puzzles that involve number sequences"
                ],
                "values": [
                    "Unity: as learners work together to identify number patterns",
                    "Responsibility: taking care of digital devices when working out operations",
                    "Patriotism: appreciating the use of whole numbers in real life situations in Kenya"
                ],
                "pcis": [
                    "Financial Literacy: when learners practice writing dummy cheques for different sums of money",
                    "Education for Sustainable Development: when learners appreciate the use of whole numbers in real life situations"
                ],
                "linkToOtherSubjects": [
                    "Science and Technology: when learners use digital devices to work out operations",
                    "Social Studies: when learners appreciate the use of whole numbers in real life situations in Kenya"
                ]
            }
        ]
    }
    
    # For now, start with just the Numbers strand fully detailed
    curriculum["strands"] = [numbers_strand]
    
    # Add placeholder for other strands (to be filled later)
    for i, strand_info in enumerate(strands_data[1:], 2):
        strand = {
            "strandNumber": strand_info["strandNumber"],
            "strandName": strand_info["strandName"], 
            "subStrands": []
        }
        
        for substrand_info in strand_info["subStrands"]:
            substrand = {
                "subStrandNumber": substrand_info["number"],
                "subStrandName": substrand_info["name"],
                "numberOfLessons": substrand_info["lessons"],
                "specificLearningOutcomes": [
                    f"Placeholder learning outcome for {substrand_info['name']}"
                ],
                "suggestedLearningExperiences": [
                    f"Placeholder learning experience for {substrand_info['name']}"
                ],
                "keyInquiryQuestions": [
                    f"What are the key concepts in {substrand_info['name']}?"
                ],
                "coreCompetencies": [
                    "Communication and collaboration",
                    "Critical thinking and problem solving"
                ],
                "values": [
                    "Unity",
                    "Responsibility"
                ],
                "pcis": [
                    "Education for Sustainable Development"
                ],
                "linkToOtherSubjects": [
                    "Science and Technology"
                ]
            }
            strand["subStrands"].append(substrand)
        
        curriculum["strands"].append(strand)
    
    return curriculum

def main():
    print("🔍 Creating Grade 7 Mathematics curriculum JSON...")
    
    curriculum = extract_grade7_mathematics()
    
    # Save to JSON file
    output_file = "G7/grade-7-mathematics.json"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(curriculum, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Grade 7 Mathematics curriculum saved to: {output_file}")
    print(f"📊 Created curriculum with {len(curriculum['strands'])} strands")
    
    # Count total substrands
    total_substrands = sum(len(strand['subStrands']) for strand in curriculum['strands'])
    print(f"📚 Total substrands: {total_substrands}")

if __name__ == "__main__":
    main()