import json

# Clean Social Studies data - manually reconstructed from user's pasted content
data = {
    "subject": "Social Studies",
    "grade": "Grade 9",
    "educationLevel": "Junior Secondary",
    "strands": [
        {
            "strandNumber": "1.0",
            "strandName": "SOCIAL STUDIES AND CAREER DEVELOPMENT",
            "subStrands": [
                {
                    "subStrandNumber": "1.1",
                    "subStrandName": "Pathway Choices",
                    "numberOfLessons": 4,
                    "specificLearningOutcomes": [
                        "identify factors to consider in the selection of a pathway",
                        "examine requirements for Social sciences pathway at senior school",
                        "choose a possible track within a pathway at senior school",
                        "appreciate the need for choosing a pathway in senior school"
                    ],
                    "suggestedLearningExperiences": [
                        "brainstorm the meaning of a career path",
                        "engage a resource person to discuss factors to consider in the selection of a pathway",
                        "use digital devices/print materials to examine requirements for social science pathway",
                        "create and display charts with pathways and their respective requirements",
                        "create and display posters on pathways and their respective requirements using locally available resources",
                        "choose and journal possible tracks in a given pathway for academic growth",
                        "compose and recite poems on pathway choices"
                    ],
                    "keyInquiryQuestions": [
                        "Why is it important to learn about career paths?"
                    ],
                    "coreCompetencies": [
                        "Learning to learn: learners engage resource persons to discuss the factors to consider in making pre career choices for selection of pathways"
                    ],
                    "values": [
                        "Responsibility: learners demonstrate responsibility while using digital devices/print materials to examine requirements for social science pathway"
                    ],
                    "pcis": [
                        "Career Guidance as learners create and display charts with pathways and their respective requirements"
                    ],
                    "linkToOtherSubjects": [
                        "English/Kiswahili language: learners will use writing and reading while composing and reciting poems on the pathway choices"
                    ]
                },
                {
                    "subStrandNumber": "1.2",
                    "subStrandName": "Pre-career Support systems",
                    "numberOfLessons": 4,
                    "specificLearningOutcomes": [
                        "explore and use support systems for pre-career and other needs",
                        "analyze challenges arising from existing support systems for pre-career and other needs",
                        "design solutions to challenges arising from support systems",
                        "explain the significance of pre-career mapping for individual growth",
                        "appreciate the value of the pre-career support systems"
                    ],
                    "suggestedLearningExperiences": [
                        "using digital or printed materials search for the meaning and examples of support systems in the community",
                        "brainstorm on effective use of different support systems in the community",
                        "engage a resource person to discuss significance of pre-career mapping for individual growth",
                        "brainstorm on challenges arising from involvement in existing pre- career support systems",
                        "search for solutions to challenges arising from existing pre- career support systems",
                        "compose and recite poems highlighting the value of pre-career support system"
                    ],
                    "keyInquiryQuestions": [
                        "Why does a learner need pre-career support?"
                    ],
                    "coreCompetencies": [
                        "Creativity and Imagination: learners compose and recite poems creatively to highlight the value of pre-career support system"
                    ],
                    "values": [
                        "Responsibility: learners explore and use appropriate support system in the community"
                    ],
                    "pcis": [
                        "Career Guidance: Learners engage a resource person to discuss significance of pre-career mapping for individual growth"
                    ],
                    "linkToOtherSubjects": [
                        "All learning Areas: Learners explain the significance of pre-career mapping for individual growth"
                    ]
                }
            ]
        }
    ]
}

# Write to file
with open('../G9/grade 9 social studies_clean.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"✅ Created clean Social Studies JSON")
print(f"Subject: {data['subject']}")
print(f"Grade: {data['grade']}")
print(f"Strands: {len(data['strands'])}")
print(f"Note: This is a minimal version with 1 strand. Full version needs to be reconstructed from source.")
