# TeachTrack CBC - System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                    │
│  ┌──────────────────┐              ┌──────────────────┐                │
│  │  Web Browser     │              │  Mobile Browser   │                │
│  │  (Frontend UI)   │              │  (Responsive)     │                │
│  └────────┬─────────┘              └────────┬──────────┘                │
└───────────┼─────────────────────────────────┼───────────────────────────┘
            │                                 │
            │         HTTPS / REST API        │
            └─────────────┬───────────────────┘
                          │
┌─────────────────────────┼─────────────────────────────────────────────┐
│                   API GATEWAY LAYER                                    │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  FastAPI Application (main.py - 6471 lines)                    │   │
│  │  • CORS Middleware (Cross-origin requests)                     │   │
│  │  • Request Logging Middleware                                  │   │
│  │  • JWT Authentication (Bearer token)                           │   │
│  │  • Static File Serving (/uploads)                              │   │
│  └────────────────────┬───────────────────────────────────────────┘   │
└───────────────────────┼───────────────────────────────────────────────┘
                        │
┌───────────────────────┼───────────────────────────────────────────────┐
│              BUSINESS LOGIC LAYER (API Endpoints)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │ Auth Module  │  │  Curriculum  │  │   Progress   │                │
│  │              │  │  Management  │  │   Tracking   │                │
│  │ • Register   │  │              │  │              │                │
│  │ • Login      │  │ • Subjects   │  │ • Mark Done  │                │
│  │ • OAuth      │  │ • Strands    │  │ • Logs       │                │
│  │ • Me         │  │ • Substrands │  │ • Stats      │                │
│  └──────────────┘  │ • Lessons    │  └──────────────┘                │
│                    └──────────────┘                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │  Resources   │  │   Planning   │  │  Timetable   │                │
│  │              │  │              │  │              │                │
│  │ • Notes      │  │ • Schemes    │  │ • Schedules  │                │
│  │ • Upload     │  │ • Lesson     │  │ • Time Slots │                │
│  │ • Download   │  │   Plans      │  │ • Entries    │                │
│  │ • Stream     │  │ • Records    │  │ • Conflicts  │                │
│  └──────────────┘  └──────────────┘  └──────────────┘                │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐                                   │
│  │Collaboration │  │  Admin Panel │                                   │
│  │              │  │              │                                   │
│  │ • Share      │  │ • Templates  │                                   │
│  │ • Present    │  │ • Users      │                                   │
│  │ • Annotate   │  │ • Settings   │                                   │
│  └──────────────┘  │ • Announce   │                                   │
│                    └──────────────┘                                   │
└────────────────────────┬───────────────────────────────────────────────┘
                         │
┌────────────────────────┼───────────────────────────────────────────────┐
│               DATA ACCESS LAYER                                        │
│  ┌────────────────────────────────────────────────────────┐           │
│  │  SQLAlchemy ORM                                        │           │
│  │  • Models (User, Subject, Lesson, Note, etc.)          │           │
│  │  • Relationships & Foreign Keys                        │           │
│  │  • Query Optimization (joinedload)                     │           │
│  │  • Lazy Loading                                        │           │
│  └────────────────────┬───────────────────────────────────┘           │
│                       │                                                │
│  ┌────────────────────────────────────────────────────────┐           │
│  │  Cache Manager (Redis Integration)                     │           │
│  │  • 30-min TTL for lists                                │           │
│  │  • Automatic invalidation on updates                   │           │
│  └────────────────────┬───────────────────────────────────┘           │
└───────────────────────┼────────────────────────────────────────────────┘
                        │
┌───────────────────────┼────────────────────────────────────────────────┐
│                 DATA STORAGE LAYER                                     │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │  MySQL Database  │  │  Cloudinary CDN  │  │  Redis Cache     │    │
│  │                  │  │                  │  │                  │    │
│  │ • Users          │  │ • PDFs           │  │ • Subject Lists  │    │
│  │ • Subjects       │  │ • Images         │  │ • Query Results  │    │
│  │ • Strands        │  │ • Videos         │  │ • Session Data   │    │
│  │ • Lessons        │  │ • Documents      │  │                  │    │
│  │ • Progress       │  │ • Transformations│  │                  │    │
│  │ • Notes (meta)   │  │                  │  │                  │    │
│  │ • Templates      │  │                  │  │                  │    │
│  │ • Timetables     │  │                  │  │                  │    │
│  │ • Schemes        │  │                  │  │                  │    │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════
                        DATA FLOW EXAMPLE
═══════════════════════════════════════════════════════════════════════════

Example: Teacher Marks Lesson as Complete

1. USER clicks "Mark Complete" in UI
   ↓
2. Frontend sends: POST /api/v1/lessons/123/complete
                   Headers: Authorization: Bearer <token>
   ↓
3. API Gateway validates JWT token
   ↓
4. Business Logic (Progress Tracking module):
   - Fetches lesson from database
   - Updates lesson.is_completed = True
   - Updates lesson.completed_at = now()
   - Creates ProgressLog entry
   - Recalculates subject progress percentage
   ↓
5. Data Access Layer (SQLAlchemy):
   - Commits transaction to MySQL
   - Invalidates related cache entries
   ↓
6. Response returns to Frontend:
   {
     "success": true,
     "lesson_id": 123,
     "new_progress": 45.5,
     "message": "Lesson marked complete"
   }
   ↓
7. UI updates progress bar and lesson status

═══════════════════════════════════════════════════════════════════════════
                        DATABASE SCHEMA OVERVIEW
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│  TEMPLATE MODELS (Global, Shared by All Users)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  curriculum_templates                                                │
│  • id, subject, grade, education_level, is_active                   │
│  └── template_strands                                                │
│      • id, template_id, strand_number, strand_name                  │
│      └── template_substrands                                         │
│          • id, strand_id, substrand_number, substrand_name,         │
│            number_of_lessons, learning_outcomes, etc.               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  USER DATA MODELS (Per-User Data)                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  users                                                               │
│  • id, email, password_hash, full_name, school, is_admin            │
│  │                                                                   │
│  ├── subjects                                                        │
│  │   • id, user_id, template_id, subject_name, grade,              │
│  │     total_lessons, lessons_completed, progress_percentage        │
│  │   │                                                              │
│  │   ├── strands                                                     │
│  │   │   • id, subject_id, strand_code, strand_name                │
│  │   │   │                                                          │
│  │   │   └── sub_strands                                            │
│  │   │       • id, strand_id, substrand_code, substrand_name,      │
│  │   │         lessons_count, learning_outcomes, etc.              │
│  │   │       │                                                      │
│  │   │       └── lessons                                            │
│  │   │           • id, substrand_id, lesson_number, lesson_title,  │
│  │   │             is_completed, completed_at                       │
│  │   │                                                              │
│  │   └── progress_log                                               │
│  │       • id, user_id, subject_id, lesson_id, action, timestamp   │
│  │                                                                   │
│  ├── notes                                                           │
│  │   • id, user_id, title, file_url, file_type, file_size,         │
│  │     subject_id, strand_id, substrand_id, lesson_id,             │
│  │     is_favorite, is_archived                                     │
│  │                                                                   │
│  ├── timetable_entries                                               │
│  │   • id, user_id, schedule_id, time_slot_id, subject_id,         │
│  │     day_of_week, education_level                                 │
│  │                                                                   │
│  ├── schemes_of_work                                                 │
│  │   • id, user_id, subject_id, term, year                         │
│  │   └── scheme_weeks                                               │
│  │       • id, scheme_id, week_number                               │
│  │       └── scheme_lessons                                         │
│  │           • id, week_id, learning_outcomes, activities           │
│  │                                                                   │
│  ├── lesson_plans                                                    │
│  │   • id, user_id, subject_id, topic, duration,                   │
│  │     learning_outcomes, materials, activities                     │
│  │                                                                   │
│  └── terms                                                           │
│      • id, user_id, term_number, academic_year,                     │
│        start_date, end_date, is_current                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════
                        SECURITY ARCHITECTURE
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│  Authentication Flow                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. User Registration                                                │
│     • POST /api/v1/auth/register                                    │
│     • Password hashed with bcrypt                                   │
│     • User record created in database                               │
│                                                                      │
│  2. User Login                                                       │
│     • POST /api/v1/auth/login                                       │
│     • Credentials verified                                          │
│     • JWT token generated (contains email as subject)               │
│     • Token returned to client                                      │
│                                                                      │
│  3. Google OAuth (Alternative)                                       │
│     • POST /api/v1/auth/google-auth                                 │
│     • Google ID token verified                                      │
│     • User created or linked                                        │
│     • JWT token generated                                           │
│                                                                      │
│  4. Protected Endpoint Access                                        │
│     • Client sends: Authorization: Bearer <token>                   │
│     • HTTPBearer security extracts token                            │
│     • get_current_user() dependency:                                │
│       - Verifies token signature                                    │
│       - Extracts email from token                                   │
│       - Fetches user from database                                  │
│       - Returns user object                                         │
│     • Endpoint executes with authenticated user                     │
│                                                                      │
│  5. Admin Endpoint Access                                            │
│     • get_current_admin_user() dependency:                          │
│       - Calls get_current_user()                                    │
│       - Checks user.is_admin == True                                │
│       - Raises 403 if not admin                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════
                        SCALABILITY FEATURES
═══════════════════════════════════════════════════════════════════════════

Performance Optimizations:
  ✓ Redis caching (30-min TTL)
  ✓ Database indexing (user_id, email, foreign keys)
  ✓ Eager loading with joinedload() to prevent N+1 queries
  ✓ Async endpoints for I/O operations
  ✓ CDN for static files (Cloudinary)
  ✓ Streaming for large files
  ✓ Connection pooling (SQLAlchemy)

Horizontal Scaling Ready:
  ✓ Stateless API (JWT tokens)
  ✓ External session storage (Redis)
  ✓ Cloud file storage (Cloudinary)
  ✓ Database replication support
  ✓ Load balancer compatible

Resource Limits:
  ✓ File size limits (50MB default)
  ✓ File type whitelist
  ✓ CORS origin restrictions
  ✓ Request validation (Pydantic)

═══════════════════════════════════════════════════════════════════════════
```
