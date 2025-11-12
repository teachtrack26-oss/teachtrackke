# Academic Scheduling Features - Implementation Summary

## Overview

The system now fully supports flexible academic term configuration and subject-specific scheduling to accommodate different schools' requirements.

## Features Implemented

### 1. Academic Terms Management

- **3 Terms per Academic Year**: Term 1 (longest), Term 2 (medium), Term 3 (shortest)
- **Configurable per User**: Each teacher can set their own term dates
- **Current Term Tracking**: Mark which term is currently active
- **Teaching Weeks**: Track the number of teaching weeks in each term

**Default Configuration (2025 Academic Year)**:

- **Term 1**: January 6 - April 4 (14 weeks)
- **Term 2**: May 5 - August 1 (12 weeks)
- **Term 3**: September 1 - November 21 (10 weeks)

### 2. Subject-Specific Scheduling

Each subject can have customized scheduling:

- **Lessons per Week**: Default 5, but can be 1-15 (e.g., Mathematics might have 7-8)
- **Single Lesson Duration**: 30, 35, or 40 minutes (customizable)
- **Double Lesson Duration**: 60, 70, or 80 minutes (customizable)
- **Double Lessons per Week**: 0, 1, or 2 double lessons (for practical work)

### 3. User-Level Defaults

Teachers can set their school's default lesson durations:

- Default single lesson duration (e.g., 40 minutes)
- Default double lesson duration (e.g., 80 minutes)

## Database Schema

### New/Updated Tables

#### `users` table (new columns):

```sql
default_lesson_duration INT DEFAULT 40
default_double_lesson_duration INT DEFAULT 80
```

#### `subjects` table (new columns):

```sql
lessons_per_week INT DEFAULT 5
single_lesson_duration INT DEFAULT 40
double_lesson_duration INT DEFAULT 80
double_lessons_per_week INT DEFAULT 0
```

#### `terms` table (new):

```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT (FK to users)
term_number INT (1, 2, or 3)
term_name VARCHAR(100)
academic_year VARCHAR(20)
start_date TIMESTAMP
end_date TIMESTAMP
teaching_weeks INT
is_current BOOLEAN
created_at, updated_at TIMESTAMP
```

## API Endpoints

### Term Management

#### `GET /api/v1/terms`

Get all terms for the current user

```json
{
  "terms": [
    {
      "id": 1,
      "term_number": 1,
      "term_name": "Term 1",
      "academic_year": "2025",
      "start_date": "2025-01-06T00:00:00",
      "end_date": "2025-04-04T23:59:59",
      "teaching_weeks": 14,
      "is_current": true
    }
  ]
}
```

#### `POST /api/v1/terms`

Create a new term

```json
{
  "term_number": 1,
  "term_name": "Term 1",
  "academic_year": "2025",
  "start_date": "2025-01-06T00:00:00",
  "end_date": "2025-04-04T23:59:59",
  "teaching_weeks": 14,
  "is_current": true
}
```

#### `PUT /api/v1/terms/{term_id}`

Update a term (dates, weeks, set as current)

#### `GET /api/v1/terms/current`

Get the currently active term

### Subject Scheduling

#### `GET /api/v1/subjects/{subject_id}/scheduling`

Get scheduling configuration for a subject

#### `PUT /api/v1/subjects/{subject_id}/scheduling`

Update scheduling for a subject

```json
{
  "lessons_per_week": 7,
  "single_lesson_duration": 40,
  "double_lesson_duration": 80,
  "double_lessons_per_week": 1
}
```

### User Settings

#### `PUT /api/v1/user/settings`

Update user's default lesson durations

```json
{
  "default_lesson_duration": 35,
  "default_double_lesson_duration": 70
}
```

## Frontend Pages

### 1. Settings Page (`/settings`)

- Configure default lesson durations
- View and manage academic terms
- Set current term

### 2. Subject Scheduling Page (`/curriculum/[id]/scheduling`)

- Configure lessons per week for specific subject
- Set single and double lesson durations
- Specify number of double lessons per week
- See weekly time summary

## Usage Examples

### Example 1: Mathematics Subject with 7 Lessons/Week

- Total lessons: 7 per week
- Single lesson: 40 minutes
- Double lesson: 80 minutes
- Double lessons per week: 1
- **Total weekly time**: (6 × 40) + (1 × 80) = 320 minutes (5.3 hours)

### Example 2: School with 35-Minute Lessons

- Set user default: 35 minutes (single), 70 minutes (double)
- All new subjects inherit these defaults
- Can override per subject as needed

### Example 3: Term Configuration

- **Term 1** (longest): 14 weeks of teaching
- **Term 2** (medium): 12 weeks of teaching
- **Term 3** (shortest): 10 weeks of teaching

## How to Use

1. **Configure School Settings**:

   - Go to `/settings`
   - Set your default lesson durations
   - Review and adjust term dates if needed

2. **Configure Subject Scheduling**:

   - From curriculum detail page, click "Configure Schedule" (or similar)
   - Navigate to `/curriculum/[id]/scheduling`
   - Set lessons per week
   - Adjust lesson durations if different from defaults
   - Set number of double lessons

3. **Set Current Term**:
   - Go to `/settings`
   - Click "Set as Current" on the active term
   - This helps track progress within the correct term

## Benefits

✅ **Flexible**: Accommodates different school schedules
✅ **Realistic**: Matches actual Kenyan school term structure
✅ **Customizable**: Per-subject and per-school configuration
✅ **Accurate**: Better time tracking and planning
✅ **User-Friendly**: Simple UI for configuration

## Migration

The database migration (`database/add_scheduling_features.sql`) has been applied:

- ✅ Added new columns to `users` and `subjects` tables
- ✅ Created `terms` table
- ✅ Inserted default terms for existing users
- ✅ All existing data preserved

## Next Steps (Optional Enhancements)

1. **Timetable Integration**: Use scheduling data to generate weekly timetables
2. **Progress Projections**: Calculate expected completion dates based on lessons/week
3. **Term Reports**: Generate term-specific progress reports
4. **Holiday Management**: Add school holidays within terms
5. **Multi-Year Support**: Extend to handle multiple academic years

---

**Status**: ✅ Fully Implemented and Tested
**Migration**: ✅ Applied Successfully
**Documentation**: ✅ Complete
