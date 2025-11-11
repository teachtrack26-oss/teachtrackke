# Manual Curriculum Extraction Guide

## Overview

This guide helps you manually extract CBC curriculum from the text files into JSON format.

## Tools You Have

1. **extract_text_only.py** - Extracts PDF text to .txt file
2. **grade-9-mathematics-SAMPLE.json** - Example JSON structure with 2 sub-strands
3. **EXTRACTION_PROMPT.md** - Complete documentation of required fields
4. **import_curriculum_json.py** - Imports completed JSON to database

## Quick Start

### Step 1: Extract PDF Text (DONE ✓)

```bash
python extract_text_only.py curiculum/Grade-9-Mathematics.pdf
# Output: curiculum/Grade-9-Mathematics_extracted.txt
```

### Step 2: Structure the Data

Open `Grade-9-Mathematics_extracted.txt` and identify:

**Strands** (Main topics):

- Line 137: "STRAND: WHOLE NUMBERS"
- Line 351: "STRAND 2.0: ALGEBRA"
- Line 492: "STRAND 3.0: MEASUREMENTS"
- Line 837: "STRAND 4.0: GEOMETRY"

**Sub-strands** (Subtopics under each strand):

- Line 138: "Sub strand: Integers" (under Whole Numbers)
- Line 182: "Sub strand: Cubes and cube roots"
- Line 222: "Sub strand: Matrix"
- etc.

### Step 3: Extract Data for Each Sub-Strand

For each sub-strand, extract these 9 fields:

#### 1. Sub-Strand Number & Name

Example: "1.1 INTEGERS"

#### 2. Number of Lessons

Look for "(X LESSONS)" in the table
Example: "(5 LESSONS)"

#### 3. Specific Learning Outcomes

Lines starting with letters (a, b, c, d, e)
Example:

```
a) perform basic operations on Integers in different situations
b) work out combined Operations on Integers in different situations
```

#### 4. Suggested Learning Experiences

Lines with bullet points (●) in "Suggested Learning Experiences" column
Example:

```
● discuss and work out basic operations on integers using number cards
● work out combined operations of integers in the correct order
```

#### 5. Key Inquiry Questions

Numbered questions (1., 2., 3.) in "Suggested Key Inquiry Question(s)" column
Example:

```
1. How do we carry out operations of integers in real life situations?
2. How do we apply integers in daily activities?
```

#### 6. Core Competencies

Found in "Core Competencies to be developed" section (usually next page)
Example:

```
Critical thinking and problem solving- interpretation and inference: as learners work out...
Learning to learn- organizing own learning; as learners carry out activities...
```

#### 7. Values

Found in "Values" section
Example:

```
Respect; as learners work in pairs/groups to carry out activities...
Unity; as learners work towards achieving set goals...
```

#### 8. PCIs (Pertinent and Contemporary Issues)

Found in "PCIs" section
Example:

```
Environmental education; as learners read temperature changes...
```

#### 9. Link to Other Subjects

Found in "Link to other subjects" section
Example:

```
Learners discuss in groups using language skills on how to work out...
```

### Step 4: Create JSON Structure

Use this template for each strand:

```json
{
  "strandNumber": "1.0",
  "strandName": "WHOLE NUMBERS",
  "subStrands": [
    {
      "subStrandNumber": "1.1",
      "subStrandName": "INTEGERS",
      "numberOfLessons": 5,
      "specificLearningOutcomes": ["outcome 1", "outcome 2", ...],
      "suggestedLearningExperiences": ["experience 1", "experience 2", ...],
      "keyInquiryQuestions": ["question 1", "question 2", ...],
      "coreCompetencies": ["competency 1", "competency 2", ...],
      "values": ["value 1", "value 2", ...],
      "pcis": ["pci 1", "pci 2", ...],
      "linkToOtherSubjects": ["link 1", "link 2", ...]
    }
  ]
}
```

### Step 5: Complete File Structure

Wrap all strands in this structure:

```json
{
  "subject": "Mathematics",
  "grade": "Grade 9",
  "educationLevel": "Junior Secondary",
  "strands": [
    { strand 1 data },
    { strand 2 data },
    { strand 3 data },
    { strand 4 data }
  ]
}
```

### Step 6: Validate & Import

```bash
# Test import (will check JSON structure)
python import_curriculum_json.py curiculum/grade-9-mathematics.json

# Check database
mysql -u root -p teachtrack -e "SELECT * FROM curriculum_templates;"
```

## Grade 9 Mathematics Structure

Based on the extracted text:

**Strand 1: WHOLE NUMBERS**

- 1.1 Integers (5 lessons)
- 1.2 Cubes and Cube Roots (5 lessons)
- 1.3 Indices and Exponents (? lessons)
- 1.4 Compound Interest (? lessons)

**Strand 2: ALGEBRA**

- 2.1 Matrices (? lessons)
- 2.2 Equations (? lessons)
- 2.3 Linear Programming (? lessons)

**Strand 3: MEASUREMENTS**

- 3.1 Area (? lessons)
- 3.2 Volume of Solids (? lessons)
- 3.3 Weight and Mass (? lessons)
- 3.4 Distance and Speed (? lessons)
- 3.5 Money (? lessons)
- 3.6 Estimation and Errors (? lessons)

**Strand 4: GEOMETRY**

- (Sub-strands to be identified)

**Estimated Total**: 4 strands, ~15-20 sub-strands, ~60-80 lessons

## Tips for Efficient Extraction

1. **Use Find/Replace**: Copy text blocks and clean up formatting
2. **Watch for Line Breaks**: PDF extraction sometimes splits sentences
3. **Consistent Formatting**: Keep array items clean (no extra spaces)
4. **Check Numbers**: Verify lesson counts add up correctly
5. **Save Frequently**: JSON syntax errors are common

## Common Issues

**Issue**: Text split across lines

```
"discuss and work out basic
operations on integers"
```

**Fix**: Join into one line

```
"discuss and work out basic operations on integers"
```

**Issue**: Missing lesson count
**Fix**: Count the outcomes or check the strand introduction

**Issue**: Duplicate content
**Fix**: Some sections repeat - use only the main content table

## Time Estimate

- **Full manual extraction**: 2-3 hours per curriculum
- **Sample (1-2 strands)**: 30-45 minutes
- **Using AI assistance**: 15-30 minutes (paste text to ChatGPT/Claude with prompt)

## Alternative: AI-Assisted Extraction

If manual extraction is too time-consuming:

1. Copy strand text from extracted .txt file
2. Go to ChatGPT, Claude, or Gemini (free)
3. Paste this prompt:

   ```
   Extract this CBC curriculum strand into JSON format with these fields:
   - specificLearningOutcomes (array)
   - suggestedLearningExperiences (array)
   - keyInquiryQuestions (array)
   - coreCompetencies (array)
   - values (array)
   - pcis (array)
   - linkToOtherSubjects (array)

   [PASTE STRAND TEXT HERE]
   ```

4. Copy JSON response
5. Add to main curriculum file

## Next Steps After Extraction

1. Import to database: `python import_curriculum_json.py grade-9-mathematics.json`
2. Verify in database: Check curriculum_templates, template_strands, template_substrands
3. Test frontend: Teachers should see "Grade 9 Mathematics" in curriculum selector
4. Extract 2 more curriculums for testing
5. Deploy to production
