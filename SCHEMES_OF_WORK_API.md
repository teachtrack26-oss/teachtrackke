# Professional Records - Schemes of Work Implementation

## Overview

Complete backend implementation for Schemes of Work management system following CBC curriculum guidelines.

## Database Schema

### Tables Created

#### 1. `schemes_of_work`

Main table for scheme of work documents.

**Columns:**

- `id` - Primary key
- `user_id` - Foreign key to users table
- `subject_id` - Foreign key to subjects table
- `teacher_name` - Teacher's full name
- `school` - School name
- `term` - Term identifier (e.g., "Term 1", "Term 2", "Term 3")
- `year` - Academic year
- `subject` - Subject name
- `grade` - Grade level
- `total_weeks` - Total number of weeks in the scheme
- `total_lessons` - Total number of lessons planned
- `status` - Scheme status: 'draft', 'active', or 'completed'
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Indexes:**

- `idx_user_subject` - (user_id, subject_id)
- `idx_term_year` - (term, year)
- `idx_status` - (status)

#### 2. `scheme_weeks`

Weeks within a scheme of work.

**Columns:**

- `id` - Primary key
- `scheme_id` - Foreign key to schemes_of_work
- `week_number` - Week number (1-14 typically)
- `created_at` - Timestamp

**Indexes:**

- `idx_scheme_week` - (scheme_id, week_number)

#### 3. `scheme_lessons`

Individual lessons within each week.

**Columns:**

- `id` - Primary key
- `week_id` - Foreign key to scheme_weeks
- `lesson_number` - Lesson number within the week
- `strand` - Main curriculum strand
- `sub_strand` - Specific substrand
- `specific_learning_outcomes` - Learning outcomes (multiline text)
- `key_inquiry_questions` - Inquiry questions (multiline text)
- `learning_experiences` - Activities learners engage in (multiline text)
- `learning_resources` - Required materials and resources
- `assessment_methods` - How learning will be evaluated
- `reflection` - Teacher reflection (filled after teaching)
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Indexes:**

- `idx_week_lesson` - (week_id, lesson_number)

## API Endpoints

### Base URL: `/api/v1`

### 1. Create Scheme of Work

**POST** `/schemes`

Creates a new scheme of work with weeks and lessons.

**Request Body:**

```json
{
  "subject_id": 1,
  "teacher_name": "John Doe",
  "school": "Sunshine Academy",
  "term": "Term 1",
  "year": 2025,
  "subject": "Mathematics",
  "grade": "Grade 7",
  "total_weeks": 14,
  "total_lessons": 56,
  "status": "draft",
  "weeks": [
    {
      "week_number": 1,
      "lessons": [
        {
          "lesson_number": 1,
          "strand": "Numbers",
          "sub_strand": "Whole Numbers",
          "specific_learning_outcomes": "By the end of the lesson, the learner should be able to:\na. Identify whole numbers\nb. Order whole numbers\nc. Compare whole numbers",
          "key_inquiry_questions": "What are whole numbers?\nHow do we compare numbers?",
          "learning_experiences": "The learner is guided to:\n● Count objects\n● Arrange numbers in order\n● Use number lines",
          "learning_resources": "Number charts, counters, textbooks",
          "assessment_methods": "Oral questions, Written work, Observation",
          "reflection": ""
        }
      ]
    }
  ]
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "user_id": 1,
  "subject_id": 1,
  "teacher_name": "John Doe",
  "school": "Sunshine Academy",
  "term": "Term 1",
  "year": 2025,
  "subject": "Mathematics",
  "grade": "Grade 7",
  "total_weeks": 14,
  "total_lessons": 56,
  "status": "draft",
  "weeks": [...],
  "created_at": "2025-11-17T10:30:00",
  "updated_at": "2025-11-17T10:30:00"
}
```

### 2. Get All Schemes

**GET** `/schemes`

Retrieves all schemes for the current user.

**Query Parameters:**

- `subject_id` (optional) - Filter by subject
- `status` (optional) - Filter by status (draft, active, completed)

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "subject": "Mathematics",
    "grade": "Grade 7",
    "term": "Term 1",
    "year": 2025,
    "total_weeks": 14,
    "total_lessons": 56,
    "status": "active",
    "created_at": "2025-11-17T10:30:00"
  }
]
```

### 3. Get Specific Scheme

**GET** `/schemes/{scheme_id}`

Retrieves a specific scheme with all weeks and lessons.

**Response:** `200 OK`

```json
{
  "id": 1,
  "user_id": 1,
  "subject_id": 1,
  "teacher_name": "John Doe",
  "school": "Sunshine Academy",
  "term": "Term 1",
  "year": 2025,
  "subject": "Mathematics",
  "grade": "Grade 7",
  "total_weeks": 14,
  "total_lessons": 56,
  "status": "active",
  "weeks": [
    {
      "id": 1,
      "scheme_id": 1,
      "week_number": 1,
      "lessons": [
        {
          "id": 1,
          "week_id": 1,
          "lesson_number": 1,
          "strand": "Numbers",
          "sub_strand": "Whole Numbers",
          "specific_learning_outcomes": "...",
          "key_inquiry_questions": "...",
          "learning_experiences": "...",
          "learning_resources": "...",
          "assessment_methods": "...",
          "reflection": "",
          "created_at": "2025-11-17T10:30:00",
          "updated_at": "2025-11-17T10:30:00"
        }
      ],
      "created_at": "2025-11-17T10:30:00"
    }
  ],
  "created_at": "2025-11-17T10:30:00",
  "updated_at": "2025-11-17T10:30:00"
}
```

### 4. Update Scheme Metadata

**PUT** `/schemes/{scheme_id}`

Updates scheme header information and status.

**Request Body:**

```json
{
  "teacher_name": "Jane Smith",
  "school": "Updated School Name",
  "term": "Term 2",
  "year": 2025,
  "status": "active"
}
```

**Response:** `200 OK` - Returns updated scheme

### 5. Delete Scheme

**DELETE** `/schemes/{scheme_id}`

Deletes a scheme of work (cascades to weeks and lessons).

**Response:** `200 OK`

```json
{
  "message": "Scheme of work deleted successfully"
}
```

### 6. Update Specific Lesson

**PUT** `/schemes/{scheme_id}/lessons/{lesson_id}`

Updates a specific lesson within a scheme.

**Request Body:**

```json
{
  "lesson_number": 1,
  "strand": "Numbers",
  "sub_strand": "Whole Numbers",
  "specific_learning_outcomes": "Updated outcomes...",
  "key_inquiry_questions": "Updated questions...",
  "learning_experiences": "Updated experiences...",
  "learning_resources": "Updated resources...",
  "assessment_methods": "Updated methods...",
  "reflection": "Lesson went well, students engaged"
}
```

**Response:** `200 OK` - Returns updated lesson

### 7. Get Schemes Statistics

**GET** `/schemes/stats`

Retrieves statistics about schemes of work.

**Response:** `200 OK`

```json
{
  "total_schemes": 5,
  "active_schemes": 3,
  "draft_schemes": 1,
  "completed_schemes": 1
}
```

## Models (SQLAlchemy)

### SchemeOfWork

```python
class SchemeOfWork(Base):
    __tablename__ = 'schemes_of_work'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    subject_id = Column(Integer, ForeignKey('subjects.id'))
    teacher_name = Column(String(255))
    school = Column(String(255))
    term = Column(String(50))
    year = Column(Integer)
    subject = Column(String(100))
    grade = Column(String(20))
    total_weeks = Column(Integer)
    total_lessons = Column(Integer)
    status = Column(String(20), default='draft')
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)

    # Relationships
    user = relationship("User")
    subject_rel = relationship("Subject")
    weeks = relationship("SchemeWeek", cascade="all, delete-orphan")
```

### SchemeWeek

```python
class SchemeWeek(Base):
    __tablename__ = 'scheme_weeks'
    id = Column(Integer, primary_key=True)
    scheme_id = Column(Integer, ForeignKey('schemes_of_work.id'))
    week_number = Column(Integer)
    created_at = Column(TIMESTAMP)

    scheme = relationship("SchemeOfWork", back_populates="weeks")
    lessons = relationship("SchemeLesson", cascade="all, delete-orphan")
```

### SchemeLesson

```python
class SchemeLesson(Base):
    __tablename__ = 'scheme_lessons'
    id = Column(Integer, primary_key=True)
    week_id = Column(Integer, ForeignKey('scheme_weeks.id'))
    lesson_number = Column(Integer)
    strand = Column(String(255))
    sub_strand = Column(String(255))
    specific_learning_outcomes = Column(Text)
    key_inquiry_questions = Column(Text)
    learning_experiences = Column(Text)
    learning_resources = Column(Text)
    assessment_methods = Column(Text)
    reflection = Column(Text)
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)

    week = relationship("SchemeWeek", back_populates="lessons")
```

## Pydantic Schemas

All request/response schemas are defined in `schemas.py`:

- `SchemeLessonBase`, `SchemeLessonCreate`, `SchemeLessonResponse`
- `SchemeWeekBase`, `SchemeWeekCreate`, `SchemeWeekResponse`
- `SchemeOfWorkBase`, `SchemeOfWorkCreate`, `SchemeOfWorkUpdate`, `SchemeOfWorkResponse`
- `SchemeOfWorkSummary` (for list views)

## Authentication

All endpoints require authentication via JWT bearer token:

```
Authorization: Bearer <access_token>
```

## Migration

To apply the database migration:

```bash
cd backend
python apply_professional_records_migration.py
```

## Testing Endpoints

### Using cURL:

1. **Login to get token:**

```bash
curl -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@school.com","password":"password123"}'
```

2. **Create scheme:**

```bash
curl -X POST http://localhost:8000/api/v1/schemes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d @scheme_data.json
```

3. **Get all schemes:**

```bash
curl -X GET http://localhost:8000/api/v1/schemes \
  -H "Authorization: Bearer <token>"
```

4. **Get specific scheme:**

```bash
curl -X GET http://localhost:8000/api/v1/schemes/1 \
  -H "Authorization: Bearer <token>"
```

5. **Get statistics:**

```bash
curl -X GET http://localhost:8000/api/v1/schemes/stats \
  -H "Authorization: Bearer <token>"
```

## Next Steps

1. **Frontend Integration:**

   - Create scheme generator UI
   - Build form for creating schemes from curriculum
   - Implement PDF export using HTML template

2. **Lesson Plans:**

   - Add lesson plan models and endpoints
   - Link lesson plans to scheme lessons
   - Generate lesson plans from schemes

3. **Records of Work:**
   - Add records tracking models and endpoints
   - Link to taught lessons
   - Weekly/monthly reporting

## Files Modified/Created

### Backend:

- ✅ `backend/models.py` - Added SchemeOfWork, SchemeWeek, SchemeLesson models
- ✅ `backend/schemas.py` - Added scheme-related schemas
- ✅ `backend/main.py` - Added 7 API endpoints for schemes
- ✅ `backend/apply_professional_records_migration.py` - Migration script

### Database:

- ✅ `database/add_professional_records.sql` - Complete SQL schema for all professional records

### Frontend:

- ✅ `frontend/app/professional-records/page.tsx` - Professional records page with UI

## Status

✅ **Database Migration:** Complete
✅ **Backend Models:** Complete
✅ **API Endpoints:** Complete (7 endpoints)
✅ **Schemas:** Complete
⏳ **Frontend Integration:** UI ready, needs API integration
⏳ **PDF Generation:** Template ready, needs implementation
⏳ **Lesson Plans:** Pending
⏳ **Records of Work:** Pending
