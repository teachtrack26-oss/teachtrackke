# AI/Curriculum Auto-Generation Implementation

## Overview

Implemented the automated Scheme of Work generation feature. This allows teachers to generate a full term's scheme of work based on the system's curriculum templates with a single click.

## Changes

1.  **Backend API (`backend/main.py`)**:

    - Added `POST /api/v1/schemes/generate` endpoint.
    - Implemented logic to:
      - Find the matching `CurriculumTemplate` for the requested Subject/Grade.
      - Iterate through `TemplateStrand` and `TemplateSubstrand`.
      - Flatten the curriculum into a list of lessons based on `number_of_lessons`.
      - Distribute lessons across `SchemeWeek`s based on `lessons_per_week`.
      - Create `SchemeOfWork`, `SchemeWeek`, and `SchemeLesson` records.

2.  **Data Models (`backend/schemas.py`)**:

    - Added `SchemeAutoGenerateRequest` schema to handle generation parameters.

3.  **Bug Fixes**:
    - Fixed `create_subject` to correctly handle `key_inquiry_questions` serialization (List -> JSON String) to prevent database errors.
    - Fixed `TemplateStrand` attribute access (`curriculum_template_id`).

## Usage

**Endpoint:** `POST /api/v1/schemes/generate`

**Payload:**

```json
{
  "subject_id": 123,
  "teacher_name": "John Doe",
  "school": "Academy",
  "term": "Term 1",
  "year": 2024,
  "subject": "Mathematics",
  "grade": "Grade 9",
  "total_weeks": 10,
  "lessons_per_week": 5
}
```

**Result:**
Returns the created `SchemeOfWork` object with all weeks and lessons populated.
