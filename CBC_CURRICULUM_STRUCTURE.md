# CBC Curriculum Structure Analysis

## Verified Structure from Sample PDFs

### ✅ CONFIRMED: All Fields Present in CBC Curriculum Documents

Based on analysis of:

- Grade 9 Mathematics (61 pages)
- Grade 8 Agriculture & Nutrition (34 pages)

---

## Main Table Structure

Each curriculum contains tables with these columns:

### 1. **Strand**

- Format: "1.0", "2.0", "3.0", etc.
- Example: "1.0 NUMBERS"
- Top-level grouping of related content

### 2. **Sub-Strand**

- Format: "1.1", "1.2", "2.1", etc.
- Number of lessons in parentheses: "(5 LESSONS)", "(10 lessons)"
- Example: "1.2 CUBES AND CUBE ROOTS (5 LESSONS)"

### 3. **Specific Learning Outcomes**

- Starts with: "By the end of the sub-strand the learner should be able to:"
- Listed as a), b), c), d), etc.
- Example:
  - a) Work out cubes of numbers by multiplication in real life situations
  - b) Determine cubes of numbers from mathematical tables
  - c) Apply cubes and cube roots in real life situations

### 4. **Suggested Learning Experiences**

- Starts with: "The learner is guided to:" or "Learners are guided to:"
- Bullet points describing activities
- Example:
  - use stacks of cubes to demonstrate the concept
  - demonstrate stacking of cubes
  - use IT devices to determine cube and cube roots

### 5. **Key Inquiry Questions**

- Format: "Suggested Key Inquiry Question(s)"
- Numbered questions: 1., 2., 3.
- Example:
  - 1. How do we work out the cubes of numbers?
  - 2. How do we work out the cube roots of numbers?
  - 3. Where do we apply cubes and cube roots in real life?

---

## Additional Sections (After Each Sub-Strand Table)

### 6. **Core Competencies to be Developed**

- Listed with bullet points
- Format: "Competency name - specific aspect; description"
- Example:
  - Critical thinking and problem solving - interpretation and inference; as learners work out combined operations
  - Communication and collaboration - speaking and listening; as learners work in groups
  - Digital literacy - interacting with technologies; as learners use IT devices

### 7. **Values**

- Bullet points listing values
- Example:
  - Respect; as learners appreciate each other's contribution
  - Unity; as learners work towards achieving set goals
  - Responsibility; as learners take their roles in turns

### 8. **Pertinent and Contemporary Issues (PCIs)**

- Full label: "PCIs" or "Pertinent and Contemporary Issues"
- Example:
  - Environmental education; as learners read temperature changes
  - Environmental awareness as learners explore school

### 9. **Link to Other Subjects**

- Full label: "Link to other subjects" or "Link to other learning areas"
- Example:
  - Learners discuss in groups using language skills from English
  - Learners use new terms in reading measurements as learnt in Languages
  - Learners express numbers as indices and powers as used in Integrated Science

---

## Data Extraction Plan

### For Each Subject + Grade Combination:

**Step 1: Extract Main Table Data**

```
- Strand Number (e.g., "1.0")
- Strand Name (e.g., "NUMBERS")
- Sub-Strand Number (e.g., "1.2")
- Sub-Strand Name (e.g., "CUBES AND CUBE ROOTS")
- Number of Lessons (e.g., 5)
- Specific Learning Outcomes (array of strings)
- Suggested Learning Experiences (array of strings)
- Key Inquiry Questions (array of strings)
```

**Step 2: Extract Supporting Data**

```
- Core Competencies (array of strings)
- Values (array of strings)
- PCIs (array of strings)
- Links to Other Subjects (array of strings)
```

---

## Database Schema Recommendation

```sql
-- Master curriculum templates
CREATE TABLE curriculum_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    subject VARCHAR(100) NOT NULL,
    grade VARCHAR(20) NOT NULL,
    education_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_subject_grade (subject, grade)
);

-- Strands
CREATE TABLE template_strands (
    id INT PRIMARY KEY AUTO_INCREMENT,
    curriculum_template_id INT NOT NULL,
    strand_number VARCHAR(10) NOT NULL,
    strand_name VARCHAR(200) NOT NULL,
    sequence_order INT,
    FOREIGN KEY (curriculum_template_id) REFERENCES curriculum_templates(id) ON DELETE CASCADE
);

-- Sub-strands with ALL fields
CREATE TABLE template_substrands (
    id INT PRIMARY KEY AUTO_INCREMENT,
    strand_id INT NOT NULL,
    substrand_number VARCHAR(10) NOT NULL,
    substrand_name VARCHAR(200) NOT NULL,
    number_of_lessons INT NOT NULL DEFAULT 1,

    -- Main content (JSON arrays)
    specific_learning_outcomes JSON,
    suggested_learning_experiences JSON,
    key_inquiry_questions JSON,

    -- Supporting content (JSON arrays)
    core_competencies JSON,
    values JSON,
    pcis JSON,
    links_to_other_subjects JSON,

    sequence_order INT,
    FOREIGN KEY (strand_id) REFERENCES template_strands(id) ON DELETE CASCADE
);
```

---

## Sample Data Structure (JSON)

```json
{
  "strand": "1.0",
  "strandName": "NUMBERS",
  "subStrands": [
    {
      "subStrandNumber": "1.2",
      "subStrandName": "CUBES AND CUBE ROOTS",
      "numberOfLessons": 5,
      "specificLearningOutcomes": [
        "Work out cubes of numbers by multiplication in real life situations",
        "Determine cubes of numbers from mathematical tables in different situations",
        "Determine cube roots of numbers by factor method in different situations"
      ],
      "suggestedLearningExperiences": [
        "use stacks of cubes to demonstrate the concept of cube and cube roots",
        "demonstrate stacking of cubes",
        "use IT devices to determine cube and cube roots of numbers"
      ],
      "keyInquiryQuestions": [
        "How do we work out the cubes of numbers?",
        "How do we work out the cube roots of numbers?",
        "Where do we apply cubes and cube roots in real life situations?"
      ],
      "coreCompetencies": [
        "Communication and collaboration - speaking and listening; as learners work in groups",
        "Imagination and creativity - open mindedness and creativity; as learners determine both the cube and cube root"
      ],
      "values": [
        "Respect; as learners appreciate each other's contribution in pairs/groups discussion"
      ],
      "pcis": [
        "Learners use stacks of cubes to demonstrate the concept, relate to objects in the environment"
      ],
      "linkToOtherSubjects": [
        "Learners use new terms in reading measurements of length in cubes as learnt in Languages"
      ]
    }
  ]
}
```

---

## ✅ VERIFICATION COMPLETE

**All requested fields are present in CBC curriculum documents:**

1. ✅ Strand
2. ✅ Sub-Strand
3. ✅ Specific Learning Outcomes
4. ✅ Suggested Learning Experiences
5. ✅ Key Inquiry Questions
6. ✅ Core Competencies to be Developed
7. ✅ Pertinent and Contemporary Issues (PCIs)
8. ✅ Values
9. ✅ Link to Other Subjects

**Structure is consistent across different subjects and grades.**

---

## Next Steps

1. **Manual Extraction**: Use pdfplumber to extract text from all curriculum PDFs
2. **Parse Tables**: Extract structured data from each sub-strand table
3. **Store in Database**: Populate curriculum_templates tables
4. **Teacher Interface**: Build subject/grade selector instead of PDF upload
