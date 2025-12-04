# TeachTrack CBC - Application Function Review

**Date**: November 25, 2025  
**Backend File**: `backend/main.py` (6471 lines, 250KB)  
**Framework**: FastAPI (Python)  
**Database**: MySQL with SQLAlchemy ORM

---

## 📋 Table of Contents

1. [Application Overview](#application-overview)
2. [Architecture & Core Components](#architecture--core-components)
3. [Data Models & Database Structure](#data-models--database-structure)
4. [API Endpoint Categories](#api-endpoint-categories)
5. [Key Features & Functionality](#key-features--functionality)
6. [Authentication & Security](#authentication--security)
7. [File Storage & Media](#file-storage--media)
8. [Caching Strategy](#caching-strategy)
9. [Administration Features](#administration-features)
10. [Dependencies & Integrations](#dependencies--integrations)

---

## 🎯 Application Overview

**TeachTrack CBC** is a comprehensive curriculum tracking and management platform specifically designed for teachers in Kenya following the Competency-Based Curriculum (CBC). The application helps teachers:

- Track curriculum progress across subjects, strands, and lessons
- Manage teaching resources and notes
- Create and share lesson plans and schemes of work
- Maintain timetables and schedules
- Upload and organize teaching materials (PDFs, documents, images, videos)
- Collaborate with other teachers through shared resources
- Access pre-loaded curriculum templates for various grades and subjects

---

## 🏗️ Architecture & Core Components

### Application Initialization

```python
app = FastAPI(
    title="TeachTrack CBC API",
    description="API for TeachTrack CBC - Curriculum tracking for Kenyan teachers",
    version="1.0.0"
)
```

### Core Middleware & Configuration

1. **CORS Middleware**
   - Allows cross-origin requests from frontend
   - Configurable origins from settings
   - Handles preflight OPTIONS requests

2. **Custom Request Logging Middleware**
   - Logs all incoming requests
   - Handles CORS preflight explicitly
   - Ensures proper headers on all responses

3. **Static File Serving**
   - Mounts `/uploads` directory for file access
   - Serves uploaded teaching materials

4. **Router Integration**
   - Includes `auth_router` for authentication endpoints
   - Modular endpoint organization

### Helper Functions

1. **`ensure_user_terms(db, user)`**
   - Creates default academic terms (Term 1, 2, 3) if they don't exist
   - Ensures one term is marked as current
   - Uses Kenya's academic calendar structure

2. **`get_active_schedule_or_fallback(db, user, education_level)`**
   - Retrieves active timetable schedule
   - Falls back to generic schedule when level-specific not found

3. **`schedule_has_entries(db, user_id, schedule_id, day_of_week)`**
   - Checks if a schedule has timetable entries

4. **`resolve_schedule_for_context(db, user, education_level, day_of_week)`**
   - Intelligent schedule selection based on context

---

## 📊 Data Models & Database Structure

### Template Models (Global Curriculum Templates)

**CurriculumTemplate**
- Subject, grade, education level
- Active status for versioning
- Relationships to TemplateStrand

**TemplateStrand**
- Strand number and name
- Belongs to a curriculum template
- Has multiple TemplateSubstrand

**TemplateSubstrand**
- Substrand number, name
- Number of lessons
- Curriculum details (learning outcomes, inquiry questions, competencies, values, etc.)

### User-Facing Models (User-Specific Data)

**User**
- Email, password hash (or Google OAuth)
- Profile info (name, phone, school, grade level)
- Admin flag
- Email verification status
- Authentication provider (local/google)

**Subject**
- User's subjects they teach
- Links to curriculum template
- Progress tracking (total lessons, completed, percentage)
- Has strands, notes, progress logs

**Strand**
- Main curriculum sections
- Strand code and name
- Has sub-strands

**SubStrand**
- Detailed curriculum units
- Learning outcomes, inquiry questions, competencies
- Has multiple lessons

**Lesson**
- Individual teaching units
- Completion status and timestamp
- Lesson number, title, content

**ProgressLog**
- Tracks lesson completion history
- User actions and notes
- Timestamps

**Note**
- Teaching resources and materials
- File metadata (URL, type, size)
- Can be linked to subject/strand/substrand/lesson
- Supports favorites, archiving
- Tags for organization

### Timetable & Scheduling

**SchoolSchedule**
- Master schedule for education level
- Active flag
- Has time slots and timetable entries

**TimeSlot**
- Individual periods (e.g., 8:00-9:00 AM)
- Start and end times

**TimetableEntry**
- Assigns subject to time slot on specific day
- Links schedule, time slot, subject
- Education level grouping

### Professional Planning

**SchemeOfWork**
- Long-term teaching plans
- Subject, term, year
- Has weekly breakdown

**SchemeWeek**
- Week-by-week planning
- Week number, topics
- Has individual lessons

**SchemeLesson**
- Specific learning outcomes
- Activities, resources, assessment methods

**LessonPlan**
- Detailed lesson preparation
- Objectives, materials, activities
- Introduction, development, conclusion phases
- Assessment methods

**RecordOfWork**
- What was actually taught
- Completion tracking

**RecordOfWorkEntry**
- Daily/lesson entries
- Actual vs planned content
- Remarks and notes

### Administrative

**SchoolSettings**
- School-wide configuration
- Name, address, contact
- Logo, term dates

**SchoolTerm**
- Academic term dates
- Mid-term breaks
- Year and term number

**CalendarActivity**
- School events and activities

**SystemAnnouncement**
- Admin announcements to all users
- Priority levels, expiration dates

**PresentationSession**
- Hybrid presentation feature
- QR codes for sharing
- Current slide tracking

**NoteAnnotation**
- Annotations on teaching materials

**SharedPresentation**
- Collaboration and sharing

---

## 🔌 API Endpoint Categories

### 1. Health & Root Endpoints

```
GET  /                 - API status and version
GET  /health           - Health check
```

### 2. Authentication (`/api/v1/auth`)

```
POST /auth/register         - Register new user
POST /auth/login            - Login (email/password)
POST /auth/google-auth      - Google OAuth login
GET  /auth/me               - Get current user info
OPTIONS /auth/login         - CORS preflight
```

**Authentication Flow**:
1. User registers or logs in
2. Server validates credentials
3. JWT token generated using email as subject
4. Token required for all protected endpoints (via `Bearer` token in `Authorization` header)

### 3. Subject Management (`/api/v1/subjects`)

```
GET    /subjects                    - List user's subjects (cached)
GET    /subjects/{id}               - Get subject with strands/sub-strands
GET    /subjects/{id}/strands       - Get subject's strands
GET    /subjects/{id}/lessons       - Get all lessons (flattened)
POST   /subjects                    - Create subject (auto-populates from template)
DELETE /subjects/{id}               - Delete subject
```

**Subject Creation Process**:
1. User provides subject name and grade
2. System searches for matching curriculum template
3. If found, copies strands, sub-strands, and creates placeholder lessons
4. Links template to subject for reference
5. Calculates total lesson count

### 4. Progress Tracking (`/api/v1/progress`, `/api/v1/lessons`)

```
POST /progress/mark-complete          - Mark lesson complete
POST /lessons/{id}/complete           - Mark lesson complete (with details)
POST /lessons/{id}/uncomplete         - Mark lesson incomplete
GET  /lessons/{id}/status             - Get lesson completion status
```

**Progress Tracking Logic**:
1. Updates lesson's `is_completed` flag and `completed_at` timestamp
2. Creates `ProgressLog` entry
3. Recalculates subject's completion percentage
4. Returns updated progress

### 5. Notes & Resources (`/api/v1/notes`)

```
GET    /notes                        - List user's notes
GET    /notes/{id}                   - Get specific note
POST   /notes                        - Create text note
POST   /notes/upload                 - Upload file (PDF, DOCX, PPTX, images, videos)
PUT    /notes/{id}                   - Update note
DELETE /notes/{id}                   - Delete note
PATCH  /notes/{id}/favorite          - Toggle favorite
PATCH  /notes/{id}/archive           - Toggle archive
GET    /notes/{id}/download          - Download file
GET    /notes/{id}/view              - View file (streaming)
```

**File Upload Features**:
- Uses Cloudinary for cloud storage (with fallback to local)
- Validates file types (pdf, docx, pptx, jpg, png, mp4, etc.)
- Enforces size limits (configurable, default 50MB)
- Automatic preview generation for images
- Streaming support for large files

### 6. Curriculum Templates (`/api/v1/curriculum-templates`)

```
GET  /curriculum-templates                      - List active templates
GET  /curriculum-templates/{id}                 - Get template details
GET  /curriculum-templates/{id}/strands         - Get template strands
```

### 7. Admin - Curriculum Management (`/api/v1/admin/curriculum-templates`)

```
GET    /admin/curriculum-templates              - List all templates (with filters)
GET    /admin/curriculum-templates/{id}         - Get template
POST   /admin/curriculum-templates              - Create template
PUT    /admin/curriculum-templates/{id}         - Update template
DELETE /admin/curriculum-templates/{id}         - Soft delete (is_active=false)
POST   /admin/curriculum-templates/{id}/strands - Add strand
POST   /admin/strands/{id}/substrands          - Add substrand
```

### 8. Cascading Dropdowns (`/api/v1`)

```
GET  /education-levels        - List education levels (PP, Primary, JSS, SSS)
GET  /grades-by-level          - List grades for education level
GET  /subjects-by-grade        - List subjects for grade
```

### 9. Timetable Management (`/api/v1/timetable`)

```
GET    /timetable/schedules              - List schedules
POST   /timetable/schedules              - Create schedule
GET    /timetable/schedules/{id}         - Get schedule with slots
PUT    /timetable/schedules/{id}         - Update schedule
DELETE /timetable/schedules/{id}         - Delete schedule
PATCH  /timetable/schedules/{id}/active  - Set as active schedule

GET    /timetable/entries                - List timetable entries (by day/level)
POST   /timetable/entries                - Create entry (assign subject to slot)
PUT    /timetable/entries/{id}           - Update entry
DELETE /timetable/entries/{id}           - Delete entry
```

**Timetable Features**:
- Multiple schedules per user (e.g., different for each grade level)
- One active schedule per education level
- Flexible time slots
- Subject assignment by day and period

### 10. Schemes of Work (`/api/v1/schemes`)

```
GET    /schemes                  - List user's schemes
POST   /schemes                  - Create scheme
GET    /schemes/{id}             - Get scheme with weeks/lessons
PUT    /schemes/{id}             - Update scheme
DELETE /schemes/{id}             - Delete scheme
GET    /schemes/{id}/pdf         - Generate PDF
POST   /schemes/{id}/weeks       - Add week
POST   /weeks/{id}/lessons       - Add lesson to week
```

**PDF Generation**:
- Creates professional PDF documents
- Includes school branding (if configured)
- Formatted tables with curriculum details
- Auto-pagination

### 11. Lesson Plans (`/api/v1/lesson-plans`)

```
GET    /lesson-plans             - List lesson plans
POST   /lesson-plans             - Create lesson plan
GET    /lesson-plans/{id}        - Get lesson plan
PUT    /lesson-plans/{id}        - Update lesson plan
DELETE /lesson-plans/{id}        - Delete lesson plan
GET    /lesson-plans/{id}/pdf    - Generate PDF
```

**Lesson Plan Structure**:
- Subject, topic, duration
- Learning outcomes
- Teaching/learning resources
- Introduction, development, conclusion phases
- Assessment methods
- Teacher reflection notes

### 12. Records of Work (`/api/v1/records`)

```
GET    /records                  - List records
POST   /records                  - Create record
GET    /records/{id}             - Get record with entries
PUT    /records/{id}             - Update record
DELETE /records/{id}             - Delete record
POST   /records/{id}/entries     - Add entry
PUT    /entries/{id}             - Update entry
```

### 13. User Terms (`/api/v1/terms`)

```
GET   /terms                     - List user's terms
POST  /terms                     - Create term
GET   /terms/{id}                - Get term
PUT   /terms/{id}                - Update term
POST  /terms/{id}/set-current    - Set as current term
```

### 14. User Settings (`/api/v1/settings`)

```
GET   /settings/user             - Get user settings
PUT   /settings/user             - Update user settings
```

### 15. School Administration (`/api/v1/admin`)

```
GET    /admin/school-settings        - Get school settings
PUT    /admin/school-settings        - Update school settings
POST   /admin/school-settings/logo   - Upload school logo

GET    /admin/school-terms           - List school terms
POST   /admin/school-terms           - Create term
PUT    /admin/school-terms/{id}      - Update term
DELETE /admin/school-terms/{id}      - Delete term

GET    /admin/calendar-activities    - List activities
POST   /admin/calendar-activities    - Create activity
PUT    /admin/calendar-activities/{id} - Update activity
DELETE /admin/calendar-activities/{id} - Delete activity
```

### 16. System Announcements (`/api/v1`)

```
GET    /announcements                    - Get active announcements (users)
GET    /admin/announcements              - All announcements (admin)
POST   /admin/announcements              - Create announcement
PUT    /admin/announcements/{id}         - Update announcement
DELETE /admin/announcements/{id}         - Delete announcement
```

### 17. User Management (`/api/v1/admin`)

```
GET    /admin/users                      - List all users with stats
PATCH  /admin/users/{id}/role            - Update user role (admin/teacher)
POST   /admin/users/{id}/reset-progress  - Reset user's progress
```

### 18. Presentation Features (`/api/v1/presentations`)

```
GET    /presentations                    - List presentations
POST   /presentations                    - Create presentation
GET    /presentations/{id}               - Get presentation
PUT    /presentations/{id}               - Update presentation
DELETE /presentations/{id}               - Delete presentation
POST   /presentations/{id}/share         - Share presentation
GET    /presentations/access/{code}      - Access shared presentation
PATCH  /presentations/{id}/slide         - Update current slide

GET    /notes/{id}/annotations           - Get annotations
POST   /notes/{id}/annotations           - Add annotation
PUT    /annotations/{id}                 - Update annotation
DELETE /annotations/{id}                 - Delete annotation

GET    /notes/{id}/speaker-notes         - Get speaker notes
POST   /notes/{id}/speaker-notes         - Add speaker note
PUT    /speaker-notes/{id}               - Update speaker note
```

---

## 🔐 Authentication & Security

### Authentication Mechanism

1. **JWT Token-Based Authentication**
   - Uses `python-jose` for JWT generation/verification
   - Token contains user email as subject
   - Configurable expiration time

2. **Password Security**
   - Uses `bcrypt` for password hashing
   - No plain-text passwords stored

3. **OAuth Integration**
   - Google Sign-In supported
   - Creates/links accounts automatically
   - No password required for OAuth users

### Security Dependencies

```python
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    email = verify_token(token)
    # Fetch and return user
```

### Admin Protection

```python
def get_current_admin_user(
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user
```

### CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # From config
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
```

---

## 📁 File Storage & Media

### Cloudinary Integration

The application uses **Cloudinary** for cloud file storage:

**Supported File Types**:
- Documents: PDF, DOCX, PPTX, XLSX
- Images: JPG, JPEG, PNG, GIF, WEBP
- Videos: MP4, AVI, MOV
- Others: TXT, ZIP

**Features**:
1. **Automatic Upload** to Cloudinary
2. **URL Generation** for access
3. **Fallback to Local Storage** if Cloudinary not configured
4. **Size Validation** (configurable max size)
5. **Type Validation** (whitelist approach)
6. **Metadata Storage** in database

**Upload Process**:
```
1. User uploads file via /notes/upload
2. Validate file size and type
3. Upload to Cloudinary (or save locally)
4. Store file URL, type, size in database
5. Return note object with file details
```

### File Streaming

For large files (videos, large PDFs):
```python
@app.get("/api/v1/files/{file_id}/stream")
async def stream_file():
    # Supports range requests
    # Returns StreamingResponse
    # Enables video seeking, partial downloads
```

---

## ⚡ Caching Strategy

The application uses **Redis** for caching to improve performance:

```python
from cache_manager import cache, CacheTTL

# Example: Caching subjects list
cache_key = f"subjects:user:{current_user.id}"
cached = cache.get(cache_key)
if cached:
    return cached

subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
cache.set(cache_key, subjects, CacheTTL.LIST_DATA)
```

**Cache TTL (Time-To-Live)**:
- `LIST_DATA`: 30 minutes (e.g., subjects list)
- Automatically invalidated on data changes

**Benefits**:
- Reduces database queries
- Faster response times
- Scales better under load

---

## 👨‍💼 Administration Features

### Admin Dashboard

Admins have access to additional endpoints for:

1. **User Management**
   - View all users with statistics
   - Promote/demote admin status
   - Reset user progress

2. **Curriculum Template Management**
   - Create, edit, delete curriculum templates
   - Manage strands and sub-strands
   - Import curriculum from JSON files

3. **School Settings**
   - Configure school information
   - Upload school logo
   - Set term dates

4. **System Announcements**
   - Create announcements for all users
   - Set priority and expiration dates

5. **Analytics**
   ```
   GET /admin/users
   Returns: {
       "total_users": 150,
       "users": [
           {
               "id": 1,
               "email": "teacher@school.com",
               "full_name": "John Doe",
               "total_subjects": 3,
               "total_lessons": 120,
               "completed_lessons": 45,
               "progress_percentage": 37.5
           }
       ]
   }
   ```

---

## 🔗 Dependencies & Integrations

### Core Python Packages

```
fastapi          - Web framework
uvicorn          - ASGI server
sqlalchemy       - ORM
pymysql          - MySQL driver
pydantic         - Data validation
python-jose      - JWT tokens
passlib[bcrypt]  - Password hashing
python-multipart - File uploads
cloudinary       - Cloud storage
redis            - Caching
celery           - Background tasks (optional)
reportlab        - PDF generation
```

### External Services

1. **MySQL Database**
   - Primary data store
   - Full schema with relationships
   - Cascading deletes for data integrity

2. **Redis** (Optional)
   - Caching layer
   - Session storage

3. **Cloudinary**
   - File storage
   - Image transformations
   - CDN delivery

4. **Google OAuth**
   - Sign-in with Google
   - Email verification

---

## 🎓 Curriculum Structure (CBC)

The application follows Kenya's **Competency-Based Curriculum (CBC)** structure:

### Education Levels
- **PP (Pre-Primary)**: PP1, PP2
- **Primary**: Grade 1-6
- **JSS (Junior Secondary School)**: Grade 7-9
- **SSS (Senior Secondary School)**: Grade 10-12

### Curriculum Hierarchy

```
Subject (e.g., "Mathematics - Grade 7")
  └── Strands (e.g., "Numbers")
       └── Sub-Strands (e.g., "Whole Numbers")
            └── Lessons (e.g., "Lesson 1: Place Value")
```

### Curriculum Details (Per Sub-Strand)

- **Specific Learning Outcomes (SLOs)**
- **Key Inquiry Questions**
- **Suggested Learning Experiences**
- **Core Competencies** (e.g., Critical Thinking, Creativity)
- **Values** (e.g., Integrity, Responsibility)
- **PCIs** (Pertinent and Contemporary Issues)
- **Links to Other Subjects**

---

## 📈 Scalability Features

1. **Database Indexing**
   - Primary keys indexed
   - Foreign keys indexed
   - Email field indexed for fast lookups

2. **Lazy Loading**
   - Uses SQLAlchemy's `joinedload` for efficient queries
   - Avoids N+1 query problems

3. **Caching**
   - Redis caching for frequently accessed data
   - Automatic cache invalidation

4. **Pagination Support**
   - Ready for implementation on list endpoints

5. **Async Endpoints**
   - Some endpoints use `async def` for better concurrency

6. **Background Tasks**
   - Celery integration available for long-running tasks
   - PDF generation can be moved to background

---

## 🚀 How the Application Functions (Complete Flow)

### 1. Teacher Registration & Login

1. Teacher visits the frontend application
2. Registers with email, password, and profile details
3. Backend creates user account with hashed password
4. Teacher logs in and receives JWT token
5. Token used for all subsequent API requests

### 2. Creating a Subject

1. Teacher clicks "Add Subject" in UI
2. Selects education level, grade, and subject from dropdowns
3. Frontend calls `POST /api/v1/subjects`
4. Backend searches for matching curriculum template
5. If template found:
   - Copies template strands and sub-strands
   - Creates placeholder lessons
   - Calculates total lesson count
6. Subject appears in teacher's dashboard

### 3. Tracking Progress

1. Teacher navigates to subject details
2. Expands strands and sub-strands to see lessons
3. Marks lesson as complete
4. Frontend calls `POST /api/v1/lessons/{id}/complete`
5. Backend:
   - Updates lesson status
   - Creates progress log entry
   - Recalculates subject progress percentage
   - Returns updated data
6. UI shows updated progress bar

### 4. Uploading Teaching Materials

1. Teacher clicks "Upload Note/Resource"
2. Selects file (PDF, Word document, image, etc.)
3. Optionally links to subject/strand/sub-strand/lesson
4. Frontend uploads file to `POST /api/v1/notes/upload`
5. Backend:
   - Validates file type and size
   - Uploads to Cloudinary (or local storage)
   - Saves metadata in database
   - Returns note object with file URL
6. Teacher can view, download, or share the resource

### 5. Creating a Scheme of Work

1. Teacher navigates to "Schemes of Work"
2. Creates new scheme (subject, term, year)
3. Adds weeks with topics and activities
4. For each week, adds lessons with:
   - Learning outcomes
   - Activities
   - Resources
   - Assessment methods
5. Backend saves hierarchical structure (Scheme → Weeks → Lessons)
6. Teacher can generate PDF for printing or sharing

### 6. Managing Timetable

1. Teacher creates a school schedule with time slots
2. Adds timetable entries (day + period + subject)
3. Backend resolves conflicts and validates
4. Timetable displayed in weekly grid format
5. Can create multiple schedules for different grade levels

### 7. Admin Functions

1. Admin logs in (user with `is_admin=true`)
2. Accesses admin-only endpoints:
   - Upload new curriculum templates
   - Manage school settings
   - Create system announcements
   - View user statistics
3. Changes are global and affect all users

---

## 💡 Key Strengths

1. **Comprehensive Feature Set**
   - Covers entire teaching workflow
   - Curriculum tracking, planning, resources, collaboration

2. **Modular Architecture**
   - Clear separation of concerns
   - Reusable components

3. **Template System**
   - Pre-loaded curriculum templates
   - Automatic subject population
   - Reduces manual data entry

4. **Flexible File Storage**
   - Cloud (Cloudinary) with local fallback
   - Supports multiple file types
   - Streaming for large files

5. **Performance Optimized**
   - Redis caching
   - Efficient database queries
   - Async support

6. **Production Ready**
   - Authentication and authorization
   - Error handling
   - CORS configuration
   - Environment-based configuration

---

## 🔍 Areas for Potential Enhancement

1. **Pagination**
   - Add pagination to list endpoints for better performance with large datasets

2. **Full-Text Search**
   - Implement search across notes, lesson plans, schemes

3. **WebSocket Support**
   - Real-time collaboration features
   - Live presentation updates

4. **API Rate Limiting**
   - Protect against abuse

5. **Comprehensive Logging**
   - Structured logging for debugging and monitoring

6. **Unit & Integration Tests**
   - Automated testing suite

7. **API Versioning**
   - Better backward compatibility strategy

8. **Database Migrations**
   - Use Alembic for version-controlled schema changes

---

## 📝 Summary

**TeachTrack CBC** is a well-architected, feature-rich platform for Kenyan teachers. The backend (`main.py`) serves as the central API, handling:

- **191 endpoint functions** across 6471 lines of code
- **20+ database models** with relationships
- **Authentication** (local + Google OAuth)
- **File management** (Cloudinary integration)
- **Curriculum tracking** (CBC structure)
- **Professional planning** (schemes, lesson plans, records)
- **Timetable management**
- **Collaboration** (sharing, presentations)
- **Administration** (templates, settings, announcements)

The application is production-ready with proper security, caching, and scalability considerations. It successfully addresses the complex needs of CBC teachers in managing their curriculum delivery.

---

**For more details**, explore:
- `/docs` - API documentation (Swagger UI)
- `/redoc` - Alternative API docs
- `backend/models.py` - Complete data model definitions
- `backend/schemas.py` - Request/response schemas
- Individual documentation files in the project root
