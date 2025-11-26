# TeachTrack CBC - API Endpoint Reference

Quick reference guide for all API endpoints in main.py

## 🔐 Authentication Endpoints

### Register New User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "teacher@school.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "phone": "0712345678",
  "school": "Nairobi Primary School",
  "grade_level": "Grade 7"
}

Response: 201 Created
{
  "id": 1,
  "email": "teacher@school.com",
  "full_name": "John Doe",
  "is_admin": false,
  "email_verified": true
}
```

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "teacher@school.com",
  "password": "SecurePass123"
}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

### Google OAuth
```http
POST /api/v1/auth/google-auth
Content-Type: application/json

{
  "email": "teacher@gmail.com",
  "full_name": "Jane Smith",
  "google_id": "1234567890"
}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": 2,
    "email": "teacher@gmail.com",
    "full_name": "Jane Smith",
    "auth_provider": "google"
  }
}
```

### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <token>

Response: 200 OK
{
  "id": 1,
  "email": "teacher@school.com",
  "full_name": "John Doe",
  "school": "Nairobi Primary School",
  "grade_level": "Grade 7",
  "is_admin": false
}
```

---

## 📚 Subject Management

### List All Subjects
```http
GET /api/v1/subjects
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": 1,
    "subject_name": "Mathematics",
    "grade": "Grade 7",
    "total_lessons": 120,
    "lessons_completed": 45,
    "progress_percentage": 37.5,
    "template_id": 5
  }
]
```

### Get Subject Details
```http
GET /api/v1/subjects/1
Authorization: Bearer <token>

Response: 200 OK
{
  "id": 1,
  "subject_name": "Mathematics",
  "grade": "Grade 7",
  "total_lessons": 120,
  "lessons_completed": 45,
  "progress_percentage": 37.5,
  "strands": [
    {
      "id": 1,
      "strand_code": "1",
      "strand_name": "Numbers",
      "sequence_order": 1,
      "sub_strands": [
        {
          "id": 1,
          "substrand_code": "1.1",
          "substrand_name": "Whole Numbers",
          "lessons_count": 10,
          "learning_outcomes": ["Identify place values", "..."],
          "key_inquiry_questions": ["What is a whole number?", "..."]
        }
      ]
    }
  ]
}
```

### Create New Subject
```http
POST /api/v1/subjects
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject_name": "English",
  "grade": "Grade 7",
  "curriculum_pdf_url": "https://example.com/curriculum.pdf"
}

Response: 201 Created
{
  "id": 2,
  "subject_name": "English",
  "grade": "Grade 7",
  "total_lessons": 100,
  "lessons_completed": 0,
  "progress_percentage": 0,
  "template_id": 10
}
```

### Delete Subject
```http
DELETE /api/v1/subjects/1
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Subject deleted successfully"
}
```

---

## ✅ Progress Tracking

### Mark Lesson as Complete
```http
POST /api/v1/lessons/123/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Covered all learning outcomes successfully"
}

Response: 200 OK
{
  "message": "Lesson marked as complete",
  "lesson_id": 123,
  "completed_at": "2025-11-25T10:30:00Z",
  "subject_progress": 38.3
}
```

### Mark Lesson as Incomplete
```http
POST /api/v1/lessons/123/uncomplete
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Lesson marked as incomplete",
  "lesson_id": 123,
  "subject_progress": 37.5
}
```

### Get Lesson Status
```http
GET /api/v1/lessons/123/status
Authorization: Bearer <token>

Response: 200 OK
{
  "lesson_id": 123,
  "is_completed": true,
  "completed_at": "2025-11-25T10:30:00Z"
}
```

---

## 📝 Notes & Resources

### List All Notes
```http
GET /api/v1/notes
Authorization: Bearer <token>

Query Parameters:
  - subject_id (optional): Filter by subject
  - is_favorite (optional): Filter favorites
  - is_archived (optional): Filter archived

Response: 200 OK
[
  {
    "id": 1,
    "title": "Introduction to Algebra",
    "file_url": "https://res.cloudinary.com/...",
    "file_type": "pdf",
    "file_size": 1024000,
    "subject_id": 1,
    "is_favorite": false,
    "is_archived": false,
    "created_at": "2025-11-20T08:00:00Z"
  }
]
```

### Upload Note/File
```http
POST /api/v1/notes/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
  - file: [binary file]
  - title: "Lesson Plan - Algebra"
  - subject_id: 1
  - strand_id: 2 (optional)
  - substrand_id: 5 (optional)
  - lesson_id: 123 (optional)
  - description: "Complete lesson plan with activities"
  - tags: "algebra,math,grade7"

Response: 201 Created
{
  "id": 10,
  "title": "Lesson Plan - Algebra",
  "file_url": "https://res.cloudinary.com/...",
  "file_type": "pdf",
  "file_size": 2048000,
  "subject_id": 1,
  "tags": ["algebra", "math", "grade7"]
}
```

### Download Note
```http
GET /api/v1/notes/10/download
Authorization: Bearer <token>

Response: 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="lesson-plan.pdf"
[Binary file content]
```

### Toggle Favorite
```http
PATCH /api/v1/notes/10/favorite
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "is_favorite": true,
  "message": "Note added to favorites"
}
```

---

## 📅 Timetable Management

### Create Schedule
```http
POST /api/v1/timetable/schedules
Authorization: Bearer <token>
Content-Type: application/json

{
  "schedule_name": "Grade 7 Schedule",
  "education_level": "JSS",
  "is_active": true,
  "time_slots": [
    {
      "slot_name": "Period 1",
      "start_time": "08:00:00",
      "end_time": "08:40:00",
      "sequence_order": 1
    },
    {
      "slot_name": "Period 2",
      "start_time": "08:40:00",
      "end_time": "09:20:00",
      "sequence_order": 2
    }
  ]
}

Response: 201 Created
{
  "id": 1,
  "schedule_name": "Grade 7 Schedule",
  "education_level": "JSS",
  "is_active": true,
  "time_slots": [...]
}
```

### Add Timetable Entry
```http
POST /api/v1/timetable/entries
Authorization: Bearer <token>
Content-Type: application/json

{
  "time_slot_id": 1,
  "subject_id": 1,
  "day_of_week": 1,
  "education_level": "JSS"
}

Response: 201 Created
{
  "id": 1,
  "time_slot_id": 1,
  "subject_id": 1,
  "subject_name": "Mathematics",
  "day_of_week": 1,
  "day_name": "Monday",
  "start_time": "08:00:00",
  "end_time": "08:40:00"
}
```

### Get Timetable Entries
```http
GET /api/v1/timetable/entries?day_of_week=1
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": 1,
    "subject_name": "Mathematics",
    "day_of_week": 1,
    "slot_name": "Period 1",
    "start_time": "08:00:00",
    "end_time": "08:40:00"
  }
]
```

---

## 📋 Schemes of Work

### Create Scheme
```http
POST /api/v1/schemes
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject_id": 1,
  "term": 1,
  "year": 2025,
  "weeks": [
    {
      "week_number": 1,
      "topic": "Introduction to Numbers",
      "subtopics": "Place value, Ordering",
      "lessons": [
        {
          "learning_outcomes": "Identify place values up to millions",
          "learning_activities": "Group work, number cards",
          "teaching_resources": "Number charts, counters",
          "assessment_methods": "Observation, written test"
        }
      ]
    }
  ]
}

Response: 201 Created
{
  "id": 1,
  "subject_id": 1,
  "term": 1,
  "year": 2025,
  "weeks": [...]
}
```

### Generate Scheme PDF
```http
GET /api/v1/schemes/1/pdf
Authorization: Bearer <token>

Response: 200 OK
Content-Type: application/pdf
[PDF binary content]
```

---

## 📖 Lesson Plans

### Create Lesson Plan
```http
POST /api/v1/lesson-plans
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject_id": 1,
  "topic": "Multiplication of Decimals",
  "class_level": "Grade 7",
  "duration": 40,
  "learning_outcomes": ["Multiply decimals by whole numbers"],
  "teaching_resources": ["Calculator", "Worksheet"],
  "introduction": "Review decimal place values",
  "development": "Step-by-step multiplication examples",
  "conclusion": "Summary and homework assignment",
  "assessment_methods": ["Oral questions", "Written exercise"]
}

Response: 201 Created
{
  "id": 1,
  "subject_id": 1,
  "topic": "Multiplication of Decimals",
  "duration": 40,
  "created_at": "2025-11-25T10:00:00Z"
}
```

### Generate Lesson Plan PDF
```http
GET /api/v1/lesson-plans/1/pdf
Authorization: Bearer <token>

Response: 200 OK
Content-Type: application/pdf
[PDF binary content]
```

---

## 📊 Curriculum Templates (Public)

### List Templates
```http
GET /api/v1/curriculum-templates?grade=Grade%207
Authorization: Bearer <token>

Response: 200 OK
{
  "templates": [
    {
      "id": 5,
      "subject": "Mathematics",
      "grade": "Grade 7",
      "education_level": "JSS",
      "is_active": true
    }
  ],
  "count": 1
}
```

### Get Template Details
```http
GET /api/v1/curriculum-templates/5
Authorization: Bearer <token>

Response: 200 OK
{
  "id": 5,
  "subject": "Mathematics",
  "grade": "Grade 7",
  "strands": [
    {
      "id": 10,
      "strand_number": "1",
      "strand_name": "Numbers",
      "substrands": [...]
    }
  ]
}
```

---

## 👨‍💼 Admin Endpoints

### List All Users
```http
GET /api/v1/admin/users
Authorization: Bearer <admin-token>

Response: 200 OK
{
  "total_users": 50,
  "users": [
    {
      "id": 1,
      "email": "teacher@school.com",
      "full_name": "John Doe",
      "total_subjects": 3,
      "total_lessons": 120,
      "completed_lessons": 45,
      "progress_percentage": 37.5,
      "is_admin": false
    }
  ]
}
```

### Update User Role
```http
PATCH /api/v1/admin/users/1/role
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "is_admin": true
}

Response: 200 OK
{
  "message": "User role updated to admin",
  "is_admin": true
}
```

### Create Curriculum Template
```http
POST /api/v1/admin/curriculum-templates
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "subject": "Science",
  "grade": "Grade 7",
  "education_level": "JSS",
  "is_active": true,
  "strands": [
    {
      "strand_number": "1",
      "strand_name": "Living Things",
      "sequence_order": 1,
      "substrands": [
        {
          "substrand_number": "1.1",
          "substrand_name": "Classification",
          "number_of_lessons": 8,
          "specific_learning_outcomes": ["Classify living things"],
          "key_inquiry_questions": ["How do we classify?"]
        }
      ]
    }
  ]
}

Response: 201 Created
{
  "id": 15,
  "subject": "Science",
  "grade": "Grade 7",
  "is_active": true
}
```

### Create System Announcement
```http
POST /api/v1/admin/announcements
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "System Maintenance",
  "message": "Scheduled maintenance on Sunday 2AM-4AM",
  "announcement_type": "info",
  "priority": 2,
  "is_active": true,
  "expires_at": "2025-11-30T23:59:59Z"
}

Response: 201 Created
{
  "id": 1,
  "title": "System Maintenance",
  "created_at": "2025-11-25T10:00:00Z"
}
```

### Update School Settings
```http
PUT /api/v1/admin/school-settings
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "school_name": "Nairobi Primary School",
  "school_address": "123 School Road, Nairobi",
  "school_phone": "0712345678",
  "school_email": "info@school.ac.ke",
  "current_term": 2,
  "current_year": 2025
}

Response: 200 OK
{
  "id": 1,
  "school_name": "Nairobi Primary School",
  "updated_at": "2025-11-25T10:00:00Z"
}
```

---

## 🔍 Utility Endpoints

### Get Education Levels
```http
GET /api/v1/education-levels

Response: 200 OK
{
  "levels": ["PP", "Primary", "JSS", "SSS"],
  "count": 4
}
```

### Get Grades by Level
```http
GET /api/v1/grades-by-level?education_level=Primary

Response: 200 OK
{
  "grades": ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
  "education_level": "Primary",
  "count": 6
}
```

### Get Subjects by Grade
```http
GET /api/v1/subjects-by-grade?grade=Grade%207

Response: 200 OK
{
  "subjects": ["Mathematics", "English", "Kiswahili", "Science", ...],
  "grade": "Grade 7",
  "count": 12
}
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "detail": "Email already registered"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Access denied. Admin privileges required."
}
```

### 404 Not Found
```json
{
  "detail": "Subject not found"
}
```

### 413 Payload Too Large
```json
{
  "detail": "File size (55.2MB) exceeds maximum allowed (50MB)"
}
```

### 503 Service Unavailable
```json
{
  "detail": "File storage service is not available"
}
```

---

## 📌 Common Headers

All authenticated requests require:
```
Authorization: Bearer <jwt-token>
```

For file uploads:
```
Content-Type: multipart/form-data
```

For JSON requests:
```
Content-Type: application/json
```

---

## 🔗 Base URL

Development: `http://localhost:8000`  
Production: Configure in frontend `.env`

All endpoints start with `/api/v1` prefix except:
- `/` (root)
- `/health` (health check)
- `/docs` (Swagger UI)
- `/redoc` (ReDoc documentation)

---

## 📖 Interactive Documentation

Visit these URLs when the server is running:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Both provide:
- Complete API reference
- Interactive testing
- Request/response examples
- Schema definitions
