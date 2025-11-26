# 📚 TeachTrack CBC - Documentation Index

Welcome to the TeachTrack CBC documentation! This index will help you navigate through the comprehensive documentation created for understanding how the application functions.

---

## 📑 Available Documentation

### 1. **APPLICATION_REVIEW.md** 📋
**What it covers**: Complete overview of how the TeachTrack CBC application works

**Key sections**:
- Application overview and purpose
- Architecture and core components
- Data models and database structure (20+ tables)
- All API endpoint categories
- Authentication and security implementation
- File storage and media management
- Caching strategy (Redis)
- Administration features
- Dependencies and integrations
- Complete user flow examples

**Best for**: Understanding the big picture, learning how all components work together

---

### 2. **ARCHITECTURE_DIAGRAM.md** 🏗️
**What it covers**: Visual system architecture with ASCII diagrams

**Key sections**:
- 5-layer architecture diagram (Client → API → Business Logic → Data Access → Storage)
- Data flow example (marking lesson complete)
- Database schema overview with relationships
- Security architecture and authentication flow
- Scalability features and performance optimizations

**Best for**: Visual learners, understanding system layers and data flow

---

### 3. **API_REFERENCE.md** 🔌
**What it covers**: Complete API endpoint reference guide

**Key sections**:
- Authentication endpoints (register, login, OAuth)
- Subject management endpoints
- Progress tracking endpoints
- Notes and resources endpoints
- Timetable management endpoints
- Schemes of work endpoints
- Lesson plans endpoints
- Admin endpoints
- Utility endpoints (dropdowns, filters)
- Request/response examples for each endpoint
- Error response formats
- Common headers and base URLs

**Best for**: API integration, testing, frontend development

---

## 🎯 Quick Navigation Guide

### "I want to understand..."

#### ...how the whole application works
→ Read **APPLICATION_REVIEW.md** from top to bottom

#### ...the system architecture
→ Check **ARCHITECTURE_DIAGRAM.md** for visual diagrams

#### ...specific API endpoints
→ Use **API_REFERENCE.md** as a quick reference

#### ...how authentication works
→ See "Authentication & Security" in **APPLICATION_REVIEW.md**  
→ See "Security Architecture" in **ARCHITECTURE_DIAGRAM.md**  
→ See "Authentication Endpoints" in **API_REFERENCE.md**

#### ...how teachers track curriculum progress
→ See "How the Application Functions" in **APPLICATION_REVIEW.md**  
→ See "Data Flow Example" in **ARCHITECTURE_DIAGRAM.md**  
→ See "Progress Tracking" in **API_REFERENCE.md**

#### ...the database structure
→ See "Data Models & Database Structure" in **APPLICATION_REVIEW.md**  
→ See "Database Schema Overview" in **ARCHITECTURE_DIAGRAM.md**

#### ...how to call the API
→ Go directly to **API_REFERENCE.md**

---

## 🔍 Main Application File

**Location**: `backend/main.py`

**Stats**:
- **6,471 lines** of Python code
- **250 KB** file size
- **191 endpoint functions**
- **20+ database models** used

**Current Features**:
1. ✅ User authentication (local + Google OAuth)
2. ✅ Curriculum management (CBC structure)
3. ✅ Subject tracking with progress
4. ✅ File uploads (Cloudinary integration)
5. ✅ Notes and resources management
6. ✅ Timetable creation and management
7. ✅ Schemes of work with PDF generation
8. ✅ Detailed lesson plans
9. ✅ Records of work tracking
10. ✅ Admin dashboard and analytics
11. ✅ System announcements
12. ✅ Collaboration features
13. ✅ Caching layer (Redis)
14. ✅ Presentation mode
15. ✅ School settings management

---

## 🗂️ Project Structure Overview

```
teachtrack/
├── backend/
│   ├── main.py              ← Main API application (6471 lines)
│   ├── models.py            ← Database models (SQLAlchemy)
│   ├── schemas.py           ← Request/response schemas (Pydantic)
│   ├── auth.py              ← Authentication utilities (JWT, bcrypt)
│   ├── config.py            ← Configuration settings
│   ├── database.py          ← Database connection
│   ├── cache_manager.py     ← Redis caching
│   ├── cloudinary_storage.py ← File upload handler
│   ├── auth_routes.py       ← Additional auth routes
│   ├── curriculum_importer.py ← Import curriculum templates
│   ├── requirements.txt     ← Python dependencies
│   └── .env                 ← Environment variables
│
├── frontend/                ← React/Next.js frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── database/
│   ├── schema.sql           ← Database schema
│   └── migrations/
│
├── docs/                    ← Additional documentation
│
├── APPLICATION_REVIEW.md    ← This documentation (overview)
├── ARCHITECTURE_DIAGRAM.md  ← Architecture diagrams
├── API_REFERENCE.md         ← API endpoint reference
└── README.md                ← Project README

```

---

## 🚀 Getting Started

### For Developers

1. **First**, read **APPLICATION_REVIEW.md** to understand the system
2. **Then**, review **ARCHITECTURE_DIAGRAM.md** to visualize the structure
3. **Finally**, use **API_REFERENCE.md** as you develop

### For Testers

1. Start with **API_REFERENCE.md** for endpoint documentation
2. Use the interactive docs at `http://localhost:8000/docs`
3. Refer to **APPLICATION_REVIEW.md** for expected behavior

### For System Administrators

1. Read "Scalability Features" in **ARCHITECTURE_DIAGRAM.md**
2. Review "Admin Features" in **APPLICATION_REVIEW.md**
3. Check "Admin Endpoints" in **API_REFERENCE.md**

### For New Team Members

1. Start with **APPLICATION_REVIEW.md** - Section "Application Overview"
2. Review **ARCHITECTURE_DIAGRAM.md** - "5-layer architecture"
3. Experiment with endpoints using **API_REFERENCE.md**

---

## 🎓 Understanding CBC (Competency-Based Curriculum)

TeachTrack is specifically designed for Kenya's education system. Here's the curriculum hierarchy:

```
Education Level
  └── Grade
       └── Subject
            └── Strand (Major topic area)
                 └── Sub-Strand (Specific topic)
                      └── Lesson (Individual teaching unit)
```

**Example**:
- **Education Level**: JSS (Junior Secondary School)
- **Grade**: Grade 7
- **Subject**: Mathematics
- **Strand**: Numbers
- **Sub-Strand**: Whole Numbers
- **Lesson**: Lesson 1 - Place Value

Each sub-strand includes:
- Specific Learning Outcomes (SLOs)
- Key Inquiry Questions
- Suggested Learning Experiences
- Core Competencies
- Values
- Pertinent and Contemporary Issues (PCIs)
- Links to Other Subjects

---

## 🔧 Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation
- **MySQL** - Primary database
- **Redis** - Caching layer
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing
- **Cloudinary** - Cloud file storage

### Frontend (Not covered in this review)
- React/Next.js
- TypeScript
- State management
- API integration

---

## 📊 Key Statistics

### Database
- **20+ tables** in production
- **Template models**: 3 (shared curriculum data)
- **User models**: 15+ (per-user data)
- **Relationships**: Extensive with cascading deletes

### API
- **191 endpoint functions** in main.py
- **8 major categories**: Auth, Subjects, Progress, Notes, Timetable, Schemes, Lesson Plans, Admin
- **Authentication**: JWT tokens, OAuth support
- **File uploads**: Multi-format support (15+ file types)

### Features
- **Curriculum Templates**: Pre-loaded for all grades and subjects
- **Progress Tracking**: Automatic percentage calculations
- **PDF Generation**: Schemes and lesson plans
- **Caching**: 30-minute TTL on lists
- **File Storage**: Cloudinary with local fallback

---

## ❓ Common Questions

### Q: How does authentication work?
**A**: See "Authentication & Security" section in **APPLICATION_REVIEW.md** and the security diagram in **ARCHITECTURE_DIAGRAM.md**

### Q: How do I create a new subject?
**A**: Check the "Creating a Subject" flow in **APPLICATION_REVIEW.md** and the API endpoint in **API_REFERENCE.md**

### Q: What's the database schema?
**A**: Full schema in **APPLICATION_REVIEW.md** under "Data Models" and visual representation in **ARCHITECTURE_DIAGRAM.md**

### Q: How do I upload a file?
**A**: See "File Upload Features" in **APPLICATION_REVIEW.md** and `/notes/upload` endpoint in **API_REFERENCE.md**

### Q: What happens when a teacher marks a lesson complete?
**A**: Complete flow in **APPLICATION_REVIEW.md** under "Tracking Progress" and data flow diagram in **ARCHITECTURE_DIAGRAM.md**

### Q: How scalable is the system?
**A**: Review "Scalability Features" section in **ARCHITECTURE_DIAGRAM.md**

### Q: What are the admin capabilities?
**A**: See "Administration Features" in **APPLICATION_REVIEW.md** and "Admin Endpoints" in **API_REFERENCE.md**

---

## 🛠️ Development Resources

### Interactive API Documentation
When the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Additional Documentation Files
Check the project root for:
- `QUICKSTART.md` - Quick setup guide
- `TESTING_GUIDE.md` - Testing instructions
- `CURRICULUM_TRACKING_GUIDE.md` - Curriculum features
- `SCHEMES_OF_WORK_API.md` - Schemes documentation
- Various setup and deployment guides

---

## 📞 Support

For questions or issues:
1. Review the three main documentation files
2. Check the interactive API docs
3. Explore the codebase with the understanding from these docs

---

## 🎉 Summary

You now have **three comprehensive documents** that explain:

1. **WHAT** the application does (**APPLICATION_REVIEW.md**)
2. **HOW** it's structured (**ARCHITECTURE_DIAGRAM.md**)
3. **HOW TO USE** the API (**API_REFERENCE.md**)

Together, these documents provide a complete picture of the TeachTrack CBC backend system, from high-level concepts down to specific API calls.

Happy coding! 🚀

---

*Last Updated: November 25, 2025*
