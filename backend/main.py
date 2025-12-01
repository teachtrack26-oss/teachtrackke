from fastapi import FastAPI, Depends, HTTPException, status, Response, UploadFile, File, Form, Request, Body
from fastapi.responses import StreamingResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timedelta
import uvicorn
import json
import os
import mimetypes
import secrets

from database import get_db, engine
from models import (
    User, Subject, Strand, SubStrand, Lesson, ProgressLog, Note, Term,
    CurriculumTemplate, TemplateStrand, TemplateSubstrand,
    NoteAnnotation, PresentationSession, SpeakerNote, SharedPresentation,
    SchoolSchedule, TimeSlot, TimetableEntry,
    SchoolSettings, SchoolTerm, CalendarActivity, LessonConfiguration,
    SchemeOfWork, SchemeWeek, SchemeLesson, LessonPlan, RecordOfWork, RecordOfWorkEntry,
    SystemAnnouncement, SubscriptionType, UserRole, School, SubscriptionStatus,
    TeacherProfile, TeacherLessonConfig
)
from sqlalchemy import text, func, and_, or_
from schemas import (
    UserCreate, UserLogin, UserResponse, Token, GoogleAuth,
    SubjectCreate, SubjectResponse,
    StrandCreate, StrandResponse,
    SubStrandCreate, SubStrandResponse,
    LessonCreate, LessonResponse,
    ProgressLogCreate, ProgressLogResponse,
    NoteCreate, NoteResponse,
    CurriculumTemplateCreate, CurriculumTemplateUpdate, CurriculumTemplateResponse,
    NoteAnnotationCreate, NoteAnnotationUpdate, NoteAnnotationResponse,
    PresentationSessionCreate, PresentationSessionUpdate, PresentationSessionResponse,
    SpeakerNoteCreate, SpeakerNoteUpdate, SpeakerNoteResponse,
    SharedPresentationCreate, SharedPresentationResponse,
    SchoolScheduleCreate, SchoolScheduleUpdate, SchoolScheduleResponse,
    TimeSlotResponse, TimetableEntryCreate, TimetableEntryUpdate, TimetableEntryResponse,
    SchemeOfWorkCreate, SchemeOfWorkUpdate, SchemeOfWorkResponse, SchemeOfWorkSummary,
    SchemeWeekCreate, SchemeWeekResponse, SchemeLessonCreate, SchemeLessonResponse, SchemeLessonUpdate,
    LessonPlanCreate, LessonPlanUpdate, LessonPlanResponse, LessonPlanSummary,
    RecordOfWorkCreate, RecordOfWorkUpdate, RecordOfWorkResponse, RecordOfWorkSummary,
    RecordOfWorkEntryCreate, RecordOfWorkEntryUpdate, RecordOfWorkEntryResponse,
    SystemAnnouncementCreate, SystemAnnouncementResponse,
    AdminUsersResponse, AdminUserSummary, AdminSubjectSummary,
    AdminRoleUpdate, ResetProgressRequest,
    TermsResponse, TermResponse, TermUpdate,
    UserSettingsUpdate, UserSettingsResponse,
    SchoolCreate, SchoolResponse, TeacherInvite, SchoolTeacherResponse,
    TeacherProfileCreate, TeacherProfileUpdate, TeacherProfileResponse, TeacherProfileLogoResponse
)
from auth import verify_password, get_password_hash, create_access_token, verify_token
from config import settings
from curriculum_importer import import_curriculum_from_json, get_imported_curricula
from cache_manager import cache, CacheTTL  # Redis caching layer

# Create tables (DISABLED - using SQL migrations instead)
# Base.metadata.create_all(bind=engine)
# Note: Run database/schema.sql and database/curriculum_templates_schema.sql manually

# Initialize FastAPI app
app = FastAPI(
    title="TeachTrack CBC API",
    description="API for TeachTrack CBC - Curriculum tracking for Kenyan teachers",
    version="1.0.0"
)

from fastapi.staticfiles import StaticFiles
from auth_routes import router as auth_router

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods including preflight variations
    allow_headers=["*"],
)

# Mount uploads directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth_router)

# Debug / CORS middleware to properly handle preflight requests (remove or simplify in production)
@app.middleware("http")
async def log_requests(request, call_next):
    # Handle CORS preflight explicitly
    if request.method == "OPTIONS":
        origin = request.headers.get("origin")
        acr_method = request.headers.get("access-control-request-method")
        acr_headers = request.headers.get("access-control-request-headers")
        print(f"[CORS PRELIGHT] path={request.url.path} origin={origin} req-method={acr_method} req-headers={acr_headers}")

        # Return a successful preflight response instead of 400
        allow_origin = origin or "*"
        allow_methods = "GET, POST, PUT, PATCH, DELETE, OPTIONS"

        # If browser specified requested headers, echo them back; otherwise allow common ones
        allow_headers = acr_headers or "Authorization, Content-Type, Accept, Range"

        return Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": allow_origin,
                "Access-Control-Allow-Methods": allow_methods,
                "Access-Control-Allow-Headers": allow_headers,
                "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges",
            },
        )

    # Non-OPTIONS requests go through as normal
    response = await call_next(request)

    # Ensure CORS headers are present on normal responses as well (mainly for dev convenience)
    origin = request.headers.get("origin")
    if origin:
        response.headers.setdefault("Access-Control-Allow-Origin", origin)
        response.headers.setdefault(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        )
        response.headers.setdefault(
            "Access-Control-Allow-Headers",
            "Authorization, Content-Type, Accept, Range",
        )
        response.headers.setdefault(
            "Access-Control-Expose-Headers",
            "Content-Range, Content-Length, Accept-Ranges",
        )

    return response

security = HTTPBearer()

# Dependency to get current user
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    email = verify_token(token)
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

def get_current_admin_user(
    current_user: User = Depends(get_current_user)
):
    """Dependency to check if current user is an admin (Super Admin or School Admin)"""
    # Check both legacy is_admin flag AND role-based access
    is_admin_by_role = current_user.role in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN]
    if not current_user.is_admin and not is_admin_by_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    return current_user


def ensure_user_terms(db: Session, user: User) -> List[Term]:
    """Ensure the current user has term data and one marked as current."""
    terms = db.query(Term).filter(Term.user_id == user.id).order_by(Term.term_number).all()
    if terms:
        has_current = any(term.is_current for term in terms)
        if not has_current and terms:
            terms[0].is_current = True
            db.commit()
            db.refresh(terms[0])
        return terms

    current_year = datetime.utcnow().year
    default_definitions = [
        {
            "term_number": 1,
            "term_name": "Term 1",
            "start_date": datetime(current_year, 1, 6, 0, 0, 0),
            "end_date": datetime(current_year, 4, 4, 23, 59, 59),
            "teaching_weeks": 14,
            "is_current": True,
        },
        {
            "term_number": 2,
            "term_name": "Term 2",
            "start_date": datetime(current_year, 5, 5, 0, 0, 0),
            "end_date": datetime(current_year, 8, 1, 23, 59, 59),
            "teaching_weeks": 12,
            "is_current": False,
        },
        {
            "term_number": 3,
            "term_name": "Term 3",
            "start_date": datetime(current_year, 9, 1, 0, 0, 0),
            "end_date": datetime(current_year, 11, 21, 23, 59, 59),
            "teaching_weeks": 10,
            "is_current": False,
        },
    ]

    for definition in default_definitions:
        term = Term(
            user_id=user.id,
            academic_year=str(current_year),
            **definition
        )
        db.add(term)

    db.commit()
    return db.query(Term).filter(Term.user_id == user.id).order_by(Term.term_number).all()


def get_active_schedule_or_fallback(
    db: Session,
    user: User,
    education_level: Optional[str] = None
) -> Optional[SchoolSchedule]:
    """Return the active schedule for a level, falling back to a generic one when missing."""
    base_query = db.query(SchoolSchedule).filter(
        SchoolSchedule.user_id == user.id,
        SchoolSchedule.is_active == True
    )

    normalized_level = education_level.strip() if education_level else None
    if normalized_level in {"", "all", "general"}:
        normalized_level = None

    schedule = None
    if normalized_level:
        schedule = base_query.filter(SchoolSchedule.education_level == normalized_level).first()

    if not schedule:
        schedule = base_query.filter(
            or_(SchoolSchedule.education_level == None, SchoolSchedule.education_level == "")
        ).first()

    if not schedule:
        schedule = base_query.order_by(SchoolSchedule.created_at.desc()).first()

    return schedule


def schedule_has_entries(
    db: Session,
    user_id: int,
    schedule_id: int,
    day_of_week: Optional[int] = None
) -> bool:
    """Check whether a schedule already has timetable entries (optionally for a given day)."""
    query = db.query(TimetableEntry.id).filter(
        TimetableEntry.user_id == user_id,
        TimetableEntry.schedule_id == schedule_id
    )
    if day_of_week:
        query = query.filter(TimetableEntry.day_of_week == day_of_week)
    return query.first() is not None


def resolve_schedule_for_context(
    db: Session,
    user: User,
    education_level: Optional[str] = None,
    day_of_week: Optional[int] = None
) -> Optional[SchoolSchedule]:
    """Prefer the schedule that already has entries when no explicit level is provided."""
    schedule = get_active_schedule_or_fallback(db, user, education_level)
    if not schedule:
        return None
    if education_level:
        return schedule
    if schedule_has_entries(db, user.id, schedule.id, day_of_week):
        return schedule
    alt_query = db.query(SchoolSchedule).join(
        TimetableEntry,
        TimetableEntry.schedule_id == SchoolSchedule.id
    ).filter(
        SchoolSchedule.user_id == user.id,
        SchoolSchedule.is_active == True
    )
    if day_of_week:
        alt_query = alt_query.filter(TimetableEntry.day_of_week == day_of_week)
    alt_schedule = alt_query.order_by(
        SchoolSchedule.updated_at.desc(),
        SchoolSchedule.created_at.desc()
    ).first()
    return alt_schedule or schedule

def get_current_super_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to verify the user is a Super Admin."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Super Admin access required"
        )
    return current_user

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to verify the user is an Admin (Super Admin or School Admin)."""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return current_user

# Health check
@app.get("/")
def read_root():
    return {"message": "TeachTrack CBC API is running", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "API is running"}

# Remove explicit OPTIONS handler; CORSMiddleware will manage it.

# Auth endpoints
@app.post(f"{settings.API_V1_PREFIX}/auth/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    
    # Determine role and subscription
    role = UserRole.TEACHER
    subscription_type = SubscriptionType.INDIVIDUAL_BASIC
    
    if user_data.role == "SCHOOL_ADMIN":
        role = UserRole.SCHOOL_ADMIN
        # School admins don't have a subscription type yet, or it's implied by the school they create
    
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        phone=user_data.phone,
        school=user_data.school,
        grade_level=user_data.grade_level,
        email_verified=True,  # Auto-verify for now
        role=role,
        subscription_type=subscription_type
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@app.post(f"{settings.API_V1_PREFIX}/auth/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# Explicit preflight for login (defensive; CORSMiddleware should handle but some clients are picky)
@app.options(f"{settings.API_V1_PREFIX}/auth/login")
def options_login():
    # 204 No Content with appropriate CORS headers will be added by CORSMiddleware
    return Response(status_code=204)

@app.get(f"{settings.API_V1_PREFIX}/auth/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@app.post(f"{settings.API_V1_PREFIX}/auth/google-auth", response_model=dict)
def google_auth(google_data: GoogleAuth, db: Session = Depends(get_db)):
    # Check if user exists by email
    user = db.query(User).filter(User.email == google_data.email).first()
    
    if user:
        # User exists, update Google ID if not set
        if not user.google_id:
            user.google_id = google_data.google_id
            user.auth_provider = "google"
            user.email_verified = True
            db.commit()
            db.refresh(user)
    else:
        # Create new user from Google data
        user = User(
            email=google_data.email,
            full_name=google_data.full_name,
            google_id=google_data.google_id,
            auth_provider="google",
            email_verified=True,
            password_hash=None,  # No password for OAuth users
            role=UserRole.TEACHER,
            subscription_type=SubscriptionType.INDIVIDUAL_BASIC
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "auth_provider": user.auth_provider,
            "role": user.role,
            "subscription_type": user.subscription_type
        }
    }


# ============================================================================
# SCHOOL ENDPOINTS
# ============================================================================

@app.post(f"{settings.API_V1_PREFIX}/schools", response_model=SchoolResponse)
def create_school(
    school_data: SchoolCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify user is School Admin
    if current_user.role != UserRole.SCHOOL_ADMIN:
        raise HTTPException(status_code=403, detail="Only School Admins can create schools")
    
    # Check if user already manages a school
    existing_school = db.query(School).filter(School.admin_id == current_user.id).first()
    if existing_school:
        raise HTTPException(status_code=400, detail="You already manage a school")
        
    new_school = School(
        name=school_data.name,
        admin_id=current_user.id,
        max_teachers=school_data.max_teachers,
        teacher_counts_by_level=school_data.teacher_counts_by_level,
        subscription_status=SubscriptionStatus.ACTIVE  # Auto-activate for trial
    )
    
    db.add(new_school)
    db.commit()
    db.refresh(new_school)
    
    # Link admin to school
    current_user.school_id = new_school.id
    current_user.subscription_type = SubscriptionType.SCHOOL_SPONSORED
    db.commit()
    
    return new_school

@app.get(f"{settings.API_V1_PREFIX}/schools/me", response_model=SchoolResponse)
def get_my_school(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.school_id:
        raise HTTPException(status_code=404, detail="You are not part of any school")
        
    school = db.query(School).filter(School.id == current_user.school_id).first()
    return school

@app.post(f"{settings.API_V1_PREFIX}/schools/teachers", response_model=SchoolTeacherResponse)
def invite_teacher(
    invite_data: TeacherInvite,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify user is School Admin
    if current_user.role != UserRole.SCHOOL_ADMIN:
        raise HTTPException(status_code=403, detail="Only School Admins can invite teachers")
        
    school = db.query(School).filter(School.admin_id == current_user.id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
        
    # Check capacity
    current_count = db.query(User).filter(User.school_id == school.id).count()
    if current_count >= school.max_teachers:
        raise HTTPException(status_code=403, detail="School teacher limit reached")
        
    # Find user
    teacher = db.query(User).filter(User.email == invite_data.email).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="User not found. Ask them to register first.")
        
    if teacher.school_id:
        raise HTTPException(status_code=400, detail="User is already in a school")
        
    # Add to school
    teacher.school_id = school.id
    teacher.subscription_type = SubscriptionType.SCHOOL_SPONSORED
    teacher.role = UserRole.TEACHER
    db.commit()
    db.refresh(teacher)
    
    return teacher

@app.get(f"{settings.API_V1_PREFIX}/schools/teachers", response_model=List[SchoolTeacherResponse])
def get_school_teachers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.school_id:
        raise HTTPException(status_code=404, detail="You are not part of any school")
        
    teachers = db.query(User).filter(User.school_id == current_user.school_id).all()
    return teachers

@app.delete(f"{settings.API_V1_PREFIX}/schools/teachers/{{teacher_id}}")
def remove_teacher(
    teacher_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.SCHOOL_ADMIN:
        raise HTTPException(status_code=403, detail="Only School Admins can remove teachers")
        
    teacher = db.query(User).filter(User.id == teacher_id, User.school_id == current_user.school_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found in your school")
        
    # Remove from school
    teacher.school_id = None
    teacher.subscription_type = SubscriptionType.INDIVIDUAL_BASIC
    db.commit()
    
    return {"message": "Teacher removed from school"}

# ============================================================================
# TEACHER PROFILE ENDPOINTS (For Independent Teachers)
# ============================================================================

def get_user_school_context(user: User, db: Session) -> dict:
    """
    Get school context for a user - either from SchoolSettings or TeacherProfile.
    
    Returns a dict with standardized fields for use in document generation.
    - If user is linked to a school (school_id) → Use SchoolSettings
    - If user is independent (no school_id) → Use TeacherProfile
    """
    if user.school_id:
        # User is linked to a school - try to find SchoolSettings
        # Note: SchoolSettings might not be linked to School yet, so we get the first one
        school = db.query(School).filter(School.id == user.school_id).first()
        school_settings = db.query(SchoolSettings).first()  # For now, get the global one
        
        if school_settings:
            return {
                "school_name": school_settings.school_name or (school.name if school else None),
                "school_logo_url": school_settings.school_logo_url,
                "school_address": school_settings.school_address,
                "school_phone": school_settings.school_phone,
                "school_email": school_settings.school_email,
                "school_motto": school_settings.school_motto,
                "principal_name": school_settings.principal_name,
                "deputy_principal_name": school_settings.deputy_principal_name,
                "county": school_settings.county,
                "sub_county": school_settings.sub_county,
                "school_type": school_settings.school_type,
                "grades_offered": school_settings.grades_offered,
                "streams_per_grade": school_settings.streams_per_grade,
                "source": "school_settings"
            }
        elif school:
            # Fallback to just school name
            return {
                "school_name": school.name,
                "school_logo_url": None,
                "school_address": None,
                "school_phone": None,
                "school_email": None,
                "school_motto": None,
                "principal_name": None,
                "deputy_principal_name": None,
                "county": None,
                "sub_county": None,
                "school_type": None,
                "grades_offered": None,
                "streams_per_grade": None,
                "source": "school"
            }
    else:
        # Independent teacher - use TeacherProfile
        profile = db.query(TeacherProfile).filter(
            TeacherProfile.user_id == user.id
        ).first()
        
        if profile:
            return {
                "school_name": profile.school_name,
                "school_logo_url": profile.school_logo_url,
                "school_address": profile.school_address,
                "school_phone": profile.school_phone,
                "school_email": profile.school_email,
                "school_motto": profile.school_motto,
                "principal_name": profile.principal_name,
                "deputy_principal_name": profile.deputy_principal_name,
                "county": profile.county,
                "sub_county": profile.sub_county,
                "school_type": profile.school_type,
                "grades_offered": profile.grades_offered,
                "streams_per_grade": profile.streams_per_grade,
                "source": "teacher_profile"
            }
    
    # No settings found - return None
    return None


def get_default_lesson_config(user: User, db: Session) -> dict:
    """Get default lesson configuration for a user from their TeacherProfile."""
    
    # Check TeacherProfile
    profile = db.query(TeacherProfile).filter(
        TeacherProfile.user_id == user.id
    ).first()
    
    if profile:
        return {
            "lessons_per_week": profile.default_lessons_per_week,
            "lesson_duration": profile.default_lesson_duration,
            "double_lesson_duration": profile.default_double_lesson_duration,
            "double_lessons_per_week": profile.default_double_lessons_per_week,
            "term_weeks": profile.default_term_weeks
        }
    
    # Return system defaults
    return {
        "lessons_per_week": 5,
        "lesson_duration": 40,
        "double_lesson_duration": 80,
        "double_lessons_per_week": 0,
        "term_weeks": 13
    }


@app.get(f"{settings.API_V1_PREFIX}/profile/settings", response_model=TeacherProfileResponse)
def get_teacher_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the current teacher's profile settings.
    
    This endpoint is for independent teachers to retrieve their profile.
    School-linked teachers should use school settings instead.
    """
    
    # Get existing profile
    profile = db.query(TeacherProfile).filter(
        TeacherProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found. Please create your profile settings first."
        )
    
    return profile


@app.post(f"{settings.API_V1_PREFIX}/profile/settings", response_model=TeacherProfileResponse)
def create_or_update_teacher_profile(
    profile_data: TeacherProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or update teacher profile settings.
    
    This endpoint is for ALL teachers to configure their profile.
    Even school-linked teachers can have a profile for personal settings.
    """
    
    # Check if profile exists
    profile = db.query(TeacherProfile).filter(
        TeacherProfile.user_id == current_user.id
    ).first()
    
    if profile:
        # Update existing profile
        update_data = profile_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            if hasattr(profile, key):
                setattr(profile, key, value)
    else:
        # Create new profile
        profile = TeacherProfile(
            user_id=current_user.id,
            **profile_data.dict()
        )
        db.add(profile)
    
    db.commit()
    db.refresh(profile)
    
    return profile


@app.post(f"{settings.API_V1_PREFIX}/profile/upload-logo", response_model=TeacherProfileLogoResponse)
async def upload_profile_logo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload school logo for teacher profile.
    
    - Max file size: 2MB
    - Supported formats: PNG, JPG, JPEG, SVG, GIF
    """
    import time
    
    # Validate file type
    allowed_types = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/gif']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: PNG, JPG, JPEG, SVG, GIF"
        )
    
    # Read file contents
    contents = await file.read()
    
    # Validate file size (max 2MB)
    max_size = 2 * 1024 * 1024  # 2MB
    if len(contents) > max_size:
        raise HTTPException(
            status_code=400,
            detail="File size must be less than 2MB"
        )
    
    # Create upload directory if not exists
    upload_dir = "uploads/profile_logos"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1] if file.filename else '.png'
    unique_filename = f"logo_{current_user.id}_{int(time.time())}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Get or create profile
    profile = db.query(TeacherProfile).filter(
        TeacherProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        profile = TeacherProfile(user_id=current_user.id)
        db.add(profile)
    
    # Delete old logo if exists
    if profile.school_logo_url:
        old_path = profile.school_logo_url.lstrip('/')
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except:
                pass  # Ignore errors when deleting old file
    
    # Update logo URL
    profile.school_logo_url = f"/{upload_dir}/{unique_filename}"
    db.commit()
    db.refresh(profile)
    
    return TeacherProfileLogoResponse(
        message="Logo uploaded successfully",
        logo_url=profile.school_logo_url
    )


@app.delete(f"{settings.API_V1_PREFIX}/profile/logo")
def delete_profile_logo(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete school logo from teacher profile."""
    
    profile = db.query(TeacherProfile).filter(
        TeacherProfile.user_id == current_user.id
    ).first()
    
    if not profile or not profile.school_logo_url:
        raise HTTPException(
            status_code=404,
            detail="No logo found to delete"
        )
    
    # Delete file from disk
    file_path = profile.school_logo_url.lstrip('/')
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Warning: Could not delete file {file_path}: {e}")
    
    # Remove URL from database
    profile.school_logo_url = None
    db.commit()
    
    return {"message": "Logo deleted successfully"}


@app.get(f"{settings.API_V1_PREFIX}/profile/school-context")
def get_school_context(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the school context for the current user.
    
    This automatically determines whether to use:
    - SchoolSettings (if user is linked to a school)
    - TeacherProfile (if user is independent)
    
    Returns standardized fields for document generation.
    """
    context = get_user_school_context(current_user, db)
    
    if not context:
        return {
            "has_context": False,
            "message": "No school context found. Please configure your profile settings.",
            "is_school_linked": current_user.school_id is not None
        }
    
    return {
        "has_context": True,
        "is_school_linked": current_user.school_id is not None,
        **context
    }


@app.get(f"{settings.API_V1_PREFIX}/profile/lesson-defaults")
def get_lesson_defaults(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get default lesson configuration for the current user.
    
    Used when creating new subjects to pre-fill lesson settings.
    """
    config = get_default_lesson_config(current_user, db)
    
    return {
        "has_profile": db.query(TeacherProfile).filter(
            TeacherProfile.user_id == current_user.id
        ).first() is not None,
        **config
    }


@app.get(f"{settings.API_V1_PREFIX}/profile/lessons-config")
def get_teacher_lessons_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all lesson configurations for the current teacher.
    
    Returns teacher-specific configs, or falls back to global/admin configs.
    """
    # Get teacher's custom configs
    teacher_configs = db.query(TeacherLessonConfig).filter(
        TeacherLessonConfig.user_id == current_user.id
    ).all()
    
    configs = []
    for config in teacher_configs:
        configs.append({
            "subject_name": config.subject_name,
            "grade": config.grade,
            "lessons_per_week": config.lessons_per_week,
            "double_lessons_per_week": config.double_lessons_per_week,
            "single_lesson_duration": config.single_lesson_duration,
            "double_lesson_duration": config.double_lesson_duration,
        })
    
    return {"configs": configs}


@app.post(f"{settings.API_V1_PREFIX}/profile/lessons-config")
def save_teacher_lesson_config(
    config_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save a lesson configuration for a specific subject/grade.
    
    Creates or updates the teacher's custom lesson config.
    """
    subject_name = config_data.get("subject_name")
    grade = config_data.get("grade")
    
    if not subject_name or not grade:
        raise HTTPException(
            status_code=400,
            detail="subject_name and grade are required"
        )
    
    # Check if config exists
    existing = db.query(TeacherLessonConfig).filter(
        TeacherLessonConfig.user_id == current_user.id,
        TeacherLessonConfig.subject_name == subject_name,
        TeacherLessonConfig.grade == grade
    ).first()
    
    if existing:
        # Update existing
        existing.lessons_per_week = config_data.get("lessons_per_week", 5)
        existing.double_lessons_per_week = config_data.get("double_lessons_per_week", 0)
        existing.single_lesson_duration = config_data.get("single_lesson_duration", 40)
        existing.double_lesson_duration = config_data.get("double_lesson_duration", 80)
    else:
        # Create new
        new_config = TeacherLessonConfig(
            user_id=current_user.id,
            subject_name=subject_name,
            grade=grade,
            lessons_per_week=config_data.get("lessons_per_week", 5),
            double_lessons_per_week=config_data.get("double_lessons_per_week", 0),
            single_lesson_duration=config_data.get("single_lesson_duration", 40),
            double_lesson_duration=config_data.get("double_lesson_duration", 80),
        )
        db.add(new_config)
    
    db.commit()
    
    return {"message": "Configuration saved successfully"}


# ============================================================================
# SUPER ADMIN ENDPOINTS
# ============================================================================

@app.get(f"{settings.API_V1_PREFIX}/admin/stats")
def get_platform_stats(
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Get overall platform statistics."""
    total_users = db.query(User).count()
    total_teachers = db.query(User).filter(User.role == UserRole.TEACHER).count()
    total_school_admins = db.query(User).filter(User.role == UserRole.SCHOOL_ADMIN).count()
    total_schools = db.query(School).count()
    total_subjects = db.query(Subject).count()
    
    # Subscription breakdown
    basic_users = db.query(User).filter(User.subscription_type == SubscriptionType.INDIVIDUAL_BASIC).count()
    premium_users = db.query(User).filter(User.subscription_type == SubscriptionType.INDIVIDUAL_PREMIUM).count()
    school_sponsored = db.query(User).filter(User.subscription_type == SubscriptionType.SCHOOL_SPONSORED).count()
    
    return {
        "total_users": total_users,
        "total_teachers": total_teachers,
        "total_school_admins": total_school_admins,
        "total_schools": total_schools,
        "total_subjects": total_subjects,
        "subscriptions": {
            "basic": basic_users,
            "premium": premium_users,
            "school_sponsored": school_sponsored
        }
    }

# NOTE: Admin users endpoint moved to line ~2760 to consolidate with subject loading

@app.get(f"{settings.API_V1_PREFIX}/admin/schools")
def get_all_schools(
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Get all schools."""
    schools = db.query(School).all()
    
    result = []
    for school in schools:
        teacher_count = db.query(User).filter(User.school_id == school.id).count()
        admin = db.query(User).filter(User.id == school.admin_id).first()
        
        result.append({
            "id": school.id,
            "name": school.name,
            "admin_email": admin.email if admin else None,
            "teacher_count": teacher_count,
            "max_teachers": school.max_teachers,
            "subscription_status": school.subscription_status,
            "created_at": school.created_at
        })
    
    return result

@app.put(f"{settings.API_V1_PREFIX}/admin/users/{{user_id}}/upgrade")
def upgrade_user(
    user_id: int,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Manually upgrade a user to Premium."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.subscription_type == SubscriptionType.SCHOOL_SPONSORED:
        raise HTTPException(status_code=400, detail="Cannot upgrade school-sponsored users")
        
    user.subscription_type = SubscriptionType.INDIVIDUAL_PREMIUM
    user.subscription_status = SubscriptionStatus.ACTIVE
    db.commit()
    
    return {"message": f"User {user.email} upgraded to Premium"}

@app.put(f"{settings.API_V1_PREFIX}/admin/users/{{user_id}}/role", response_model=dict)
def update_user_role(
    user_id: int,
    role_update: AdminRoleUpdate,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Update a user's role."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent changing other super admins
    if user.role == UserRole.SUPER_ADMIN and user.id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot modify other Super Admins")
        
    user.role = role_update.role
    db.commit()
    
    return {"message": f"User role updated to {role_update.role}"}

@app.delete(f"{settings.API_V1_PREFIX}/admin/users/{{user_id}}")
def ban_user(
    user_id: int,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Ban a user (set subscription to INACTIVE)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.role == UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot ban Super Admins")
        
    user.subscription_status = SubscriptionStatus.CANCELLED
    db.commit()
    
    return {"message": f"User {user.email} has been banned"}

# Subject endpoints
@app.get(f"{settings.API_V1_PREFIX}/subjects", response_model=List[SubjectResponse])
def get_subjects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check cache first (30-minute TTL)
    cache_key = f"subjects:user:{current_user.id}"
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    # Query database
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    
    # Cache the result
    cache.set(cache_key, [s.__dict__ for s in subjects], CacheTTL.LIST_DATA)
    
    return subjects

@app.get(f"{settings.API_V1_PREFIX}/subjects/{{subject_id}}")
def get_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Eager load strands and sub-strands
    subject = db.query(Subject).options(
        joinedload(Subject.strands).joinedload(Strand.sub_strands)
    ).filter(
        Subject.id == subject_id,
        Subject.user_id == current_user.id
    ).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Format response with nested strands and sub-strands
    result = {
        "id": subject.id,
        "subject_name": subject.subject_name,
        "grade": subject.grade,
        "total_lessons": subject.total_lessons,
        "lessons_completed": subject.lessons_completed,
        "progress_percentage": subject.progress_percentage,
        "strands": []
    }
    
    for strand in sorted(subject.strands, key=lambda x: x.sequence_order):
        strand_data = {
            "id": strand.id,
            "strand_code": strand.strand_code,
            "strand_name": strand.strand_name,
            "sequence_order": strand.sequence_order,
            "sub_strands": []
        }
        
        for sub_strand in sorted(strand.sub_strands, key=lambda x: x.sequence_order):
            sub_strand_data = {
                "id": sub_strand.id,
                "substrand_code": sub_strand.substrand_code,
                "substrand_name": sub_strand.substrand_name,
                "lessons_count": sub_strand.lessons_count,
                "learning_outcomes": sub_strand.learning_outcomes,
                "key_inquiry_questions": sub_strand.key_inquiry_questions,
                "specific_learning_outcomes": sub_strand.specific_learning_outcomes,
                "suggested_learning_experiences": sub_strand.suggested_learning_experiences,
                "core_competencies": sub_strand.core_competencies,
                "values": sub_strand.values,
                "pcis": sub_strand.pcis,
                "links_to_other_subjects": sub_strand.links_to_other_subjects,
                "sequence_order": sub_strand.sequence_order
            }
            strand_data["sub_strands"].append(sub_strand_data)
        
        result["strands"].append(strand_data)
    
    return result

@app.get(f"{settings.API_V1_PREFIX}/subjects/{{subject_id}}/strands")
def get_subject_strands(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify subject exists and belongs to user
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Get strands with sub-strands
    strands = db.query(Strand).filter(Strand.subject_id == subject_id).order_by(Strand.sequence_order).all()
    
    result = []
    for strand in strands:
        sub_strands = db.query(SubStrand).filter(SubStrand.strand_id == strand.id).order_by(SubStrand.sequence_order).all()
        result.append({
            "id": strand.id,
            "strand_name": strand.strand_name,
            "strand_code": strand.strand_code,
            "description": strand.description,
            "sequence_order": strand.sequence_order,
            "sub_strands": [
                {
                    "id": ss.id,
                    "substrand_name": ss.substrand_name,
                    "substrand_code": ss.substrand_code,
                    "lessons_count": ss.lessons_count,
                    "key_inquiry_questions": ss.key_inquiry_questions,
                    "specific_learning_outcomes": ss.specific_learning_outcomes,
                    "suggested_learning_experiences": ss.suggested_learning_experiences,
                    "core_competencies": ss.core_competencies,
                    "values": ss.values,
                    "pcis": ss.pcis,
                    "links_to_other_subjects": ss.links_to_other_subjects,
                    "sequence_order": ss.sequence_order
                }
                for ss in sub_strands
            ]
        })
    
    return result

@app.get(f"{settings.API_V1_PREFIX}/subjects/{{subject_id}}/lessons")
def get_subject_lessons(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all lessons for a subject flattened"""
    # Verify subject belongs to user
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.user_id == current_user.id
    ).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Get all lessons for this subject
    lessons = db.query(Lesson).join(SubStrand).join(Strand).filter(
        Strand.subject_id == subject_id
    ).order_by(Lesson.sequence_order).all()
    
    return {"lessons": lessons, "count": len(lessons)}

@app.post(f"{settings.API_V1_PREFIX}/subjects", response_model=SubjectResponse)
def create_subject(
    subject_data: SubjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # SaaS: Check Subject Limits for Individual Basic Plan
    if current_user.subscription_type == SubscriptionType.INDIVIDUAL_BASIC:
        # Count existing subjects
        subject_count = db.query(Subject).filter(Subject.user_id == current_user.id).count()
        if subject_count >= 4:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Basic Plan is limited to 4 subjects. Please upgrade to Premium to add more."
            )
    
    # Create the basic subject
    new_subject = Subject(
        user_id=current_user.id,
        subject_name=subject_data.subject_name,
        grade=subject_data.grade,
        curriculum_pdf_url=subject_data.curriculum_pdf_url,
        total_lessons=0,
        lessons_completed=0,
        progress_percentage=0.0
    )
    
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    
    # Check for matching curriculum template
    template = db.query(CurriculumTemplate).filter(
        CurriculumTemplate.subject == subject_data.subject_name,
        CurriculumTemplate.grade == subject_data.grade,
        CurriculumTemplate.is_active == True
    ).first()
    
    if template:
        # Link template to subject
        new_subject.template_id = template.id
        
        # Copy strands and sub-strands
        template_strands = db.query(TemplateStrand).filter(
            TemplateStrand.curriculum_template_id == template.id
        ).order_by(TemplateStrand.sequence_order).all()
        
        total_lessons_count = 0
        
        for t_strand in template_strands:
            # Create user strand
            new_strand = Strand(
                subject_id=new_subject.id,
                strand_code=t_strand.strand_number,
                strand_name=t_strand.strand_name,
                sequence_order=t_strand.sequence_order,
                description=""
            )
            db.add(new_strand)
            db.flush()  # Get ID
            
            # Get template sub-strands
            template_substrands = db.query(TemplateSubstrand).filter(
                TemplateSubstrand.strand_id == t_strand.id
            ).order_by(TemplateSubstrand.sequence_order).all()
            
            for t_substrand in template_substrands:
                # Create user sub-strand
                new_substrand = SubStrand(
                    strand_id=new_strand.id,
                    substrand_code=t_substrand.substrand_number,
                    substrand_name=t_substrand.substrand_name,
                    sequence_order=t_substrand.sequence_order,
                    lessons_count=t_substrand.number_of_lessons,
                    # Copy curriculum details
                    specific_learning_outcomes=t_substrand.specific_learning_outcomes,
                    suggested_learning_experiences=t_substrand.suggested_learning_experiences,
                    key_inquiry_questions=t_substrand.key_inquiry_questions,
                    core_competencies=t_substrand.core_competencies,
                    values=t_substrand.values,
                    pcis=t_substrand.pcis,
                    links_to_other_subjects=t_substrand.links_to_other_subjects
                )
                db.add(new_substrand)
                db.flush()  # Get ID
                
                # Create placeholder lessons
                num_lessons = t_substrand.number_of_lessons
                total_lessons_count += num_lessons
                
                for i in range(1, num_lessons + 1):
                    new_lesson = Lesson(
                        substrand_id=new_substrand.id,
                        lesson_number=i,
                        lesson_title=f"Lesson {i}",
                        sequence_order=i,
                        is_completed=False
                    )
                    db.add(new_lesson)
        
        # Update total lessons count
        new_subject.total_lessons = total_lessons_count
        db.commit()
        db.refresh(new_subject)
    
    # Invalidate cache for this user's subjects
    cache.delete(f"subjects:user:{current_user.id}")
    
    return new_subject

@app.delete(f"{settings.API_V1_PREFIX}/subjects/{{subject_id}}")
def delete_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.user_id == current_user.id
    ).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    db.delete(subject)
    db.commit()
    
    return {"message": "Subject deleted successfully"}

# Progress endpoints
@app.post(f"{settings.API_V1_PREFIX}/progress/mark-complete", response_model=ProgressLogResponse)
def mark_lesson_complete(
    progress_data: ProgressLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Update lesson status
    lesson = db.query(Lesson).filter(Lesson.id == progress_data.lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    from datetime import datetime
    lesson.is_completed = True
    lesson.completed_at = datetime.utcnow()
    
    # Create progress log
    progress_log = ProgressLog(
        user_id=current_user.id,
        subject_id=progress_data.subject_id,
        lesson_id=progress_data.lesson_id,
        action=progress_data.action,
        notes=progress_data.notes
    )
    
    # Update subject progress
    subject = db.query(Subject).filter(Subject.id == progress_data.subject_id).first()
    if subject:
        subject.lessons_completed += 1
        if subject.total_lessons > 0:
            subject.progress_percentage = (subject.lessons_completed / subject.total_lessons) * 100
    
    db.add(progress_log)
    db.commit()
    db.refresh(progress_log)
    
    return progress_log

# Notes endpoints
@app.get(f"{settings.API_V1_PREFIX}/notes", response_model=List[NoteResponse])
def get_notes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notes = db.query(Note).filter(Note.user_id == current_user.id).all()
    return notes

@app.post(f"{settings.API_V1_PREFIX}/notes", response_model=NoteResponse)
def create_note(
    note_data: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_note = Note(
        user_id=current_user.id,
        **note_data.dict()
    )
    
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    
    return new_note

# ============================================================================
# FILE UPLOAD ENDPOINTS (Cloudinary Storage)
# ============================================================================

import cloudinary_storage
import secrets

@app.post(f"{settings.API_V1_PREFIX}/notes/upload")
async def upload_note_file(
    file: UploadFile = File(...),
    title: str = Form(...),
    subject_id: int = Form(None),
    strand_id: int = Form(None),
    substrand_id: int = Form(None),
    lesson_id: int = Form(None),
    description: str = Form(None),
    tags: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload teaching note/resource file to Cloudinary
    Supports: PDF, DOCX, PPTX, Images, Videos
    """
    
    # Check if Cloudinary is configured
    if not cloudinary_storage.IS_CONFIGURED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="File storage service is not available"
        )
    
    # Validate subject belongs to user (if provided)
    if subject_id:
        subject = db.query(Subject).filter(
            Subject.id == subject_id,
            Subject.user_id == current_user.id
        ).first()
        
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found"
            )
    
    # Get file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    # Validate file size
    if file_size > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({file_size / 1024 / 1024:.2f}MB) exceeds maximum allowed ({settings.MAX_FILE_SIZE_MB}MB)"
        )
    
    # Validate file type
    file_extension = os.path.splitext(file.filename)[1].lower().replace('.', '')
    if file_extension not in settings.ALLOWED_FILE_TYPES_LIST:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type .{file_extension} not allowed. Allowed types: {', '.join(settings.ALLOWED_FILE_TYPES_LIST)}"
        )
    
    try:
        # Read file bytes for upload
        file_content = await file.read()

        # Create a unique public_id for Cloudinary
        timestamp = int(datetime.now().timestamp())
        safe_filename = "".join(c for c in os.path.splitext(file.filename)[0] if c.isalnum() or c in (' ', '_')).rstrip()
        # Keep folder separate to avoid double 'notes' nesting; include extension for proper resource_type
        public_id = f"{current_user.id}/{timestamp}_{safe_filename}.{file_extension}"

        # Upload to Cloudinary
        upload_result = cloudinary_storage.upload_file(
            file_content=file_content,
            public_id=public_id,
            folder="notes"
        )

        if not upload_result or "secure_url" not in upload_result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed: {upload_result.get('error', {}).get('message', 'Unknown error')}"
            )
        
        file_url = upload_result["secure_url"]
        
        # Generate thumbnail URL
        thumbnail_url = cloudinary_storage.get_thumbnail_url(
            public_id=upload_result["public_id"],
            file_type=file_extension
        )
        
        # Save to database
        new_note = Note(
            user_id=current_user.id,
            subject_id=subject_id,
            strand_id=strand_id,
            substrand_id=substrand_id,
            lesson_id=lesson_id,
            title=title,
            file_type=file_extension,
            file_url=file_url,
            file_size_bytes=file_size,
            thumbnail_url=thumbnail_url,
            description=description,
            tags=tags,
            is_favorite=False,
            view_count=0
        )
        
        db.add(new_note)
        db.commit()
        db.refresh(new_note)
        
        return {
            "success": True,
            "message": "File uploaded successfully",
            "note": {
                "id": new_note.id,
                "title": new_note.title,
                "file_url": new_note.file_url,
                "file_type": new_note.file_type,
                "file_size_bytes": file_size,
                "file_size_mb": round(file_size / 1024 / 1024, 2),
                "thumbnail_url": thumbnail_url,
                "subject_id": subject_id,
                "created_at": new_note.created_at.isoformat() if new_note.created_at else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload error: {str(e)}"
        )

@app.delete(f"{settings.API_V1_PREFIX}/notes/{{note_id}}")
def delete_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete note and remove files from Cloudinary"""
    
    # Find note
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    # Delete from Cloudinary if file exists
    if note.file_url and cloudinary_storage.IS_CONFIGURED:
        try:
            public_id = cloudinary_storage.extract_public_id_from_url(note.file_url)
            if public_id:
                resource_type = "raw" if note.file_type in ['pdf', 'docx', 'pptx', 'xlsx'] else "auto"
                cloudinary_storage.delete_file(public_id, resource_type=resource_type)
                
        except Exception as e:
            print(f"Error deleting file from Cloudinary: {str(e)}")
            # Continue with database deletion even if Cloudinary deletion fails
    
    # Delete from database
    db.delete(note)
    db.commit()
    
    return {
        "success": True,
        "message": "Note deleted successfully"
    }

@app.get(f"{settings.API_V1_PREFIX}/notes/{{note_id}}")
def get_note_detail(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get note details and increment view count"""
    
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    # Increment view count
    note.view_count += 1
    note.last_viewed_at = datetime.now()
    db.commit()
    db.refresh(note)
    
    return {
        "id": note.id,
        "title": note.title,
        "description": note.description,
        "file_url": note.file_url,
        "file_type": note.file_type,
        "file_size_bytes": note.file_size_bytes,
        "file_size_mb": round(note.file_size_bytes / 1024 / 1024, 2) if note.file_size_bytes else 0,
        "thumbnail_url": note.thumbnail_url,
        "tags": note.tags,
        "is_favorite": note.is_favorite,
        "view_count": note.view_count,
        "last_viewed_at": note.last_viewed_at.isoformat() if note.last_viewed_at else None,
        "created_at": note.created_at.isoformat() if note.created_at else None,
        "subject_id": note.subject_id,
        "strand_id": note.strand_id,
        "substrand_id": note.substrand_id,
        "lesson_id": note.lesson_id
    }

@app.patch(f"{settings.API_V1_PREFIX}/notes/{{note_id}}/favorite")
def toggle_note_favorite(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle note favorite status"""
    
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    note.is_favorite = not note.is_favorite
    db.commit()
    db.refresh(note)
    
    return {
        "success": True,
        "is_favorite": note.is_favorite,
        "message": f"Note {'added to' if note.is_favorite else 'removed from'} favorites"
    }

# Curriculum upload endpoint
import shutil
from curriculum_parser import CurriculumParser

UPLOAD_DIR = "uploads/curriculum"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post(f"{settings.API_V1_PREFIX}/curriculum/upload")
async def upload_curriculum(
    file: UploadFile = File(...),
    grade: str = Form(...),
    learning_area: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and parse a CBC curriculum document (PDF or DOCX)
    """
    # Validate file type
    allowed_extensions = ['.pdf', '.docx', '.doc']
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Only PDF and DOCX files are allowed."
        )
    
    # Validate file size (10MB max)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be less than 10MB"
        )
    
    try:
        # Save uploaded file
        file_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse curriculum (debug=True to diagnose extraction)
        parser = CurriculumParser(debug=True)
        
        if file_extension == '.pdf':
            curriculum_data = parser.parse_pdf(file_path, grade, learning_area)
        else:  # .docx or .doc
            curriculum_data = parser.parse_docx(file_path, grade, learning_area)

        # Capture parse warnings if any and whether defaults were used
        parse_warnings = curriculum_data.get("parseWarnings", [])
        used_default = False
        if curriculum_data.get("strands"):
            # If only one default strand with default name exists, mark as default
            first = curriculum_data["strands"][0]
            if first.get("strandName") == "Main Content" and len(curriculum_data["strands"]) == 1:
                used_default = True
        
        # Count total lessons
        total_lessons = parser.count_total_lessons(curriculum_data)
        
        # Create subject entry
        new_subject = Subject(
            user_id=current_user.id,
            subject_name=learning_area,
            grade=grade,
            curriculum_pdf_url=file_path,
            total_lessons=total_lessons,
            lessons_completed=0,
            progress_percentage=0.0
        )
        
        db.add(new_subject)
        db.commit()
        db.refresh(new_subject)
        
        # Save strands, sub-strands, and lessons to database
        for strand_index, strand_data in enumerate(curriculum_data.get("strands", [])):
            strand = Strand(
                subject_id=new_subject.id,
                strand_code=strand_data.get("strandNumber", f"{strand_index + 1}.0"),
                strand_name=strand_data["strandName"],
                description=strand_data.get("theme"),  # Store theme in description
                sequence_order=strand_index + 1
            )
            db.add(strand)
            db.commit()
            db.refresh(strand)
            
            for substrand_index, substrand_data in enumerate(strand_data.get("subStrands", [])):
                # Get SLOs and determine actual lesson count
                slos = substrand_data.get("specificLearningOutcomes", [])
                actual_lesson_count = len(slos) if slos else substrand_data.get("numberOfLessons", 1)
                
                substrand = SubStrand(
                    strand_id=strand.id,
                    substrand_code=substrand_data.get("subStrandNumber", f"{strand_index + 1}.{substrand_index + 1}"),
                    substrand_name=substrand_data["subStrandName"],
                    lessons_count=actual_lesson_count,
                    learning_outcomes=", ".join(slos[:5]),
                    key_inquiry_questions=", ".join(substrand_data.get("keyInquiryQuestions", [])[:3]),
                    sequence_order=substrand_index + 1
                )
                db.add(substrand)
                db.commit()
                db.refresh(substrand)
                
                # Create lessons - one per SLO or generic if no SLOs
                if slos and len(slos) > 0:
                    # Create one lesson per SLO
                    for slo_idx, slo_text in enumerate(slos, start=1):
                        lesson = Lesson(
                            substrand_id=substrand.id,
                            lesson_number=slo_idx,
                            lesson_title=slo_text.strip(),
                            learning_outcomes=slo_text.strip(),
                            sequence_order=slo_idx
                        )
                        db.add(lesson)
                else:
                    # Fallback: create generic lessons
                    for lesson_num in range(substrand_data.get("numberOfLessons", 1)):
                        lesson = Lesson(
                            substrand_id=substrand.id,
                            lesson_number=lesson_num + 1,
                            lesson_title=f"{substrand_data['subStrandName']} - Lesson {lesson_num + 1}",
                            learning_outcomes=", ".join(slos[:3]),
                            sequence_order=lesson_num + 1
                        )
                        db.add(lesson)
                
                db.commit()
        
        return {
            "message": "Curriculum uploaded and parsed successfully",
            "subject_id": new_subject.id,
            "subject_name": new_subject.subject_name,
            "grade": new_subject.grade,
            "total_lessons": total_lessons,
            "strands_count": len(curriculum_data.get("strands", [])),
            "curriculum_data": curriculum_data,
            "fallback_used": used_default,
            "parse_warnings": parse_warnings
        }
        
    except Exception as e:
        # Clean up file if processing fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing curriculum: {str(e)}"
        )

# ============================================================================
# CURRICULUM TEMPLATES API
# ============================================================================

@app.get(f"{settings.API_V1_PREFIX}/curriculum-templates")
async def list_curriculum_templates(
    grade: str = None,
    db: Session = Depends(get_db)
):
    """
    List available curriculum templates
    Optional filter by grade
    """
    query = db.query(CurriculumTemplate).filter(CurriculumTemplate.is_active == True)
    
    if grade:
        query = query.filter(CurriculumTemplate.grade == grade)
    
    templates = query.order_by(CurriculumTemplate.subject, CurriculumTemplate.grade).all()
    
    return {"templates": templates, "count": len(templates)}


@app.delete(f"{settings.API_V1_PREFIX}/curriculum-templates/{{template_id}}")
async def delete_curriculum_template(
    template_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete a curriculum template (Admin only)
    This will CASCADE delete all associated strands and substrands
    """
    template = db.query(CurriculumTemplate).filter(
        CurriculumTemplate.id == template_id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curriculum template not found"
        )
    
    try:
        subject_name = template.subject
        grade = template.grade
        db.delete(template)
        db.commit()
        return {
            "message": f"Successfully deleted {subject_name} {grade}",
            "deleted_id": template_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete template: {str(e)}"
        )


@app.post(f"{settings.API_V1_PREFIX}/curriculum-templates/{{template_id}}/use")
async def use_curriculum_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Copy a curriculum template to teacher's account
    Creates Subject + Strands + SubStrands + Lessons
    """
    
    # Eager load relationships to ensure all strands and substrands are fetched
    template = db.query(CurriculumTemplate).options(
        joinedload(CurriculumTemplate.strands).joinedload(TemplateStrand.substrands)
    ).filter(
        CurriculumTemplate.id == template_id,
        CurriculumTemplate.is_active == True
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curriculum template not found"
        )
    
    # Check if teacher already has this subject
    existing = db.query(Subject).filter(
        Subject.user_id == current_user.id,
        Subject.subject_name == template.subject,
        Subject.grade == template.grade
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have {template.subject} {template.grade} in your subjects"
        )
    
    # SaaS: Check Subject Limits for Individual Basic Plan
    if current_user.subscription_type == SubscriptionType.INDIVIDUAL_BASIC:
        subject_count = db.query(Subject).filter(Subject.user_id == current_user.id).count()
        if subject_count >= 4:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Basic Plan is limited to 4 subjects. Please upgrade to Premium to add more."
            )

    try:
        # Get total lessons from template
        # Count based on SLOs (one lesson per SLO) or fall back to number_of_lessons
        total_lessons = 0
        for t_strand in template.strands:
            for t_substrand in t_strand.substrands:
                slo_list = t_substrand.specific_learning_outcomes or []
                if slo_list and len(slo_list) > 0:
                    total_lessons += len(slo_list)
                else:
                    total_lessons += t_substrand.number_of_lessons

        # Create Subject
        new_subject = Subject(
            user_id=current_user.id,
            subject_name=template.subject,
            grade=template.grade,
            template_id=template.id,
            total_lessons=total_lessons,
            lessons_completed=0,
            progress_percentage=0.0
        )
        db.add(new_subject)
        db.commit()
        db.refresh(new_subject)
        
        # Get template strands
        for t_strand in template.strands:
            # Create Strand
            new_strand = Strand(
                subject_id=new_subject.id,
                strand_code=t_strand.strand_number,
                strand_name=t_strand.strand_name,
                sequence_order=t_strand.sequence_order or 0
            )
            db.add(new_strand)
            db.commit()
            db.refresh(new_strand)
            
            # Get template sub-strands for this strand
            for t_substrand in t_strand.substrands:
                
                outcomes = t_substrand.specific_learning_outcomes or []
                questions = t_substrand.key_inquiry_questions or []
                
                # Determine actual lesson count based on SLOs
                actual_lesson_count = len(outcomes) if outcomes else t_substrand.number_of_lessons
                
                # Create SubStrand with all curriculum details
                new_substrand = SubStrand(
                    strand_id=new_strand.id,
                    substrand_code=t_substrand.substrand_number,
                    substrand_name=t_substrand.substrand_name,
                    lessons_count=actual_lesson_count,
                    learning_outcomes=", ".join(outcomes[:5]),  # Top 5 for display
                    key_inquiry_questions=", ".join(questions[:3]),  # Top 3 for display
                    
                    # Store complete curriculum data as JSON
                    specific_learning_outcomes=t_substrand.specific_learning_outcomes,
                    suggested_learning_experiences=t_substrand.suggested_learning_experiences,
                    core_competencies=t_substrand.core_competencies,
                    values=t_substrand.values,
                    pcis=t_substrand.pcis,
                    links_to_other_subjects=t_substrand.links_to_other_subjects,
                    
                    sequence_order=t_substrand.sequence_order or 0
                )
                db.add(new_substrand)
                db.commit()
                db.refresh(new_substrand)
                
                # Create Lessons - one per SLO (Specific Learning Outcome)
                # If no SLOs, fall back to number_of_lessons
                slo_list = t_substrand.specific_learning_outcomes or []
                
                if slo_list and len(slo_list) > 0:
                    # Create one lesson per SLO
                    for slo_idx, slo_text in enumerate(slo_list, start=1):
                        lesson = Lesson(
                            substrand_id=new_substrand.id,
                            lesson_number=slo_idx,
                            lesson_title=slo_text.strip(),
                            learning_outcomes=slo_text.strip(),
                            sequence_order=slo_idx
                        )
                        db.add(lesson)
                else:
                    # Fallback: create generic lessons
                    for lesson_num in range(t_substrand.number_of_lessons):
                        lesson = Lesson(
                            substrand_id=new_substrand.id,
                            lesson_number=lesson_num + 1,
                            lesson_title=f"{t_substrand.substrand_name} - Lesson {lesson_num + 1}",
                            learning_outcomes=", ".join(outcomes[:3]),
                            sequence_order=lesson_num + 1
                        )
                        db.add(lesson)
                
                db.commit()
        
        return {
            "message": "Curriculum successfully added to your subjects",
            "subject_id": new_subject.id,
            "subject_name": template.subject,
            "grade": template.grade,
            "total_lessons": total_lessons
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error copying curriculum: {str(e)}"
        )

# ============================================================================
# CASCADING DROPDOWN ENDPOINTS (Education Level -> Grade -> Subject)
# ============================================================================

@app.get(f"{settings.API_V1_PREFIX}/education-levels")
async def get_education_levels(db: Session = Depends(get_db)):
    """
    Get all available education levels
    Returns distinct education levels ordered logically
    """
    education_levels = db.query(CurriculumTemplate.education_level).distinct().all()
    
    # Define proper order
    level_order = ['Pre-Primary', 'Lower Primary', 'Upper Primary', 'Junior Secondary', 'Senior Secondary']
    
    # Extract and sort education levels
    levels = [level[0] for level in education_levels if level[0]]
    sorted_levels = sorted(levels, key=lambda x: level_order.index(x) if x in level_order else 999)
    
    return {
        "education_levels": sorted_levels,
        "count": len(sorted_levels)
    }

@app.get(f"{settings.API_V1_PREFIX}/grades")
async def get_grades_by_education_level(
    education_level: str = None,
    db: Session = Depends(get_db)
):
    """
    Get all grades, optionally filtered by education level
    """
    query = db.query(CurriculumTemplate.grade).distinct()
    
    if education_level:
        query = query.filter(CurriculumTemplate.education_level == education_level)
    
    grades = query.all()
    
    # Extract grade names and sort them logically
    grade_list = [grade[0] for grade in grades if grade[0]]
    
    # Define sorting order
    grade_order = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 
                   'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
    
    sorted_grades = sorted(grade_list, key=lambda x: grade_order.index(x) if x in grade_order else 999)
    
    return {
        "grades": sorted_grades,
        "education_level": education_level,
        "count": len(sorted_grades)
    }

@app.get(f"{settings.API_V1_PREFIX}/subjects-by-grade")
async def get_subjects_by_grade(
    grade: str = None,
    education_level: str = None,
    db: Session = Depends(get_db)
):
    """
    Get all subjects filtered by grade and/or education level
    Returns subjects available in curriculum templates
    """
    query = db.query(CurriculumTemplate.subject).filter(CurriculumTemplate.is_active == True).distinct()
    
    if grade:
        query = query.filter(CurriculumTemplate.grade == grade)
    
    if education_level:
        query = query.filter(CurriculumTemplate.education_level == education_level)
    
    subjects = query.order_by(CurriculumTemplate.subject).all()
    subject_list = [subject[0] for subject in subjects if subject[0]]
    
    return {
        "subjects": subject_list,
        "grade": grade,
        "education_level": education_level,
        "count": len(subject_list)
    }

# ============================================================================
# CURRICULUM TEMPLATE MANAGEMENT ENDPOINTS (Admin Only)
# ============================================================================

@app.get(f"{settings.API_V1_PREFIX}/admin/curriculum-templates", response_model=List[CurriculumTemplateResponse])
async def get_all_curriculum_templates(
    education_level: str = None,
    grade: str = None,
    is_active: bool = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all curriculum templates with optional filters (Admin only)
    """
    query = db.query(CurriculumTemplate)
    
    if education_level:
        query = query.filter(CurriculumTemplate.education_level == education_level)
    
    if grade:
        query = query.filter(CurriculumTemplate.grade == grade)
    
    if is_active is not None:
        query = query.filter(CurriculumTemplate.is_active == is_active)
    
    # Order by education level, grade, and subject name
    level_order = ['Pre-Primary', 'Lower Primary', 'Upper Primary', 'Junior Secondary', 'Senior Secondary']
    grade_order = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 
                   'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
    
    templates = query.all()
    
    # Sort in Python for better control
    sorted_templates = sorted(templates, key=lambda t: (
        level_order.index(t.education_level) if t.education_level in level_order else 999,
        grade_order.index(t.grade) if t.grade in grade_order else 999,
        t.subject
    ))
    
    return sorted_templates

@app.post(f"{settings.API_V1_PREFIX}/admin/curriculum-templates", response_model=CurriculumTemplateResponse)
async def create_curriculum_template(
    template: CurriculumTemplateCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Create a new curriculum template (Admin only)
    """
    # Check if template already exists
    existing = db.query(CurriculumTemplate).filter(
        CurriculumTemplate.education_level == template.education_level,
        CurriculumTemplate.grade == template.grade,
        CurriculumTemplate.subject == template.subject
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Curriculum template already exists for this education level, grade, and subject"
        )
    
    db_template = CurriculumTemplate(**template.dict())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    
    return db_template

@app.put(f"{settings.API_V1_PREFIX}/admin/curriculum-templates/{{template_id}}", response_model=CurriculumTemplateResponse)
async def update_curriculum_template(
    template_id: int,
    template_update: CurriculumTemplateUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update a curriculum template (Admin only)
    """
    db_template = db.query(CurriculumTemplate).filter(CurriculumTemplate.id == template_id).first()
    
    if not db_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curriculum template not found"
        )
    
    # Update only provided fields
    update_data = template_update.dict(exclude_unset=True)
    
    # Check for duplicate if education_level, grade, or subject is being updated
    if any(key in update_data for key in ['education_level', 'grade', 'subject']):
        new_education_level = update_data.get('education_level', db_template.education_level)
        new_grade = update_data.get('grade', db_template.grade)
        new_subject = update_data.get('subject', db_template.subject)
        
        existing = db.query(CurriculumTemplate).filter(
            CurriculumTemplate.id != template_id,
            CurriculumTemplate.education_level == new_education_level,
            CurriculumTemplate.grade == new_grade,
            CurriculumTemplate.subject == new_subject
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Another curriculum template already exists with these values"
            )
    for key, value in update_data.items():
        setattr(db_template, key, value)
    
    db_template.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_template)
    
    return db_template

@app.delete(f"{settings.API_V1_PREFIX}/admin/curriculum-templates/{{template_id}}")
async def delete_curriculum_template(
    template_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete a curriculum template (Admin only)
    Soft delete by setting is_active to False
    """
    db_template = db.query(CurriculumTemplate).filter(CurriculumTemplate.id == template_id).first()
    
    if not db_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curriculum template not found"
        )
    
    # Soft delete
    db_template.is_active = False
    db_template.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Curriculum template deactivated successfully", "id": template_id}

# ============================================================================
# SCHOOL SETTINGS ENDPOINTS (Admin)
# ============================================================================

@app.get(f"{settings.API_V1_PREFIX}/admin/school-settings")
def get_school_settings(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get school settings (Admin only)"""
    from models import SchoolSettings
    
    settings_obj = db.query(SchoolSettings).first()
    if not settings_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School settings not found"
        )
    
    return settings_obj

# Non-admin endpoint for teachers to read school settings
@app.get(f"{settings.API_V1_PREFIX}/school-settings")
def get_school_settings_public(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get school settings (Read-only for all users)"""
    from models import SchoolSettings
    
    settings_obj = db.query(SchoolSettings).first()
    if not settings_obj:
        # Return empty/default response instead of 404 for better UX
        return {
            "school_name": "",
            "school_motto": "",
            "school_logo": None,
            "grades_offered": [],
            "streams_per_grade": {}
        }
    
    return settings_obj


@app.post(f"{settings.API_V1_PREFIX}/admin/school-settings")
def create_school_settings(
    settings_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create school settings (Admin only)"""
    from models import SchoolSettings
    
    # Check if settings already exist
    existing = db.query(SchoolSettings).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="School settings already exist. Use PUT to update."
        )
    
    new_settings = SchoolSettings(**settings_data)
    db.add(new_settings)
    db.commit()
    db.refresh(new_settings)
    
    return new_settings

@app.put(f"{settings.API_V1_PREFIX}/admin/school-settings/{{settings_id}}")
def update_school_settings(
    settings_id: int,
    settings_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update school settings (Admin only)"""
    from models import SchoolSettings
    
    db_settings = db.query(SchoolSettings).filter(SchoolSettings.id == settings_id).first()
    if not db_settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School settings not found"
        )
    
    # Update fields
    for key, value in settings_data.items():
        if hasattr(db_settings, key):
            setattr(db_settings, key, value)
    
    db.commit()
    db.refresh(db_settings)
    
    return db_settings

@app.post(f"{settings.API_V1_PREFIX}/admin/upload-logo")
async def upload_school_logo(
    logo: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Upload school logo (Admin only)"""
    # Create uploads directory if it doesn't exist
    upload_dir = "uploads/logos"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = os.path.splitext(logo.filename)[1]
    filename = f"school_logo_{timestamp}{file_extension}"
    file_path = os.path.join(upload_dir, filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await logo.read()
        buffer.write(content)
    
    # Return URL
    url = f"/uploads/logos/{filename}"
    return {"url": url}

# User Scheduling Settings

@app.get(f"{settings.API_V1_PREFIX}/user/settings", response_model=UserSettingsResponse)
def get_user_settings(current_user: User = Depends(get_current_user)):
    """Return the current user's default scheduling preferences."""
    return current_user


@app.put(f"{settings.API_V1_PREFIX}/user/settings", response_model=UserSettingsResponse)
def update_user_settings(
    settings_update: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update default lesson durations for the authenticated user."""
    update_data = settings_update.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No settings provided")

    single = update_data.get("default_lesson_duration", current_user.default_lesson_duration)
    double = update_data.get("default_double_lesson_duration", current_user.default_double_lesson_duration)

    if single < 20 or single > 120:
        raise HTTPException(status_code=400, detail="Single lesson duration must be between 20 and 120 minutes")
    if double < 30 or double > 240:
        raise HTTPException(status_code=400, detail="Double lesson duration must be between 30 and 240 minutes")
    if double < single:
        raise HTTPException(status_code=400, detail="Double lesson duration must be longer than single lessons")

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user


# User Academic Terms Endpoints

@app.get(f"{settings.API_V1_PREFIX}/terms", response_model=TermsResponse)
def list_user_terms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve academic terms for the current user, auto-seeding defaults if missing."""
    terms = ensure_user_terms(db, current_user)
    return {"terms": terms}


@app.put(f"{settings.API_V1_PREFIX}/terms/{{term_id}}", response_model=TermResponse)
def update_user_term(
    term_id: int,
    term_update: TermUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a user's academic term and maintain a single active term."""
    term = db.query(Term).filter(
        Term.id == term_id,
        Term.user_id == current_user.id
    ).first()

    if not term:
        raise HTTPException(status_code=404, detail="Term not found")

    update_data = term_update.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No updates supplied")

    if update_data.get("is_current"):
        db.query(Term).filter(
            Term.user_id == current_user.id,
            Term.id != term_id
        ).update({Term.is_current: False}, synchronize_session=False)

    for field, value in update_data.items():
        setattr(term, field, value)

    db.commit()
    db.refresh(term)

    # Ensure at least one term remains marked as current
    ensure_user_terms(db, current_user)

    return term


# School Terms Endpoints

@app.get(f"{settings.API_V1_PREFIX}/admin/school-terms")
def get_school_terms(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all school terms (Admin only)"""
    from models import SchoolTerm
    
    terms = db.query(SchoolTerm).order_by(SchoolTerm.year.desc(), SchoolTerm.term_number).all()
    return terms

# Non-admin endpoint for teachers to read school terms
@app.get(f"{settings.API_V1_PREFIX}/school-terms")
def get_school_terms_public(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all school terms (Read-only for all users)"""
    from models import SchoolTerm
    
    terms = db.query(SchoolTerm).order_by(SchoolTerm.year.desc(), SchoolTerm.term_number).all()
    
    # Transform to include term_name
    result = []
    for term in terms:
        result.append({
            "id": term.id,
            "term_number": term.term_number,
            "term_name": f"Term {term.term_number}",
            "year": term.year,
            "start_date": term.start_date,
            "end_date": term.end_date,
            "mid_term_break_start": term.mid_term_break_start,
            "mid_term_break_end": term.mid_term_break_end
        })
    
    return result



@app.post(f"{settings.API_V1_PREFIX}/admin/school-terms")
def create_school_term(
    term_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a school term (Admin only)"""
    from models import SchoolTerm
    
    new_term = SchoolTerm(**term_data)
    db.add(new_term)
    db.commit()
    db.refresh(new_term)
    
    return new_term

@app.put(f"{settings.API_V1_PREFIX}/admin/school-terms/{{term_id}}")
def update_school_term(
    term_id: int,
    term_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update a school term (Admin only)"""
    from models import SchoolTerm
    
    db_term = db.query(SchoolTerm).filter(SchoolTerm.id == term_id).first()
    if not db_term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Term not found"
        )
    
    # Update fields
    for key, value in term_data.items():
        if hasattr(db_term, key):
            setattr(db_term, key, value)
    
    db.commit()
    db.refresh(db_term)
    
    return db_term

@app.delete(f"{settings.API_V1_PREFIX}/admin/school-terms/{{term_id}}")
def delete_school_term(
    term_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a school term (Admin only)"""
    from models import SchoolTerm
    
    db_term = db.query(SchoolTerm).filter(SchoolTerm.id == term_id).first()
    if not db_term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Term not found"
        )
    
    db.delete(db_term)
    db.commit()
    
    return {"message": "Term deleted successfully"}

# Calendar Activities Endpoints

@app.get(f"{settings.API_V1_PREFIX}/admin/calendar-activities")
def get_calendar_activities(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all calendar activities (Admin only)"""
    from models import CalendarActivity
    
    activities = db.query(CalendarActivity).order_by(CalendarActivity.activity_date).all()
    return activities

@app.post(f"{settings.API_V1_PREFIX}/admin/calendar-activities")
def create_calendar_activity(
    activity_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a calendar activity (Admin only)"""
    from models import CalendarActivity
    
    new_activity = CalendarActivity(**activity_data)
    db.add(new_activity)
    db.commit()
    db.refresh(new_activity)
    
    return new_activity

@app.put(f"{settings.API_V1_PREFIX}/admin/calendar-activities/{{activity_id}}")
def update_calendar_activity(
    activity_id: int,
    activity_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update a calendar activity (Admin only)"""
    from models import CalendarActivity
    
    db_activity = db.query(CalendarActivity).filter(CalendarActivity.id == activity_id).first()
    if not db_activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )
    
    # Update fields
    for key, value in activity_data.items():
        if hasattr(db_activity, key):
            setattr(db_activity, key, value)
    
    db.commit()
    db.refresh(db_activity)
    
    return db_activity

@app.delete(f"{settings.API_V1_PREFIX}/admin/calendar-activities/{{activity_id}}")
def delete_calendar_activity(
    activity_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a calendar activity (Admin only)"""
    from models import CalendarActivity
    
    db_activity = db.query(CalendarActivity).filter(CalendarActivity.id == activity_id).first()
    if not db_activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )
    
    db.delete(db_activity)
    db.commit()
    
    return {"message": "Activity deleted successfully"}

# ============================================================================
# TEACHER PROFILE ENDPOINTS (For Independent Teachers)
# ============================================================================

def get_user_school_context(user: User, db: Session) -> Optional[dict]:
    """
    Get school context for a user - either from SchoolSettings or TeacherProfile.
    Returns a dict with standardized fields for use in document generation.
    
    Logic:
    - If user has school_id (linked to a school) → Use SchoolSettings
    - If user has NO school_id (independent) → Use TeacherProfile
    """
    if user.school_id:
        # User is part of a school - try to get SchoolSettings
        school_settings = db.query(SchoolSettings).first()  # TODO: Link to specific school
        if school_settings:
            return {
                "school_name": school_settings.school_name,
                "school_logo_url": school_settings.school_logo_url,
                "school_address": school_settings.school_address,
                "school_phone": school_settings.school_phone,
                "school_email": school_settings.school_email,
                "school_motto": school_settings.school_motto,
                "principal_name": school_settings.principal_name,
                "deputy_principal_name": school_settings.deputy_principal_name,
                "county": school_settings.county,
                "sub_county": school_settings.sub_county,
                "grades_offered": school_settings.grades_offered,
                "streams_per_grade": school_settings.streams_per_grade,
                "source": "school_settings"
            }
    
    # Individual teacher - use TeacherProfile
    profile = db.query(TeacherProfile).filter(TeacherProfile.user_id == user.id).first()
    if profile:
        return {
            "school_name": profile.school_name,
            "school_logo_url": profile.school_logo_url,
            "school_address": profile.school_address,
            "school_phone": profile.school_phone,
            "school_email": profile.school_email,
            "school_motto": profile.school_motto,
            "principal_name": profile.principal_name,
            "deputy_principal_name": profile.deputy_principal_name,
            "county": profile.county,
            "sub_county": profile.sub_county,
            "grades_offered": profile.grades_offered,
            "streams_per_grade": profile.streams_per_grade,
            "source": "teacher_profile"
        }
    
    return None


# ============================================================================
# ADMIN ANALYTICS ENDPOINTS
# ============================================================================

@app.get(f"{settings.API_V1_PREFIX}/admin/analytics")
def get_admin_analytics(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get analytics data for admin dashboard."""
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    # Filter by school if School Admin
    school_filter = True
    if current_user.role == UserRole.SCHOOL_ADMIN and current_user.school_id:
        school_filter = User.school_id == current_user.school_id
    
    # Overview stats
    total_users = db.query(User).filter(school_filter).count() if current_user.role == UserRole.SCHOOL_ADMIN else db.query(User).count()
    active_teachers = db.query(User).filter(
        User.role == UserRole.TEACHER,
        school_filter if current_user.role == UserRole.SCHOOL_ADMIN else True
    ).count()
    total_templates = db.query(CurriculumTemplate).filter(CurriculumTemplate.is_active == True).count()
    total_subjects = db.query(Subject).count()
    
    # Most used curricula (by subject selection)
    most_used_query = db.query(
        Subject.subject_name,
        Subject.grade,
        func.count(Subject.id).label('usage_count')
    ).group_by(Subject.subject_name, Subject.grade).order_by(func.count(Subject.id).desc()).limit(10)
    
    most_used_curricula = [
        {"subject": row[0], "grade": row[1] or "Unknown", "usage_count": row[2]}
        for row in most_used_query.all()
    ]
    
    # Completion rates by subject
    completion_query = db.query(
        Subject.subject_name,
        func.avg(Subject.progress_percentage).label('avg_completion'),
        func.count(Subject.id).label('count')
    ).group_by(Subject.subject_name).order_by(func.avg(Subject.progress_percentage).desc()).limit(10)
    
    completion_rates = [
        {"subject": row[0], "avg_completion": float(row[1] or 0), "count": row[2]}
        for row in completion_query.all()
    ]
    
    # Teacher engagement (top teachers by progress)
    teacher_query = db.query(
        User.id,
        User.email,
        func.count(Subject.id).label('subjects'),
        func.avg(Subject.progress_percentage).label('avg_progress')
    ).join(Subject, Subject.user_id == User.id).filter(
        school_filter if current_user.role == UserRole.SCHOOL_ADMIN else True
    ).group_by(User.id, User.email).order_by(func.avg(Subject.progress_percentage).desc()).limit(10)
    
    teacher_engagement = [
        {"user_id": row[0], "email": row[1], "subjects": row[2], "avg_progress": float(row[3] or 0)}
        for row in teacher_query.all()
    ]
    
    # Subject popularity by grade
    popularity_query = db.query(
        Subject.grade,
        func.count(Subject.id).label('count')
    ).filter(Subject.grade != None).group_by(Subject.grade).order_by(func.count(Subject.id).desc())
    
    subject_popularity = [
        {"grade": row[0] or "Unknown", "count": row[1]}
        for row in popularity_query.all()
    ]
    
    # Activity timeline (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    timeline_query = db.query(
        func.date(Subject.created_at).label('date'),
        func.count(Subject.id).label('count')
    ).filter(Subject.created_at >= thirty_days_ago).group_by(func.date(Subject.created_at)).order_by(func.date(Subject.created_at))
    
    activity_timeline = [
        {"date": str(row[0]), "count": row[1]}
        for row in timeline_query.all()
    ]
    
    # Progress distribution
    progress_ranges = {
        "0-25%": db.query(Subject).filter(Subject.progress_percentage <= 25).count(),
        "26-50%": db.query(Subject).filter(Subject.progress_percentage > 25, Subject.progress_percentage <= 50).count(),
        "51-75%": db.query(Subject).filter(Subject.progress_percentage > 50, Subject.progress_percentage <= 75).count(),
        "76-100%": db.query(Subject).filter(Subject.progress_percentage > 75).count(),
    }
    
    return {
        "overview": {
            "total_users": total_users,
            "active_teachers": active_teachers,
            "total_templates": total_templates,
            "total_subjects": total_subjects
        },
        "most_used_curricula": most_used_curricula,
        "completion_rates": completion_rates,
        "teacher_engagement": teacher_engagement,
        "subject_popularity": subject_popularity,
        "activity_timeline": activity_timeline,
        "progress_distribution": progress_ranges
    }

# ============================================================================
# LESSONS PER WEEK CONFIG ENDPOINTS
# ============================================================================

@app.get(f"{settings.API_V1_PREFIX}/admin/lessons-per-week")
def get_lessons_per_week_configs(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get lessons per week configurations for all subjects/grades from LessonConfiguration table."""
    from sqlalchemy import distinct
    
    # Get all saved configurations
    saved_configs = db.query(LessonConfiguration).all()
    saved_config_map = {}
    for cfg in saved_configs:
        key = f"{cfg.subject_name}|{cfg.grade}"
        saved_config_map[key] = cfg
    
    # Get all unique subject/grade combinations from Subject table with user counts
    subject_combos = db.query(
        Subject.subject_name,
        Subject.grade,
        func.count(Subject.id).label('user_count')
    ).group_by(Subject.subject_name, Subject.grade).all()
    
    # Build response combining saved configs with subject data
    configs = []
    seen_keys = set()
    
    # First add all configs from subject table
    for row in subject_combos:
        subject_name = row[0]
        grade = row[1] or "Unknown"
        user_count = row[2]
        key = f"{subject_name}|{grade}"
        seen_keys.add(key)
        
        # Check if we have saved config for this combo
        if key in saved_config_map:
            cfg = saved_config_map[key]
            configs.append({
                "id": cfg.id,
                "subject_name": cfg.subject_name,
                "grade": cfg.grade,
                "education_level": cfg.education_level,
                "lessons_per_week": cfg.lessons_per_week,
                "double_lessons_per_week": cfg.double_lessons_per_week,
                "single_lesson_duration": cfg.single_lesson_duration,
                "double_lesson_duration": cfg.double_lesson_duration,
                "user_count": user_count
            })
        else:
            # Return defaults
            configs.append({
                "id": None,
                "subject_name": subject_name,
                "grade": grade,
                "education_level": None,
                "lessons_per_week": 5,
                "double_lessons_per_week": 0,
                "single_lesson_duration": 40,
                "double_lesson_duration": 80,
                "user_count": user_count
            })
    
    # Also add any saved configs that don't have active subjects
    for key, cfg in saved_config_map.items():
        if key not in seen_keys:
            configs.append({
                "id": cfg.id,
                "subject_name": cfg.subject_name,
                "grade": cfg.grade,
                "education_level": cfg.education_level,
                "lessons_per_week": cfg.lessons_per_week,
                "double_lessons_per_week": cfg.double_lessons_per_week,
                "single_lesson_duration": cfg.single_lesson_duration,
                "double_lesson_duration": cfg.double_lesson_duration,
                "user_count": 0
            })
    
    return {"configs": configs}

@app.post(f"{settings.API_V1_PREFIX}/admin/lessons-per-week")
def update_lessons_per_week_config(
    config_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update lessons per week configuration for a subject/grade - persists to LessonConfiguration table."""
    subject_name = config_data.get("subject_name")
    grade = config_data.get("grade")
    lessons_per_week = config_data.get("lessons_per_week", 5)
    double_lessons_per_week = config_data.get("double_lessons_per_week", 0)
    single_lesson_duration = config_data.get("single_lesson_duration", 40)
    double_lesson_duration = config_data.get("double_lesson_duration", 80)
    education_level = config_data.get("education_level")
    
    if not subject_name or not grade:
        raise HTTPException(
            status_code=400,
            detail="subject_name and grade are required"
        )
    
    # Check if config already exists
    existing = db.query(LessonConfiguration).filter(
        LessonConfiguration.subject_name == subject_name,
        LessonConfiguration.grade == grade
    ).first()
    
    if existing:
        # Update existing
        existing.lessons_per_week = lessons_per_week
        existing.double_lessons_per_week = double_lessons_per_week
        existing.single_lesson_duration = single_lesson_duration
        existing.double_lesson_duration = double_lesson_duration
        if education_level:
            existing.education_level = education_level
        db.commit()
        db.refresh(existing)
        config_id = existing.id
    else:
        # Create new
        new_config = LessonConfiguration(
            subject_name=subject_name,
            grade=grade,
            education_level=education_level,
            lessons_per_week=lessons_per_week,
            double_lessons_per_week=double_lessons_per_week,
            single_lesson_duration=single_lesson_duration,
            double_lesson_duration=double_lesson_duration
        )
        db.add(new_config)
        db.commit()
        db.refresh(new_config)
        config_id = new_config.id
    
    return {
        "message": "Configuration saved successfully",
        "id": config_id,
        "subject_name": subject_name,
        "grade": grade,
        "lessons_per_week": lessons_per_week,
        "double_lessons_per_week": double_lessons_per_week,
        "single_lesson_duration": single_lesson_duration,
        "double_lesson_duration": double_lesson_duration
    }

# ============================================================================
# LESSON TRACKING ENDPOINTS
# ============================================================================

@app.post(f"{settings.API_V1_PREFIX}/lessons/{{lesson_id}}/complete")
def mark_lesson_complete(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a lesson as complete and update subject progress"""
    
    # Get lesson and verify ownership through subject
    lesson = db.query(Lesson).join(SubStrand).join(Strand).join(Subject).filter(
        Lesson.id == lesson_id,
        Subject.user_id == current_user.id
    ).first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    if lesson.is_completed:
        raise HTTPException(status_code=400, detail="Lesson already completed")
    
    # Mark lesson as complete
    lesson.is_completed = True
    lesson.completed_at = datetime.now()
    
    # Get the subject to update progress
    subject = db.query(Subject).join(Strand).join(SubStrand).join(Lesson).filter(
        Lesson.id == lesson_id
    ).first()
    
    if subject:
        # Count completed lessons
        completed = db.query(Lesson).join(SubStrand).join(Strand).filter(
            Strand.subject_id == subject.id,
            Lesson.is_completed == True
        ).count()
        
        subject.lessons_completed = completed
        subject.progress_percentage = (completed / subject.total_lessons * 100) if subject.total_lessons > 0 else 0
    
    db.commit()
    
    return {
        "message": "Lesson marked as complete",
        "lesson_id": lesson_id,
        "subject_progress": subject.progress_percentage if subject else 0
    }

@app.post(f"{settings.API_V1_PREFIX}/lessons/{{lesson_id}}/uncomplete")
def mark_lesson_incomplete(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a lesson as incomplete (undo completion)"""
    
    lesson = db.query(Lesson).join(SubStrand).join(Strand).join(Subject).filter(
        Lesson.id == lesson_id,
        Subject.user_id == current_user.id
    ).first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    if not lesson.is_completed:
        raise HTTPException(status_code=400, detail="Lesson is not completed")
    
    # Mark lesson as incomplete
    lesson.is_completed = False
    lesson.completed_at = None
    
    # Update subject progress
    subject = db.query(Subject).join(Strand).join(SubStrand).join(Lesson).filter(
        Lesson.id == lesson_id
    ).first()
    
    if subject:
        completed = db.query(Lesson).join(SubStrand).join(Strand).filter(
            Strand.subject_id == subject.id,
            Lesson.is_completed == True
        ).count()
        
        subject.lessons_completed = completed
        subject.progress_percentage = (completed / subject.total_lessons * 100) if subject.total_lessons > 0 else 0
    
    db.commit()
    
    return {
        "message": "Lesson marked as incomplete",
        "lesson_id": lesson_id,
        "subject_progress": subject.progress_percentage if subject else 0
    }

@app.get(f"{settings.API_V1_PREFIX}/subjects/{{subject_id}}/lessons")
def get_subject_lessons(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all lessons for a subject with completion status"""
    
    # Verify subject belongs to user
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.user_id == current_user.id
    ).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Get all lessons with strand/substrand info - use eager loading to ensure relationships are loaded
    lessons = db.query(Lesson).join(SubStrand).join(Strand).options(
        joinedload(Lesson.substrand).joinedload(SubStrand.strand)
    ).filter(
        Strand.subject_id == subject_id
    ).order_by(Strand.sequence_order, SubStrand.sequence_order, Lesson.sequence_order).all()
    
    return {
        "subject_id": subject_id,
        "subject_name": subject.subject_name,
        "total_lessons": subject.total_lessons,
        "completed_lessons": subject.lessons_completed,
        "progress_percentage": subject.progress_percentage,
        "lessons": [
            {
                "id": lesson.id,
                "lesson_number": lesson.lesson_number,
                "lesson_title": lesson.lesson_title,
                "is_completed": lesson.is_completed,
                "completed_at": lesson.completed_at.isoformat() if lesson.completed_at else None,
                "substrand_id": lesson.substrand_id,
                "substrand_name": lesson.substrand.substrand_name,
                "substrand_code": lesson.substrand.substrand_code,
                "strand_name": lesson.substrand.strand.strand_name,
                "strand_code": lesson.substrand.strand.strand_code
            }
            for lesson in lessons
        ]
    }

@app.get(f"{settings.API_V1_PREFIX}/dashboard/curriculum-progress")
def get_curriculum_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive curriculum progress overview for dashboard"""
    
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    
    # Calculate overall statistics
    total_subjects = len(subjects)
    total_lessons_all = sum(s.total_lessons for s in subjects)
    completed_lessons_all = sum(s.lessons_completed for s in subjects)
    avg_progress = (completed_lessons_all / total_lessons_all * 100) if total_lessons_all > 0 else 0
    
    # Get recently completed lessons
    recent_completions = db.query(
        Lesson.id,
        Lesson.lesson_title,
        Lesson.completed_at,
        Subject.subject_name,
        Subject.grade
    ).join(SubStrand).join(Strand).join(Subject).filter(
        Subject.user_id == current_user.id,
        Lesson.is_completed == True
    ).order_by(Lesson.completed_at.desc()).limit(10).all()
    
    # Subject-wise progress
    subject_progress = []
    for subject in subjects:
        # Get strand-level progress with substrand details
        strands = db.query(Strand).filter(Strand.subject_id == subject.id).all()
        strand_data = []
        
        for strand in strands:
            total_in_strand = db.query(Lesson).join(SubStrand).filter(
                SubStrand.strand_id == strand.id
            ).count()
            
            completed_in_strand = db.query(Lesson).join(SubStrand).filter(
                SubStrand.strand_id == strand.id,
                Lesson.is_completed == True
            ).count()
            
            # Get substrand-level progress
            substrands = db.query(SubStrand).filter(SubStrand.strand_id == strand.id).all()
            substrand_data = []
            
            for substrand in substrands:
                total_in_substrand = db.query(Lesson).filter(
                    Lesson.substrand_id == substrand.id
                ).count()
                
                completed_in_substrand = db.query(Lesson).filter(
                    Lesson.substrand_id == substrand.id,
                    Lesson.is_completed == True
                ).count()
                
                # Only include substrands with completed lessons
                if completed_in_substrand > 0:
                    substrand_data.append({
                        "substrand_code": substrand.substrand_code,
                        "substrand_name": substrand.substrand_name,
                        "total_lessons": total_in_substrand,
                        "completed_lessons": completed_in_substrand,
                        "progress": (completed_in_substrand / total_in_substrand * 100) if total_in_substrand > 0 else 0
                    })
            
            strand_data.append({
                "strand_code": strand.strand_code,
                "strand_name": strand.strand_name,
                "total_lessons": total_in_strand,
                "completed_lessons": completed_in_strand,
                "progress": (completed_in_strand / total_in_strand * 100) if total_in_strand > 0 else 0,
                "substrands": substrand_data
            })
        
        subject_progress.append({
            "id": subject.id,
            "subject_name": subject.subject_name,
            "grade": subject.grade,
            "total_lessons": subject.total_lessons,
            "completed_lessons": subject.lessons_completed,
            "progress_percentage": float(subject.progress_percentage),
            "strands": strand_data
        })
    return {
        "overview": {
            "total_subjects": total_subjects,
            "total_lessons": total_lessons_all,
            "completed_lessons": completed_lessons_all,
            "average_progress": round(avg_progress, 2)
        },
        "subjects": subject_progress,
        "recent_completions": [
            {
                "lesson_id": rc[0],
                "lesson_title": rc[1],
                "completed_at": rc[2].isoformat() if rc[2] else None,
                "subject_name": rc[3],
                "grade": rc[4]
            }
            for rc in recent_completions
        ]
    }


# ============================================================================
# ADMIN USER MANAGEMENT ENDPOINTS
# ============================================================================

def _reset_subject_progress(db: Session, subject: Subject):
    """Reset completion data for a single subject."""
    lessons = (
        db.query(Lesson)
        .join(SubStrand, Lesson.substrand_id == SubStrand.id)
        .join(Strand, SubStrand.strand_id == Strand.id)
        .filter(Strand.subject_id == subject.id)
        .all()
    )

    for lesson in lessons:
        lesson.is_completed = False
        lesson.completed_at = None

    db.query(ProgressLog).filter(ProgressLog.subject_id == subject.id).delete()

    subject.lessons_completed = 0
    subject.progress_percentage = 0.0


@app.get(f"{settings.API_V1_PREFIX}/admin/users", response_model=AdminUsersResponse)
def list_admin_users(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """List all users with their subjects and progress (Admin only).
    School Admin only sees users from their school."""
    
    query = db.query(User).options(joinedload(User.subjects))
    
    # School Admin can only see users from their school
    if current_user.role == UserRole.SCHOOL_ADMIN and current_user.school_id:
        query = query.filter(User.school_id == current_user.school_id)
    
    users = query.order_by(User.created_at.desc()).all()

    user_payload = []
    for user in users:
        subjects_payload = [
            AdminSubjectSummary(
                id=subject.id,
                subject_name=subject.subject_name,
                grade=subject.grade,
                total_lessons=subject.total_lessons,
                lessons_completed=subject.lessons_completed,
                progress_percentage=float(subject.progress_percentage or 0),
            )
            for subject in user.subjects
        ]

        user_payload.append(
            AdminUserSummary(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                school=user.school,
                grade_level=user.grade_level,
                is_admin=user.is_admin,
                auth_provider=user.auth_provider,
                created_at=user.created_at,
                subjects_count=len(subjects_payload),
                subjects=subjects_payload,
            )
        )

    return AdminUsersResponse(users=user_payload, total=len(user_payload))


@app.patch(f"{settings.API_V1_PREFIX}/admin/users/{{user_id}}/role")
def update_user_role(
    user_id: int,
    payload: AdminRoleUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Toggle or set a user's admin role."""
    # Handle both is_admin (legacy) and role (new)
    new_is_admin = payload.is_admin
    
    if new_is_admin is None and payload.role:
        # Convert role to is_admin
        new_is_admin = payload.role in ["SUPER_ADMIN", "SCHOOL_ADMIN", "admin"]
    
    if new_is_admin is None:
        raise HTTPException(status_code=400, detail="Either is_admin or role must be provided")
    
    if user_id == current_user.id and not new_is_admin:
        raise HTTPException(status_code=400, detail="You cannot remove your own admin access")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_admin = new_is_admin
    db.commit()
    db.refresh(user)

    role_label = "admin" if user.is_admin else "teacher"
    return {"message": f"User role updated to {role_label}", "is_admin": user.is_admin}


@app.delete(f"{settings.API_V1_PREFIX}/admin/users/{{user_id}}")
def delete_user_account(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a user's account and associated data."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


@app.post(f"{settings.API_V1_PREFIX}/admin/users/{{user_id}}/reset-progress")
def reset_user_progress(
    user_id: int,
    payload: ResetProgressRequest = Body(default=None),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Reset progress for a user (optionally for a single subject)."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    subject_id = payload.subject_id if payload else None

    if subject_id:
        subject = (
            db.query(Subject)
            .filter(Subject.id == subject_id, Subject.user_id == target_user.id)
            .first()
        )
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found for this user")

        _reset_subject_progress(db, subject)
        db.commit()
        return {"message": f"Progress reset for subject {subject.subject_name}"}

    # Reset all subjects
    subjects = db.query(Subject).filter(Subject.user_id == target_user.id).all()
    for subject in subjects:
        _reset_subject_progress(db, subject)

    db.commit()
    return {"message": "All subject progress reset for user"}


@app.post(f"{settings.API_V1_PREFIX}/admin/users/{{user_id}}/impersonate", response_model=Token)
def impersonate_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Impersonate a user (Admin only)."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You are already signed in as this user")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# ============================================================================
# SYSTEM ANNOUNCEMENTS ENDPOINTS
# ============================================================================

@app.get(f"{settings.API_V1_PREFIX}/announcements", response_model=List[SystemAnnouncementResponse])
def get_active_announcements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all active announcements for users"""
    now = datetime.utcnow()
    announcements = db.query(SystemAnnouncement).filter(
        SystemAnnouncement.is_active == True,
        (SystemAnnouncement.expires_at == None) | (SystemAnnouncement.expires_at > now)
    ).order_by(SystemAnnouncement.created_at.desc()).all()
    
    return announcements

@app.get(f"{settings.API_V1_PREFIX}/admin/announcements", response_model=List[SystemAnnouncementResponse])
def get_all_announcements(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all announcements (Admin only)"""
    announcements = db.query(SystemAnnouncement).order_by(SystemAnnouncement.created_at.desc()).all()
    return announcements

@app.post(f"{settings.API_V1_PREFIX}/admin/announcements", response_model=SystemAnnouncementResponse)
def create_announcement(
    announcement: SystemAnnouncementCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new announcement (Admin only)"""
    new_announcement = SystemAnnouncement(
        **announcement.dict(),
        created_by=current_user.id
    )
    db.add(new_announcement)
    db.commit()
    db.refresh(new_announcement)
    return new_announcement

@app.delete(f"{settings.API_V1_PREFIX}/admin/announcements/{{announcement_id}}")
def delete_announcement(
    announcement_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete an announcement (Admin only)"""
    announcement = db.query(SystemAnnouncement).filter(SystemAnnouncement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    db.delete(announcement)
    db.commit()
    return {"message": "Announcement deleted successfully"}

@app.patch(f"{settings.API_V1_PREFIX}/admin/announcements/{{announcement_id}}/toggle")
def toggle_announcement_status(
    announcement_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Toggle active status of an announcement (Admin only)"""
    announcement = db.query(SystemAnnouncement).filter(SystemAnnouncement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    announcement.is_active = not announcement.is_active
    db.commit()
    db.refresh(announcement)
    return announcement

# ============================================================================
# FILE DOWNLOAD ENDPOINT
# ============================================================================

@app.get(f"{settings.API_V1_PREFIX}/notes/{{note_id}}/download")
async def download_note_file(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stream file download from Cloudinary with correct file type and name."""
    import httpx
    
    # Get note and verify ownership
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    
    if not note or not note.file_url:
        raise HTTPException(status_code=404, detail="Note or file not found")
    
    # DEBUG: Log what we're working with
    print(f"\n{'='*80}")
    print(f"DOWNLOAD REQUEST - Note ID: {note_id}")
    print(f"  Title: {note.title}")
    print(f"  Stored file_type: '{note.file_type}'")
    print(f"  Cloudinary URL: {note.file_url}")
    print(f"{'='*80}\n")
    
    # Extract public_id from URL and generate authenticated download URL
    try:
        print(f"Extracting public_id from URL...")
        public_id = cloudinary_storage.extract_public_id_from_url(note.file_url)
        
        if not public_id:
            print(f"ERROR: Could not extract public_id from URL")
            raise HTTPException(
                status_code=500,
                detail="Invalid file URL format"
            )
        
        print(f"  Public ID: {public_id}")
        
        # Determine resource type based on file extension
        resource_type = "raw" if note.file_type in ['pdf', 'docx', 'pptx', 'xlsx'] else "image"
        print(f"  Resource Type: {resource_type}")
        
        # Generate a fresh authenticated URL using Cloudinary SDK
        import cloudinary.utils
        
        # For raw files, we need to use the 'raw' resource type and specify delivery type
        if resource_type == "raw":
            # Build URL with authentication - Cloudinary handles signing automatically
            download_url = cloudinary.utils.cloudinary_url(
                public_id,
                resource_type="raw",
                secure=True,
                sign_url=True,  # Important: Sign the URL
                type="upload"
            )[0]
        else:
            # For images/videos, use standard URL
            download_url = cloudinary.utils.cloudinary_url(
                public_id,
                resource_type=resource_type,
                secure=True,
                sign_url=True
            )[0]
        
        print(f"  Generated authenticated URL: {download_url[:80]}...")
        
        # Fetch file from Cloudinary with the authenticated URL
        async with httpx.AsyncClient(timeout=60.0) as client:
            print(f"Fetching file from Cloudinary...")
            response = await client.get(download_url)
            
            if response.status_code != 200:
                print(f"ERROR: Cloudinary returned status {response.status_code}")
                print(f"  Response: {response.text[:200]}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to fetch file from storage (status: {response.status_code})"
                )
            
            # Log what Cloudinary returned
            cloudinary_content_type = response.headers.get('content-type', 'unknown')
            print(f"Cloudinary Response:")
            print(f"  Content-Type: {cloudinary_content_type}")
            print(f"  Content-Length: {len(response.content)} bytes")
            
    except httpx.TimeoutException as e:
        print(f"ERROR: Timeout fetching file from Cloudinary: {str(e)}")
        raise HTTPException(
            status_code=504,
            detail="Timeout fetching file from cloud storage"
        )
    except httpx.HTTPError as e:
        print(f"ERROR: HTTP error fetching file: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch file: {str(e)}"
        )
    except Exception as e:
        print(f"ERROR: Unexpected error fetching file: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )
    
    # Clean filename and ensure it has the correct extension
    # Use the stored file_type to ensure correct extension
    filename = note.title.strip()
    file_ext = note.file_type.lower().strip() if note.file_type else ''
    
    # Remove any existing extension from title
    if '.' in filename:
        name_parts = filename.rsplit('.', 1)
        filename = name_parts[0]
    
    # Add the correct extension from database
    if file_ext:
        filename = f"{filename}.{file_ext}"
    else:
        # Fallback: try to get extension from URL
        print(f"WARNING: No file_type in database, trying to extract from URL")
        url_parts = note.file_url.split('.')
        if len(url_parts) > 1:
            file_ext = url_parts[-1].lower()
            filename = f"{filename}.{file_ext}"
    
    # Comprehensive MIME type mapping based on stored file_type
    mime_type_map = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'mp4': 'video/mp4',
            'mov': 'video/quicktime',
            'avi': 'video/x-msvideo',
            'mkv': 'video/x-matroska',
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'txt': 'text/plain',
            'csv': 'text/csv',
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed',
    }
    
    # Use the file type from database, not from Cloudinary response
    media_type = mime_type_map.get(file_ext, 'application/octet-stream')
    
    print(f"\nDownload Response:")
    print(f"  Filename: {filename}")
    print(f"  Extension: {file_ext}")
    print(f"  MIME Type: {media_type}")
    print(f"{'='*80}\n")
    
    # Return streaming response with proper headers
    # CRITICAL: Use the stored file_type to ensure correct download
    return StreamingResponse(
        iter([response.content]),
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": media_type,
            "Content-Length": str(len(response.content)),
            "Cache-Control": "no-cache"
        }
    )


# ============================================================================
# TIMETABLE MANAGEMENT ENDPOINTS
# ============================================================================

@app.post(f"{settings.API_V1_PREFIX}/timetable/schedules", response_model=SchoolScheduleResponse)
async def create_school_schedule(
    schedule: SchoolScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new school schedule configuration and auto-generate time slots"""
    
    # Check if user already has an active schedule for this level
    query = db.query(SchoolSchedule).filter(
        SchoolSchedule.user_id == current_user.id,
        SchoolSchedule.is_active == True
    )
    
    if schedule.education_level:
        query = query.filter(SchoolSchedule.education_level == schedule.education_level)
    else:
        # If no level specified, check if any schedule exists without level (legacy)
        # or just check if ANY active schedule exists if we want to enforce one per user when no level
        pass 
        
    existing = query.first()
    
    if existing:
        level_msg = f" for {schedule.education_level}" if schedule.education_level else ""
        raise HTTPException(
            status_code=400,
            detail=f"You already have an active schedule{level_msg}. Deactivate it first or update it."
        )
    
    # Create schedule
    db_schedule = SchoolSchedule(
        user_id=current_user.id,
        **schedule.dict()
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    
    # Auto-generate time slots
    generate_time_slots(db_schedule, db)
    
    return db_schedule


def generate_time_slots(schedule: SchoolSchedule, db: Session):
    """Generate time slots based on schedule configuration"""
    from datetime import datetime, timedelta
    
    # Parse times
    def parse_time(time_str: str) -> datetime:
        return datetime.strptime(time_str, "%H:%M")
    
    current_time = parse_time(schedule.school_start_time)
    slot_number = 1
    sequence = 1
    
    # Session 1 (Before first break)
    for i in range(schedule.lessons_before_first_break):
        duration = schedule.single_lesson_duration if i % 2 == 0 else schedule.double_lesson_duration
        
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=slot_number,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=duration)).strftime("%H:%M"),
            slot_type="lesson",
            label=f"Lesson {slot_number}",
            sequence_order=sequence
        )
        db.add(time_slot)
        
        current_time += timedelta(minutes=duration)
        slot_number += 1
        sequence += 1
    
    # First Break
    if schedule.first_break_duration > 0:
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=0,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=schedule.first_break_duration)).strftime("%H:%M"),
            slot_type="break",
            label="First Break",
            sequence_order=sequence
        )
        db.add(time_slot)
        current_time += timedelta(minutes=schedule.first_break_duration)
        sequence += 1
    
    # Session 2 (Before second break)
    for i in range(schedule.lessons_before_second_break):
        duration = schedule.single_lesson_duration
        
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=slot_number,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=duration)).strftime("%H:%M"),
            slot_type="lesson",
            label=f"Lesson {slot_number}",
            sequence_order=sequence
        )
        db.add(time_slot)
        
        current_time += timedelta(minutes=duration)
        slot_number += 1
        sequence += 1
    
    # Second Break (Tea Break)
    if schedule.second_break_duration > 0:
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=0,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=schedule.second_break_duration)).strftime("%H:%M"),
            slot_type="break",
            label="Second Break",
            sequence_order=sequence
        )
        db.add(time_slot)
        current_time += timedelta(minutes=schedule.second_break_duration)
        sequence += 1
    
    # Session 3 (Before lunch)
    for i in range(schedule.lessons_before_lunch):
        duration = schedule.single_lesson_duration
        
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=slot_number,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=duration)).strftime("%H:%M"),
            slot_type="lesson",
            label=f"Lesson {slot_number}",
            sequence_order=sequence
        )
        db.add(time_slot)
        
        current_time += timedelta(minutes=duration)
        slot_number += 1
        sequence += 1
    
    # Lunch Break
    if schedule.lunch_break_duration > 0:
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=0,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=schedule.lunch_break_duration)).strftime("%H:%M"),
            slot_type="lunch",
            label="Lunch Break",
            sequence_order=sequence
        )
        db.add(time_slot)
        current_time += timedelta(minutes=schedule.lunch_break_duration)
        sequence += 1
    
    # Session 4 (After lunch)
    for i in range(schedule.lessons_after_lunch):
        duration = schedule.single_lesson_duration
        
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=slot_number,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=duration)).strftime("%H:%M"),
            slot_type="lesson",
            label=f"Lesson {slot_number}",
            sequence_order=sequence
        )
        db.add(time_slot)
        
        current_time += timedelta(minutes=duration)
        slot_number += 1
        sequence += 1
    
    db.commit()


@app.get(f"{settings.API_V1_PREFIX}/timetable/schedules", response_model=List[SchoolScheduleResponse])
async def get_school_schedules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all school schedules for current user"""
    schedules = db.query(SchoolSchedule).filter(
        SchoolSchedule.user_id == current_user.id
    ).order_by(SchoolSchedule.is_active.desc(), SchoolSchedule.created_at.desc()).all()
    
    return schedules


@app.get(f"{settings.API_V1_PREFIX}/timetable/schedules/active", response_model=SchoolScheduleResponse)
async def get_active_schedule(
    education_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the active schedule, falling back to a generic one when needed."""
    schedule = get_active_schedule_or_fallback(db, current_user, education_level)
    if not schedule:
        detail = f"No active schedule found for {education_level}" if education_level else "No active schedule found"
        raise HTTPException(status_code=404, detail=f"{detail}. Please create one.")

    return schedule


@app.put(f"{settings.API_V1_PREFIX}/timetable/schedules/{{schedule_id}}", response_model=SchoolScheduleResponse)
async def update_school_schedule(
    schedule_id: int,
    schedule_update: SchoolScheduleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a school schedule and regenerate time slots"""
    schedule = db.query(SchoolSchedule).filter(
        SchoolSchedule.id == schedule_id,
        SchoolSchedule.user_id == current_user.id
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Update fields
    update_data = schedule_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(schedule, key, value)
    
    db.commit()
    db.refresh(schedule)
    
    # Regenerate time slots if timing changed
    if any(key in update_data for key in ['school_start_time', 'single_lesson_duration', 
                                            'double_lesson_duration', 'lessons_before_first_break',
                                            'lessons_before_second_break', 'lessons_before_lunch',
                                            'lessons_after_lunch', 'first_break_duration',
                                            'second_break_duration', 'lunch_break_duration']):
        # Get existing time slots to preserve lesson mappings
        existing_slots = db.query(TimeSlot).filter(
            TimeSlot.schedule_id == schedule_id
        ).order_by(TimeSlot.sequence_order).all()
        
        # Get existing entries to remap later
        existing_entries = db.query(TimetableEntry).filter(
            TimetableEntry.schedule_id == schedule_id
        ).all()
        
        # Create mapping of old slot details (sequence_order, slot_type) to entry details
        entry_mappings = {}
        for entry in existing_entries:
            old_slot = next((s for s in existing_slots if s.id == entry.time_slot_id), None)
            if old_slot:
                # Map by sequence order and slot type to preserve lesson positions
                key = (old_slot.sequence_order, old_slot.slot_type)
                if key not in entry_mappings:
                    entry_mappings[key] = []
                entry_mappings[key].append({
                    'subject_id': entry.subject_id,
                    'day_of_week': entry.day_of_week,
                    'room_number': entry.room_number,
                    'grade_section': entry.grade_section,
                    'notes': entry.notes,
                    'is_double_lesson': entry.is_double_lesson,
                    'strand_id': entry.strand_id,
                    'substrand_id': entry.substrand_id,
                    'lesson_id': entry.lesson_id
                })
        
        # Delete old entries and slots
        db.query(TimetableEntry).filter(TimetableEntry.schedule_id == schedule_id).delete()
        db.query(TimeSlot).filter(TimeSlot.schedule_id == schedule_id).delete()
        db.commit()
        
        # Generate new time slots
        generate_time_slots(schedule, db)
        
        # Get newly created time slots
        new_slots = db.query(TimeSlot).filter(
            TimeSlot.schedule_id == schedule_id
        ).order_by(TimeSlot.sequence_order).all()
        
        # Recreate entries with new time slot IDs
        for new_slot in new_slots:
            key = (new_slot.sequence_order, new_slot.slot_type)
            if key in entry_mappings:
                for entry_data in entry_mappings[key]:
                    new_entry = TimetableEntry(
                        user_id=current_user.id,
                        schedule_id=schedule_id,
                        time_slot_id=new_slot.id,
                        **entry_data
                    )
                    db.add(new_entry)
        
        db.commit()
    
    return schedule


@app.delete(f"{settings.API_V1_PREFIX}/timetable/schedules/{{schedule_id}}")
async def delete_school_schedule(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a school schedule (soft delete by deactivating)"""
    schedule = db.query(SchoolSchedule).filter(
        SchoolSchedule.id == schedule_id,
        SchoolSchedule.user_id == current_user.id
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Soft delete
    schedule.is_active = False
    db.commit()
    
    return {"message": "Schedule deactivated successfully"}


@app.get(f"{settings.API_V1_PREFIX}/timetable/time-slots", response_model=List[TimeSlotResponse])
async def get_time_slots(
    education_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return time slots for the active (or fallback) schedule."""
    schedule = resolve_schedule_for_context(db, current_user, education_level)
    
    if not schedule:
        # Auto-create a default schedule for new users
        from datetime import datetime
        
        default_schedule = SchoolSchedule(
            user_id=current_user.id,
            schedule_name="Default Schedule",
            education_level=education_level or "Junior Secondary",
            school_start_time="08:00",
            single_lesson_duration=40,
            double_lesson_duration=80,
            first_break_duration=10,
            second_break_duration=30,
            lunch_break_duration=60,
            lessons_before_first_break=2,
            lessons_before_second_break=2,
            lessons_before_lunch=2,
            lessons_after_lunch=2,
            school_end_time="16:00",
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(default_schedule)
        db.commit()
        db.refresh(default_schedule)
        
        # Create default time slots
        current_time = datetime.strptime("08:00", "%H:%M")
        slot_id = 1
        
        # Helper to add minutes
        def add_minutes(dt, mins):
            return dt + timedelta(minutes=mins)
            
        # Morning block 1
        for i in range(2):
            end_time = add_minutes(current_time, 40)
            db.add(TimeSlot(
                schedule_id=default_schedule.id,
                slot_number=slot_id,
                start_time=current_time.strftime("%H:%M"),
                end_time=end_time.strftime("%H:%M"),
                slot_type="lesson",
                label=f"Lesson {slot_id}",
                sequence_order=slot_id
            ))
            current_time = end_time
            slot_id += 1
            
        # Break 1
        end_time = add_minutes(current_time, 10)
        db.add(TimeSlot(
            schedule_id=default_schedule.id,
            slot_number=slot_id,
            start_time=current_time.strftime("%H:%M"),
            end_time=end_time.strftime("%H:%M"),
            slot_type="break",
            label="Short Break",
            sequence_order=slot_id
        ))
        current_time = end_time
        slot_id += 1
        
        # Morning block 2
        for i in range(2):
            end_time = add_minutes(current_time, 40)
            db.add(TimeSlot(
                schedule_id=default_schedule.id,
                slot_number=slot_id,
                start_time=current_time.strftime("%H:%M"),
                end_time=end_time.strftime("%H:%M"),
                slot_type="lesson",
                label=f"Lesson {slot_id-1}", # Adjust for break slot
                sequence_order=slot_id
            ))
            current_time = end_time
            slot_id += 1
            
        # Break 2
        end_time = add_minutes(current_time, 30)
        db.add(TimeSlot(
            schedule_id=default_schedule.id,
            slot_number=slot_id,
            start_time=current_time.strftime("%H:%M"),
            end_time=end_time.strftime("%H:%M"),
            slot_type="break",
            label="Tea Break",
            sequence_order=slot_id
        ))
        current_time = end_time
        slot_id += 1
        
        # Mid-day block
        for i in range(2):
            end_time = add_minutes(current_time, 40)
            db.add(TimeSlot(
                schedule_id=default_schedule.id,
                slot_number=slot_id,
                start_time=current_time.strftime("%H:%M"),
                end_time=end_time.strftime("%H:%M"),
                slot_type="lesson",
                label=f"Lesson {slot_id-2}",
                sequence_order=slot_id
            ))
            current_time = end_time
            slot_id += 1
            
        # Lunch
        end_time = add_minutes(current_time, 60)
        db.add(TimeSlot(
            schedule_id=default_schedule.id,
            slot_number=slot_id,
            start_time=current_time.strftime("%H:%M"),
            end_time=end_time.strftime("%H:%M"),
            slot_type="lunch",
            label="Lunch Break",
            sequence_order=slot_id
        ))
        current_time = end_time
        slot_id += 1
        
        # Afternoon block
        for i in range(2):
            end_time = add_minutes(current_time, 40)
            db.add(TimeSlot(
                schedule_id=default_schedule.id,
                slot_number=slot_id,
                start_time=current_time.strftime("%H:%M"),
                end_time=end_time.strftime("%H:%M"),
                slot_type="lesson",
                label=f"Lesson {slot_id-3}",
                sequence_order=slot_id
            ))
            current_time = end_time
            slot_id += 1
            
        db.commit()
        schedule = default_schedule
    
    time_slots = db.query(TimeSlot).filter(
        TimeSlot.schedule_id == schedule.id
    ).order_by(TimeSlot.sequence_order).all()
    
    return time_slots


@app.post(f"{settings.API_V1_PREFIX}/timetable/entries", response_model=TimetableEntryResponse)
async def create_timetable_entry(
    entry: TimetableEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new timetable entry (assign subject to time slot on specific day)"""
    
    # Verify time slot exists and belongs to a schedule owned by the user
    time_slot = db.query(TimeSlot).join(SchoolSchedule).filter(
        TimeSlot.id == entry.time_slot_id,
        SchoolSchedule.user_id == current_user.id
    ).first()
    
    if not time_slot:
        raise HTTPException(status_code=404, detail="Time slot not found or access denied")
        
    schedule = time_slot.schedule
    
    if time_slot.slot_type != "lesson":
        raise HTTPException(status_code=400, detail="Cannot assign subject to break/lunch slot")
    
    # Log what we received
    print(f"\n=== CREATE TIMETABLE ENTRY ===")
    print(f"Received subject_id: {entry.subject_id}")
    print(f"Time slot: {entry.time_slot_id}")
    print(f"Day: {entry.day_of_week}")
    
    # Try to find subject in user's subjects, or check if it's a curriculum template
    subject = db.query(Subject).filter(
        Subject.id == entry.subject_id,
        Subject.user_id == current_user.id
    ).first()
    
    print(f"Found in user's subjects: {subject.subject_name if subject else 'No'}")
    
    # If not found in user's subjects, check if it's a curriculum template
    if not subject:
        curriculum_template = db.query(CurriculumTemplate).filter(
            CurriculumTemplate.id == entry.subject_id,
            CurriculumTemplate.is_active == True
        ).first()
        
        if not curriculum_template:
            raise HTTPException(status_code=404, detail="Subject or curriculum template not found")
        
        print(f"Found curriculum template: {curriculum_template.subject} - {curriculum_template.grade}")
        
        # Check if user already has this subject with EXACT template match
        existing_subject = db.query(Subject).filter(
            Subject.user_id == current_user.id,
            Subject.template_id == curriculum_template.id
        ).first()
        
        print(f"Found existing subject from template: {existing_subject.subject_name if existing_subject else 'No'}")
        
        if existing_subject:
            # Use the existing subject
            subject = existing_subject
            entry.subject_id = subject.id
        else:
            # Create a new subject from the template for this user
            new_subject = Subject(
                user_id=current_user.id,
                template_id=curriculum_template.id,
                subject_name=curriculum_template.subject,
                grade=curriculum_template.grade,
                total_lessons=0,
                lessons_completed=0,
                progress_percentage=0.0
            )
            db.add(new_subject)
            db.flush()  # Get the ID without committing
            subject = new_subject
            entry.subject_id = subject.id
            print(f"Created new subject: {subject.subject_name} - {subject.grade} (ID: {subject.id})")
    existing = db.query(TimetableEntry).filter(
        TimetableEntry.user_id == current_user.id,
        TimetableEntry.time_slot_id == entry.time_slot_id,
        TimetableEntry.day_of_week == entry.day_of_week
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="This time slot is already occupied on this day"
        )
    
    # Handle double lesson - need to occupy next slot
    if entry.is_double_lesson:
        # Find all lesson slots for this schedule, ordered by sequence
        all_lesson_slots = db.query(TimeSlot).filter(
            TimeSlot.schedule_id == schedule.id,
            TimeSlot.slot_type == "lesson"
        ).order_by(TimeSlot.sequence_order).all()
        
        # Find current slot's position
        current_slot_index = next((i for i, slot in enumerate(all_lesson_slots) if slot.id == entry.time_slot_id), None)
        
        if current_slot_index is None or current_slot_index >= len(all_lesson_slots) - 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot create double lesson: no consecutive slot available"
            )
        
        next_slot = all_lesson_slots[current_slot_index + 1]
        
        # Check if next slot is already occupied
        next_slot_occupied = db.query(TimetableEntry).filter(
            TimetableEntry.user_id == current_user.id,
            TimetableEntry.time_slot_id == next_slot.id,
            TimetableEntry.day_of_week == entry.day_of_week
        ).first()
        
        if next_slot_occupied:
            raise HTTPException(
                status_code=400,
                detail="Cannot create double lesson: next time slot is already occupied"
            )
        
        print(f"Creating double lesson: slot {entry.time_slot_id} + {next_slot.id}")
        
        # Create entry for FIRST slot
        db_entry = TimetableEntry(
            user_id=current_user.id,
            schedule_id=schedule.id,
            **entry.dict()
        )
        db.add(db_entry)
        db.flush()  # Get the ID
        
        # Create entry for SECOND slot (consecutive)
        db_entry_2 = TimetableEntry(
            user_id=current_user.id,
            schedule_id=schedule.id,
            subject_id=entry.subject_id,
            time_slot_id=next_slot.id,
            day_of_week=entry.day_of_week,
            room_number=entry.room_number,
            grade_section=entry.grade_section,
            notes=f"(Part 2 of double lesson)",
            is_double_lesson=True
        )
        db.add(db_entry_2)
        db.commit()
        db.refresh(db_entry)
        
        return db_entry
    else:
        # Single lesson - create only one entry
        db_entry = TimetableEntry(
            user_id=current_user.id,
            schedule_id=schedule.id,
            **entry.dict()
        )
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        
        return db_entry


@app.get(f"{settings.API_V1_PREFIX}/timetable/entries", response_model=List[TimetableEntryResponse])
async def get_timetable_entries(
    day_of_week: Optional[int] = None,
    education_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all timetable entries, optionally filtered by day or education level."""
    schedule = resolve_schedule_for_context(db, current_user, education_level, day_of_week)
    if not schedule:
        return []
    query = db.query(TimetableEntry).filter(
        TimetableEntry.user_id == current_user.id,
        TimetableEntry.schedule_id == schedule.id
    )
    if day_of_week:
        query = query.filter(TimetableEntry.day_of_week == day_of_week)
    entries = query.order_by(TimetableEntry.day_of_week, TimetableEntry.time_slot_id).all()
    return entries


@app.get(f"{settings.API_V1_PREFIX}/timetable/entries/today")
async def get_today_entries(
    education_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get today's timetable with curriculum content"""
    from datetime import datetime
    
    # Get current day (1=Monday, 5=Friday)
    today = datetime.now().isoweekday()
    
    if today > 5:  # Weekend
        return {
            "day": today,
            "day_name": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][today - 1],
            "is_weekend": True,
            "entries": []
        }
    
    schedule = resolve_schedule_for_context(db, current_user, education_level, today)
    if not schedule:
        detail = (
            f"No active schedule found for {education_level}"
            if education_level else "No active schedule found"
        )
        raise HTTPException(status_code=404, detail=f"{detail}. Please create one.")
    
    # Get today's entries with subject and curriculum info
    entries = db.query(
        TimetableEntry,
        TimeSlot,
        Subject,
        Lesson
    ).join(
        TimeSlot, TimetableEntry.time_slot_id == TimeSlot.id
    ).join(
        Subject, TimetableEntry.subject_id == Subject.id
    ).outerjoin(
        Lesson, TimetableEntry.lesson_id == Lesson.id
    ).filter(
        TimetableEntry.user_id == current_user.id,
        TimetableEntry.schedule_id == schedule.id,
        TimetableEntry.day_of_week == today
    ).order_by(TimeSlot.sequence_order).all()
    
    result = []
    for entry, slot, subject, lesson in entries:
        entry_data = {
            "id": entry.id,
            "time_slot": {
                "id": slot.id,
                "start_time": slot.start_time,
                "end_time": slot.end_time,
                "label": slot.label
            },
            "subject": {
                "id": subject.id,
                "subject_name": subject.subject_name,
                "grade": subject.grade
            },
            "room_number": entry.room_number,
            "grade_section": entry.grade_section,
            "notes": entry.notes,
            "is_double_lesson": entry.is_double_lesson
        }
        
        # Add curriculum content if linked
        if lesson:
            entry_data["lesson"] = {
                "id": lesson.id,
                "lesson_title": lesson.lesson_title,
                "learning_outcomes": lesson.learning_outcomes,
                "is_completed": lesson.is_completed
            }
        
        result.append(entry_data)
    
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    
    return {
        "day": today,
        "day_name": day_names[today - 1],
        "is_weekend": False,
        "entries": result
    }


@app.get(f"{settings.API_V1_PREFIX}/timetable/entries/next")
async def get_next_lesson(
    education_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the next upcoming lesson"""
    from datetime import datetime
    
    current_time = datetime.now()
    current_day = current_time.isoweekday()
    current_time_str = current_time.strftime("%H:%M")
    
    schedule = resolve_schedule_for_context(db, current_user, education_level)
    if not schedule:
        detail = (
            f"No active schedule found for {education_level}"
            if education_level else "No active schedule found"
        )
        return {
            "has_next_lesson": False,
            "message": f"{detail}. Please create one."
        }
    print(f"[get_next_lesson] Current time: {current_time_str}, Current day: {current_day}")
    
    # Find next lesson today or on following days (check up to 8 days to cover full week)
    for day_offset in range(8):
        check_day = ((current_day - 1 + day_offset) % 7) + 1  # Properly wrap 1-7 (1=Mon, 7=Sun)
        
        if check_day > 5:  # Skip weekends (6=Saturday, 7=Sunday)
            continue
        
        # Get entries for this day
        entries = db.query(
            TimetableEntry,
            TimeSlot,
            Subject,
            Lesson
        ).join(
            TimeSlot, TimetableEntry.time_slot_id == TimeSlot.id
        ).join(
            Subject, TimetableEntry.subject_id == Subject.id
        ).outerjoin(
            Lesson, TimetableEntry.lesson_id == Lesson.id
        ).filter(
            TimetableEntry.user_id == current_user.id,
            TimetableEntry.schedule_id == schedule.id,
            TimetableEntry.day_of_week == check_day,
            TimeSlot.slot_type == "lesson"
        ).order_by(TimeSlot.sequence_order).all()
        
        for entry, slot, subject, lesson in entries:
            # If checking today, only consider future time slots
            if day_offset == 0 and slot.start_time <= current_time_str:
                continue
            
            # Found next lesson!
            result = {
                "has_next_lesson": True,
                "is_today": day_offset == 0,
                "day_of_week": check_day,
                "day_name": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][check_day - 1],
                "time_slot": {
                    "id": slot.id,
                    "start_time": slot.start_time,
                    "end_time": slot.end_time,
                    "label": slot.label
                },
                "subject": {
                    "id": subject.id,
                    "subject_name": subject.subject_name,
                    "grade": subject.grade
                },
                "room_number": entry.room_number,
                "grade_section": entry.grade_section,
                "is_double_lesson": entry.is_double_lesson
            }
            
            if lesson:
                result["lesson"] = {
                    "id": lesson.id,
                    "lesson_title": lesson.lesson_title,
                    "learning_outcomes": lesson.learning_outcomes,
                    "is_completed": lesson.is_completed
                }
            
            return result
    
    return {
        "has_next_lesson": False,
        "message": "No upcoming lessons in the next week"
    }


@app.put(f"{settings.API_V1_PREFIX}/timetable/entries/{{entry_id}}", response_model=TimetableEntryResponse)
async def update_timetable_entry(
    entry_id: int,
    entry_update: TimetableEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a timetable entry"""
    entry = db.query(TimetableEntry).filter(
        TimetableEntry.id == entry_id,
        TimetableEntry.user_id == current_user.id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    
    # Update fields
    update_data = entry_update.dict(exclude_unset=True)
    
    # Validate subject if being updated
    if "subject_id" in update_data:
        subject = db.query(Subject).filter(
            Subject.id == update_data["subject_id"],
            Subject.user_id == current_user.id
        ).first()
        
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
    
    # Handle double lesson changes
    was_double = entry.is_double_lesson
    becoming_double = update_data.get("is_double_lesson", was_double)
    
    if becoming_double and not was_double:
        # Converting to double lesson - need to occupy next slot
        schedule = db.query(SchoolSchedule).filter(
            SchoolSchedule.user_id == current_user.id,
            SchoolSchedule.is_active == True
        ).first()
        
        all_lesson_slots = db.query(TimeSlot).filter(
            TimeSlot.schedule_id == schedule.id,
            TimeSlot.slot_type == "lesson"
        ).order_by(TimeSlot.sequence_order).all()
        
        current_slot_index = next((i for i, slot in enumerate(all_lesson_slots) if slot.id == entry.time_slot_id), None)
        
        if current_slot_index is None or current_slot_index >= len(all_lesson_slots) - 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot convert to double lesson: no consecutive slot available"
            )
        
        next_slot = all_lesson_slots[current_slot_index + 1]
        
        # Check if next slot is already occupied
        next_slot_occupied = db.query(TimetableEntry).filter(
            TimetableEntry.user_id == current_user.id,
            TimetableEntry.time_slot_id == next_slot.id,
            TimetableEntry.day_of_week == entry.day_of_week
        ).first()
        
        if next_slot_occupied:
            raise HTTPException(
                status_code=400,
                detail="Cannot convert to double lesson: next time slot is already occupied"
            )
        
        # Create second slot entry
        db_entry_2 = TimetableEntry(
            user_id=current_user.id,
            schedule_id=entry.schedule_id,
            subject_id=update_data.get("subject_id", entry.subject_id),
            time_slot_id=next_slot.id,
            day_of_week=entry.day_of_week,
            room_number=update_data.get("room_number", entry.room_number),
            grade_section=update_data.get("grade_section", entry.grade_section),
            notes=f"(Part 2 of double lesson)",
            is_double_lesson=True
        )
        db.add(db_entry_2)
    
    elif not becoming_double and was_double:
        # Converting from double to single - need to remove next slot entry
        schedule = db.query(SchoolSchedule).filter(
            SchoolSchedule.user_id == current_user.id,
            SchoolSchedule.is_active == True
        ).first()
        
        all_lesson_slots = db.query(TimeSlot).filter(
            TimeSlot.schedule_id == schedule.id,
            TimeSlot.slot_type == "lesson"
        ).order_by(TimeSlot.sequence_order).all()
        
        current_slot_index = next((i for i, slot in enumerate(all_lesson_slots) if slot.id == entry.time_slot_id), None)
        
        if current_slot_index is not None and current_slot_index < len(all_lesson_slots) - 1:
            next_slot = all_lesson_slots[current_slot_index + 1]
            
            # Find and delete the second part of double lesson
            second_entry = db.query(TimetableEntry).filter(
                TimetableEntry.user_id == current_user.id,
                TimetableEntry.time_slot_id == next_slot.id,
                TimetableEntry.day_of_week == entry.day_of_week,
                TimetableEntry.subject_id == entry.subject_id,
                TimetableEntry.is_double_lesson == True
            ).first()
            
            if second_entry:
                db.delete(second_entry)
    
    # Apply updates
    for key, value in update_data.items():
        setattr(entry, key, value)
    
    db.commit()
    db.refresh(entry)
    
    return entry


@app.delete(f"{settings.API_V1_PREFIX}/timetable/entries/{{entry_id}}")
async def delete_timetable_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a timetable entry (and its paired slot if it's a double lesson)"""
    entry = db.query(TimetableEntry).filter(
        TimetableEntry.id == entry_id,
        TimetableEntry.user_id == current_user.id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    
    # If this is a double lesson, delete the paired entry too
    if entry.is_double_lesson:
        schedule = db.query(SchoolSchedule).filter(
            SchoolSchedule.user_id == current_user.id,
            SchoolSchedule.is_active == True
        ).first()
        
        all_lesson_slots = db.query(TimeSlot).filter(
            TimeSlot.schedule_id == schedule.id,
            TimeSlot.slot_type == "lesson"
        ).order_by(TimeSlot.sequence_order).all()
        
        current_slot_index = next((i for i, slot in enumerate(all_lesson_slots) if slot.id == entry.time_slot_id), None)
        
        if current_slot_index is not None and current_slot_index < len(all_lesson_slots) - 1:
            next_slot = all_lesson_slots[current_slot_index + 1]
            
            # Find and delete the second part
            second_entry = db.query(TimetableEntry).filter(
                TimetableEntry.user_id == current_user.id,
                TimetableEntry.time_slot_id == next_slot.id,
                TimetableEntry.day_of_week == entry.day_of_week,
                TimetableEntry.subject_id == entry.subject_id,
                TimetableEntry.is_double_lesson == True
            ).first()
            
            if second_entry:
                db.delete(second_entry)
    
    db.delete(entry)
    db.commit()
    
    return {"message": "Timetable entry deleted successfully"}


@app.get(f"{settings.API_V1_PREFIX}/timetable/dashboard")
async def get_timetable_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive timetable dashboard data (today's lessons + next lesson)"""
    
    # Get today's schedule
    today_data = await get_today_entries(current_user, db)
    
    # Get next lesson
    next_lesson = await get_next_lesson(current_user, db)
    
    return {
        "today": today_data,
        "next_lesson": next_lesson
    }


"""SCHEME OF WORK ENDPOINTS"""

from pydantic import BaseModel
from io import BytesIO
# Defer WeasyPrint import to inside PDF endpoint to avoid startup crash if system libs missing

# SchemeLessonUpdate moved to schemas.py

@app.get(f"{settings.API_V1_PREFIX}/schemes", response_model=List[SchemeOfWorkSummary])
async def list_schemes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schemes = db.query(SchemeOfWork).filter(SchemeOfWork.user_id == current_user.id).order_by(SchemeOfWork.created_at.desc()).all()
    return schemes

@app.get(f"{settings.API_V1_PREFIX}/schemes/stats")
async def scheme_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(SchemeOfWork).filter(SchemeOfWork.user_id == current_user.id)
    total = q.count()
    active = q.filter(SchemeOfWork.status == "active").count()
    completed = q.filter(SchemeOfWork.status == "completed").count()
    completion_rate = (completed / total * 100) if total else 0
    return {
        "total_schemes": total,
        "active_schemes": active,
        "completed_schemes": completed,
        "completion_rate": round(completion_rate, 2)
    }

@app.get(f"{settings.API_V1_PREFIX}/schemes/{{scheme_id}}", response_model=SchemeOfWorkResponse)
async def get_scheme(
    scheme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme = db.query(SchemeOfWork).options(joinedload(SchemeOfWork.weeks).joinedload(SchemeWeek.lessons)).filter(
        SchemeOfWork.id == scheme_id,
        SchemeOfWork.user_id == current_user.id
    ).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme of work not found")
    return scheme

@app.post(f"{settings.API_V1_PREFIX}/schemes", response_model=SchemeOfWorkResponse, status_code=201)
async def create_scheme(
    data: SchemeOfWorkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme = SchemeOfWork(
        user_id=current_user.id,
        subject_id=data.subject_id,
        teacher_name=data.teacher_name,
        school=data.school,
        term=data.term,
        year=data.year,
        subject=data.subject,
        grade=data.grade,
        total_weeks=data.total_weeks,
        total_lessons=data.total_lessons,
        status=data.status or "draft"
    )
    db.add(scheme)
    db.flush()  # Get scheme.id

    for week_payload in data.weeks:
        week = SchemeWeek(scheme_id=scheme.id, week_number=week_payload.week_number)
        db.add(week)
        db.flush()
        for idx, lesson_payload in enumerate(week_payload.lessons):
            lesson = SchemeLesson(
                week_id=week.id,
                lesson_number=idx + 1,
                strand=lesson_payload.strand,
                sub_strand=lesson_payload.sub_strand,
                specific_learning_outcomes=lesson_payload.specific_learning_outcomes,
                key_inquiry_questions=lesson_payload.key_inquiry_questions,
                learning_experiences=lesson_payload.learning_experiences,
                learning_resources=lesson_payload.learning_resources,
                textbook_name=lesson_payload.textbook_name,
                textbook_teacher_guide_pages=lesson_payload.textbook_teacher_guide_pages,
                textbook_learner_book_pages=lesson_payload.textbook_learner_book_pages,
                assessment_methods=lesson_payload.assessment_methods,
                reflection=lesson_payload.reflection or ""
            )
            db.add(lesson)

    db.commit()
    db.refresh(scheme)
    return scheme

@app.put(f"{settings.API_V1_PREFIX}/schemes/{{scheme_id}}", response_model=SchemeOfWorkResponse)
async def update_scheme(
    scheme_id: int,
    data: SchemeOfWorkUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme = db.query(SchemeOfWork).filter(
        SchemeOfWork.id == scheme_id,
        SchemeOfWork.user_id == current_user.id
    ).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme of work not found")

    update_data = data.model_dump(exclude_none=True)
    weeks_data = update_data.pop('weeks', None)

    # Update top-level fields
    for field, value in update_data.items():
        setattr(scheme, field, value)
    
    # Update nested weeks and lessons if provided
    if weeks_data:
        for week_data in weeks_data:
            week_number = week_data.get('week_number')
            lessons_data = week_data.get('lessons')
            
            if week_number is not None and lessons_data:
                # Find the week in the existing scheme
                week = next((w for w in scheme.weeks if w.week_number == week_number), None)
                if week:
                    for lesson_data in lessons_data:
                        # Try to find lesson by ID if provided, or by lesson_number if available in data (though SchemeLessonUpdate might not have it)
                        # The frontend sends the full object so it likely has IDs.
                        lesson_id = lesson_data.get('id')
                        
                        if lesson_id:
                             lesson = next((l for l in week.lessons if l.id == lesson_id), None)
                             if lesson:
                                 for l_field, l_value in lesson_data.items():
                                     if l_field != 'id':
                                         setattr(lesson, l_field, l_value)

    db.commit()
    db.refresh(scheme)
    return scheme

@app.delete(f"{settings.API_V1_PREFIX}/schemes/{{scheme_id}}")
async def delete_scheme(
    scheme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme = db.query(SchemeOfWork).filter(
        SchemeOfWork.id == scheme_id,
        SchemeOfWork.user_id == current_user.id
    ).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme of work not found")
    db.delete(scheme); db.commit()
    return {"message": "Scheme of work deleted"}

@app.put(f"{settings.API_V1_PREFIX}/schemes/{{scheme_id}}/lessons/{{lesson_id}}", response_model=SchemeLessonCreate)
async def update_scheme_lesson(
    scheme_id: int,
    lesson_id: int,
    payload: SchemeLessonUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme = db.query(SchemeOfWork).filter(
        SchemeOfWork.id == scheme_id,
        SchemeOfWork.user_id == current_user.id
    ).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme of work not found")
    lesson = db.query(SchemeLesson).join(SchemeWeek).filter(
        SchemeLesson.id == lesson_id,
        SchemeWeek.scheme_id == scheme_id
    ).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(lesson, field, value)
    db.commit(); db.refresh(lesson)
    return SchemeLessonCreate(
        strand=lesson.strand,
        sub_strand=lesson.sub_strand,
        specific_learning_outcomes=lesson.specific_learning_outcomes,
        key_inquiry_questions=lesson.key_inquiry_questions,
        learning_experiences=lesson.learning_experiences,
        learning_resources=lesson.learning_resources,
        textbook_name=lesson.textbook_name,
        textbook_teacher_guide_pages=lesson.textbook_teacher_guide_pages,
        textbook_learner_book_pages=lesson.textbook_learner_book_pages,
        assessment_methods=lesson.assessment_methods,
        reflection=lesson.reflection
    )

@app.get(f"{settings.API_V1_PREFIX}/schemes/{{scheme_id}}/pdf")
async def scheme_pdf(
    scheme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme = db.query(SchemeOfWork).options(joinedload(SchemeOfWork.weeks).joinedload(SchemeWeek.lessons)).filter(
        SchemeOfWork.id == scheme_id,
        SchemeOfWork.user_id == current_user.id
    ).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme of work not found")

    # Use ReportLab for PDF generation (pure Python, no native deps)
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib.enums import TA_CENTER
    
    pdf_io = BytesIO()
    # Reduced margins for more content space
    doc = SimpleDocTemplate(pdf_io, pagesize=landscape(A4), leftMargin=0.25*cm, rightMargin=0.25*cm, topMargin=0.25*cm, bottomMargin=0.25*cm)
    elements = []
    styles = getSampleStyleSheet()
    
    # Cover Page
    elements.append(Spacer(1, 3*cm)) # Vertical centering
    
    # Title Section
    title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=36, textColor=colors.HexColor('#1e293b'), alignment=TA_CENTER, spaceAfter=12, leading=42)
    elements.append(Paragraph("SCHEME OF WORK", title_style))
    
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontName='Helvetica', fontSize=18, textColor=colors.HexColor('#64748b'), alignment=TA_CENTER, spaceAfter=30, leading=24)
    elements.append(Paragraph(f"{scheme.subject} • {scheme.grade}", subtitle_style))
    
    # Decorative Divider
    line_data = [[""]]
    line_table = Table(line_data, colWidths=[10*cm], rowHeights=[2])
    line_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#4F46E5')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    elements.append(line_table)
    elements.append(Spacer(1, 2*cm))
    
    # Info Grid Data
    label_style = ParagraphStyle('Label', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor('#64748b'), alignment=TA_CENTER, leading=12)
    value_style = ParagraphStyle('Value', parent=styles['Normal'], fontName='Helvetica', fontSize=14, textColor=colors.HexColor('#0f172a'), alignment=TA_CENTER, leading=18)
    
    cell_1_1 = [Paragraph("TEACHER", label_style), Spacer(1, 3), Paragraph(scheme.teacher_name or "-", value_style)]
    cell_1_2 = [Paragraph("TERM", label_style), Spacer(1, 3), Paragraph(scheme.term or "-", value_style)]
    cell_1_3 = [Paragraph("TOTAL WEEKS", label_style), Spacer(1, 3), Paragraph(str(scheme.total_weeks), value_style)]
    
    cell_2_1 = [Paragraph("SCHOOL", label_style), Spacer(1, 3), Paragraph(scheme.school or "-", value_style)]
    cell_2_2 = [Paragraph("YEAR", label_style), Spacer(1, 3), Paragraph(str(scheme.year), value_style)]
    cell_2_3 = [Paragraph("TOTAL LESSONS", label_style), Spacer(1, 3), Paragraph(str(scheme.total_lessons), value_style)]
    
    info_data = [
        [cell_1_1, cell_1_2, cell_1_3],
        [cell_2_1, cell_2_2, cell_2_3]
    ]
    
    info_table = Table(info_data, colWidths=[7*cm, 7*cm, 7*cm])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 20),
        ('BOTTOMPADDING', (0,0), (-1,-1), 20),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        
        # Grid lines
        ('LINEAFTER', (0,0), (1,-1), 0.5, colors.HexColor('#cbd5e1')), # Vertical lines between cols
        ('LINEBELOW', (0,0), (-1,0), 0.5, colors.HexColor('#cbd5e1')), # Horizontal line between rows
        
        # Outer Border
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor('#94a3b8')),
        
        # Background
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
    ]))
    
    elements.append(info_table)
    elements.append(PageBreak())
    
    # Helper function to format learning experiences with bullets
    def format_learning_experiences(text):
        if not text:
            return ""
        
        # Split by newline if present, otherwise split by period
        if '\n' in text:
            parts = text.split('\n')
        else:
            # Simple split by period, filtering empty strings
            parts = [p.strip() for p in text.split('.') if p.strip()]
            
        formatted = []
        for p in parts:
            p = p.strip()
            if p:
                # Remove existing bullets
                p = p.lstrip('•-* ')
                if p:
                    capitalized = p[0].upper() + p[1:]
                    formatted.append(f"• {capitalized}")
                    
        return "<br/>".join(formatted)

    # Helper function to format resources
    def format_resources(text, lesson):
        formatted_parts = []
        
        # Format basic resources
        if text:
            resources_list = [r.strip() for r in text.split(',') if r.strip()]
            for r in resources_list:
                capitalized = r[0].upper() + r[1:]
                formatted_parts.append(f"• {capitalized}")
        
        # Add textbook info
        if lesson.textbook_name:
            # Add spacing if there are other resources
            if formatted_parts:
                formatted_parts.append("<br/>")
                
            formatted_parts.append("<b>Textbook:</b>")
            formatted_parts.append(f"{lesson.textbook_name}")
            
            if lesson.textbook_teacher_guide_pages:
                formatted_parts.append(f"TG: {lesson.textbook_teacher_guide_pages}")
            
            if lesson.textbook_learner_book_pages:
                formatted_parts.append(f"LB: {lesson.textbook_learner_book_pages}")
                
        return "<br/>".join(formatted_parts)

    # Helper function to format assessment methods
    def format_assessment_methods(text):
        if not text:
            return ""
        
        formatted_parts = []
        methods_list = [m.strip() for m in text.split(',') if m.strip()]
        
        for m in methods_list:
            capitalized = m[0].upper() + m[1:]
            formatted_parts.append(f"• {capitalized}")
            
        return "<br/>".join(formatted_parts)
    
    # Main table - use Paragraphs for text wrapping with optimized spacing
    cell_style = ParagraphStyle('CellStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=12, spaceBefore=2, spaceAfter=2, textColor=colors.HexColor('#334155'))
    header_style = ParagraphStyle('HeaderStyle', parent=styles['Normal'], fontSize=9, textColor=colors.white, fontName='Helvetica-Bold', leading=11, alignment=TA_CENTER)
    
    # Uppercase headers
    table_data = [[
        Paragraph('WEEK', header_style),
        Paragraph('LESSON', header_style),
        Paragraph('STRAND', header_style),
        Paragraph('SUB-STRAND', header_style),
        Paragraph('LEARNING OUTCOMES', header_style),
        Paragraph('INQUIRY QUESTIONS', header_style),
        Paragraph('LEARNING EXPERIENCES', header_style),
        Paragraph('RESOURCES', header_style),
        Paragraph('ASSESSMENT', header_style),
        Paragraph('REFLECTION', header_style)
    ]]
    
    # Track row spans for merging week cells
    # row_spans = [] # Disabled to prevent LayoutError on page breaks
    current_row_index = 1 # Start after header row
    week_col_lines = [] # Dynamic lines for week column
    
    for week in sorted(scheme.weeks, key=lambda w: w.week_number):
        week_lessons = sorted(week.lessons, key=lambda l: l.lesson_number)
        num_lessons = len(week_lessons)
        
        if num_lessons > 0:
            # Calculate end row for this week to draw the bottom line
            end_row = current_row_index + num_lessons - 1
            week_col_lines.append(('LINEBELOW', (0, end_row), (0, end_row), 0.5, colors.HexColor('#94a3b8')))
        
        for i, lesson in enumerate(week_lessons):
            # Only show week number in the first row of the week
            # Use bold for week number
            week_text = f"<b>{week.week_number}</b>" if i == 0 else ""
            
            outcomes = lesson.specific_learning_outcomes or ""
            if outcomes and not outcomes.startswith("By the end of the sub-strand"):
                outcomes = f"By the end of the sub-strand, the learner should be able to: {outcomes}"
            
            # Format resources to include textbooks
            resources = format_resources(lesson.learning_resources, lesson)
            
            # Format assessment methods
            assessments = format_assessment_methods(lesson.assessment_methods)

            table_data.append([
                Paragraph(week_text, cell_style),
                Paragraph(str(lesson.lesson_number), cell_style),
                Paragraph(lesson.strand or "", cell_style),
                Paragraph(lesson.sub_strand or "", cell_style),
                Paragraph(outcomes, cell_style),
                Paragraph(lesson.key_inquiry_questions or "", cell_style),
                Paragraph(format_learning_experiences(lesson.learning_experiences or ""), cell_style),
                Paragraph(resources, cell_style),
                Paragraph(assessments, cell_style),
                Paragraph(lesson.reflection or "", cell_style)
            ])
            current_row_index += 1
    
    # Optimized column widths to reduce space wastage and fill landscape A4 (Total ~29.0cm)
    # Week, Lesson, Strand, Sub-strand, Outcomes, Questions, Experiences, Resources, Assessment, Reflection
    # Reduced total width slightly to ensure right border is not clipped
    main_table = Table(table_data, colWidths=[0.8*cm, 0.8*cm, 2.5*cm, 3.0*cm, 5.0*cm, 3.5*cm, 5.8*cm, 3.5*cm, 2.8*cm, 1.3*cm], repeatRows=1, splitByRow=1)
    
    table_style_commands = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')), # Dark Slate Header
        
        # Grid for columns 1 to end (Lesson onwards) - draws all lines
        ('GRID', (1, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')), # Light Slate Grid
        
        # Vertical lines for Week column
        ('LINEBEFORE', (0, 0), (0, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('LINEAFTER', (0, 0), (0, -1), 0.5, colors.HexColor('#cbd5e1')),
        
        # Top line for Week column header
        ('LINEABOVE', (0, 0), (0, 0), 0.5, colors.HexColor('#cbd5e1')),
        # Bottom line for Week column header (separator between header and data)
        ('LINEBELOW', (0, 0), (0, 0), 0.5, colors.HexColor('#cbd5e1')),

        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        # Increased padding for premium feel
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('ALIGN', (0, 1), (1, -1), 'CENTER'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
    ]
    
    # Add dynamic week lines
    table_style_commands.extend(week_col_lines)
    
    main_table.setStyle(TableStyle(table_style_commands))
    main_table.hAlign = 'LEFT'
    elements.append(main_table)
    
    doc.build(elements)
    pdf_io.seek(0)
    filename = f"scheme_{scheme.id}_{scheme.subject}_{scheme.grade}_{scheme.term}_{scheme.year}.pdf".replace(" ", "_")
    return StreamingResponse(pdf_io, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})

# ============================================================================
# LESSON PLAN ENDPOINTS
# ============================================================================

@app.post(f"{settings.API_V1_PREFIX}/lesson-plans", response_model=LessonPlanResponse)
async def create_lesson_plan(
    lesson_plan: LessonPlanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new lesson plan"""
    # Convert empty strings to None for date field
    plan_data = lesson_plan.dict()
    if plan_data.get("date") == "":
        plan_data["date"] = None
        
    db_lesson_plan = LessonPlan(
        user_id=current_user.id,
        **plan_data
    )
    db.add(db_lesson_plan)
    db.commit()
    db.refresh(db_lesson_plan)
    return db_lesson_plan

@app.get(f"{settings.API_V1_PREFIX}/lesson-plans", response_model=List[LessonPlanSummary])
async def get_lesson_plans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all lesson plans for the current user"""
    lesson_plans = db.query(LessonPlan).options(
        joinedload(LessonPlan.scheme_lesson).joinedload(SchemeLesson.week)
    ).filter(LessonPlan.user_id == current_user.id).all()
    return lesson_plans

@app.get(f"{settings.API_V1_PREFIX}/lesson-plans/{{lesson_plan_id}}", response_model=LessonPlanResponse)
async def get_lesson_plan(
    lesson_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific lesson plan by ID"""
    lesson_plan = db.query(LessonPlan).filter(
        LessonPlan.id == lesson_plan_id,
        LessonPlan.user_id == current_user.id
    ).first()
    if not lesson_plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    
    # Get lesson duration from subject
    subject = db.query(Subject).filter(Subject.id == lesson_plan.subject_id).first()
    if subject:
        lesson_plan.lesson_duration_minutes = subject.single_lesson_duration
    else:
        lesson_plan.lesson_duration_minutes = 40 # Default
        
    return lesson_plan

@app.put(f"{settings.API_V1_PREFIX}/lesson-plans/{{lesson_plan_id}}", response_model=LessonPlanResponse)
async def update_lesson_plan(
    lesson_plan_id: int,
    lesson_plan_update: LessonPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a lesson plan"""
    lesson_plan = db.query(LessonPlan).filter(
        LessonPlan.id == lesson_plan_id,
        LessonPlan.user_id == current_user.id
    ).first()
    if not lesson_plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    
    update_data = lesson_plan_update.dict(exclude_unset=True)
    
    # Convert empty strings to None for date field
    if "date" in update_data and update_data["date"] == "":
        update_data["date"] = None
        
    for field, value in update_data.items():
        setattr(lesson_plan, field, value)
    
    db.commit()
    db.refresh(lesson_plan)
    return lesson_plan

@app.delete(f"{settings.API_V1_PREFIX}/lesson-plans/{{lesson_plan_id}}")
async def delete_lesson_plan(
    lesson_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a lesson plan"""
    lesson_plan = db.query(LessonPlan).filter(
        LessonPlan.id == lesson_plan_id,
        LessonPlan.user_id == current_user.id
    ).first()
    if not lesson_plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    
    db.delete(lesson_plan)
    db.commit()
    return {"message": "Lesson plan deleted successfully"}

@app.post(f"{settings.API_V1_PREFIX}/lesson-plans/bulk-delete")
async def bulk_delete_lesson_plans(
    ids: List[int],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bulk delete lesson plans"""
    # Verify ownership and delete
    result = db.query(LessonPlan).filter(
        LessonPlan.id.in_(ids),
        LessonPlan.user_id == current_user.id
    ).delete(synchronize_session=False)
    
    db.commit()
    return {"message": f"Successfully deleted {result} lesson plans"}

@app.post(f"{settings.API_V1_PREFIX}/lesson-plans/{{lesson_plan_id}}/auto-generate", response_model=LessonPlanResponse)
async def auto_generate_lesson_plan(
    lesson_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Auto-generate lesson plan content from curriculum data"""
    lesson_plan = db.query(LessonPlan).filter(
        LessonPlan.id == lesson_plan_id,
        LessonPlan.user_id == current_user.id
    ).first()
    if not lesson_plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    
    # Get the subject to find curriculum data
    subject = db.query(Subject).filter(Subject.id == lesson_plan.subject_id).first()
    
    # Build introduction based on strand/substrand
    strand = lesson_plan.strand_theme_topic or ""
    sub_strand = lesson_plan.sub_strand_sub_theme_sub_topic or ""
    learning_outcomes = lesson_plan.specific_learning_outcomes or ""
    key_questions = lesson_plan.key_inquiry_questions or ""
    resources = lesson_plan.learning_resources or ""
    
    # Generate Introduction (5 minutes)
    intro_parts = [
        "Introduction (5 minutes)",
        f"• Welcome learners and recap the previous lesson",
        f"• Introduce today's topic: {sub_strand}" if sub_strand else "• Introduce today's topic",
        f"• Present the key inquiry question: {key_questions.split(',')[0].strip() if key_questions else 'What will we learn today?'}",
        "• State the learning objectives for the lesson",
        "• Activate prior knowledge through quick questions"
    ]
    lesson_plan.introduction = "\n".join(intro_parts)
    
    # Generate Lesson Development (main body)
    dev_parts = [
        "Lesson Development (30 minutes)",
        "",
        "Step 1: Explanation (10 minutes)",
        f"• Explain the concept of {sub_strand}" if sub_strand else "• Explain the main concept",
        f"• Use {resources.split(',')[0].strip() if resources else 'teaching aids'} to demonstrate",
        "• Allow learners to ask questions for clarification",
        "",
        "Step 2: Guided Practice (10 minutes)", 
        "• Guide learners through examples together",
        "• Model the expected process step by step",
        "• Check for understanding frequently",
        "",
        "Step 3: Independent Practice (10 minutes)",
        "• Learners work individually or in groups",
        "• Teacher moves around to offer support",
        "• Provide differentiated tasks for varied abilities"
    ]
    lesson_plan.development = "\n".join(dev_parts)
    
    # Generate Conclusion (5 minutes)
    conclusion_parts = [
        "Conclusion (5 minutes)",
        f"• Summarize key points about {sub_strand}" if sub_strand else "• Summarize key points",
        "• Ask learners to share what they learned",
        "• Give a brief assessment or exit ticket",
        "• Preview the next lesson",
        "• Assign homework/extended learning activity"
    ]
    lesson_plan.conclusion = "\n".join(conclusion_parts)
    
    # Generate Summary
    lesson_plan.summary = f"In this lesson, learners explored {sub_strand if sub_strand else 'the topic'}. They achieved the following outcomes: {learning_outcomes[:200] if learning_outcomes else 'Understanding of key concepts'}..."
    
    db.commit()
    db.refresh(lesson_plan)
    return lesson_plan

@app.post(f"{settings.API_V1_PREFIX}/lesson-plans/{{lesson_plan_id}}/enhance", response_model=LessonPlanResponse)
async def enhance_lesson_plan_with_ai(
    lesson_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enhance lesson plan content using AI (or template-based enhancement)"""
    lesson_plan = db.query(LessonPlan).filter(
        LessonPlan.id == lesson_plan_id,
        LessonPlan.user_id == current_user.id
    ).first()
    if not lesson_plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    
    # Get context
    strand = lesson_plan.strand_theme_topic or "the topic"
    sub_strand = lesson_plan.sub_strand_sub_theme_sub_topic or "the sub-topic"
    grade = lesson_plan.grade or "learners"
    learning_area = lesson_plan.learning_area or "the subject"
    learning_outcomes = lesson_plan.specific_learning_outcomes or ""
    key_questions = lesson_plan.key_inquiry_questions or ""
    resources = lesson_plan.learning_resources or "teaching aids"
    core_competences = lesson_plan.core_competences or "Critical thinking, Communication"
    values = lesson_plan.values_to_be_developed or "Responsibility, Respect"
    
    # Enhanced Introduction
    intro_parts = [
        "INTRODUCTION (5 minutes)",
        "",
        "1. Greeting & Settling (1 min)",
        "   • Welcome learners warmly",
        "   • Ensure classroom is organized and ready",
        "",
        "2. Prior Knowledge Activation (2 mins)",
        f"   • Ask: 'What do you already know about {sub_strand}?'",
        "   • Use think-pair-share strategy",
        "   • Note responses on the board",
        "",
        "3. Learning Objectives (2 mins)",
        f"   • Display today's objectives clearly",
        f"   • By the end of this lesson, learners will be able to:",
    ]
    if learning_outcomes:
        for i, outcome in enumerate(learning_outcomes.split('\n')[:3], 1):
            if outcome.strip():
                intro_parts.append(f"     {i}. {outcome.strip()[:100]}")
    intro_parts.extend([
        "",
        f"   • Key Question: {key_questions.split(',')[0].strip() if key_questions else 'What will we discover today?'}"
    ])
    lesson_plan.introduction = "\n".join(intro_parts)
    
    # Enhanced Lesson Development
    dev_parts = [
        "LESSON DEVELOPMENT (30 minutes)",
        "",
        "STEP 1: TEACHER EXPOSITION (8 mins)",
        f"• Introduce {sub_strand} using clear explanations",
        f"• Use {resources} to demonstrate concepts",
        "• Write key terms and definitions on the board",
        "• Use real-life examples relevant to learners' experiences",
        "",
        "STEP 2: GUIDED DISCOVERY (10 mins)",
        "• Engage learners through questioning",
        "• Model the problem-solving process",
        "• Work through examples together as a class",
        f"• Connect to {strand} theme",
        "",
        "STEP 3: GROUP ACTIVITY (7 mins)",
        "• Divide learners into groups of 4-5",
        "• Assign differentiated tasks based on ability",
        "• Circulate and provide scaffolding where needed",
        f"• Encourage development of: {core_competences}",
        "",
        "STEP 4: PRESENTATION & FEEDBACK (5 mins)",
        "• Selected groups share their work",
        "• Class provides constructive feedback",
        "• Teacher clarifies misconceptions",
        f"• Reinforce values: {values}"
    ]
    lesson_plan.development = "\n".join(dev_parts)
    
    # Enhanced Conclusion
    conclusion_parts = [
        "CONCLUSION (5 minutes)",
        "",
        "1. Summary (2 mins)",
        f"   • Review key points about {sub_strand}",
        "   • Use learner responses to summarize",
        "",
        "2. Assessment (2 mins)",
        "   • Quick oral questions to check understanding",
        "   • Thumbs up/down for self-assessment",
        "   • Note learners who need extra support",
        "",
        "3. Closure (1 min)",
        "   • Preview next lesson's topic",
        "   • Assign homework/extension activity",
        "   • Dismiss learners in an orderly manner"
    ]
    lesson_plan.conclusion = "\n".join(conclusion_parts)
    
    # Enhanced Summary
    lesson_plan.summary = f"""LESSON SUMMARY:
Topic: {sub_strand}
Grade: {grade}
Learning Area: {learning_area}

Key Learning Points:
• {learning_outcomes[:150] if learning_outcomes else 'Core concepts were covered'}

Competences Developed: {core_competences}
Values Instilled: {values}

Teaching Methods Used:
• Direct instruction
• Guided discovery
• Collaborative learning
• Formative assessment"""

    # Enhanced Reflection template
    lesson_plan.reflection_self_evaluation = """TEACHER'S REFLECTION:

1. Achievement of Objectives:
   □ Fully achieved  □ Partially achieved  □ Not achieved

2. Learner Engagement:
   □ Excellent  □ Good  □ Needs improvement

3. Time Management:
   □ On schedule  □ Rushed  □ Had extra time

4. What worked well:
   _________________________________

5. Areas for improvement:
   _________________________________

6. Follow-up actions needed:
   _________________________________"""
    
    db.commit()
    db.refresh(lesson_plan)
    return lesson_plan

@app.post(f"{settings.API_V1_PREFIX}/schemes/{{scheme_id}}/generate-lesson-plans")
async def generate_lesson_plans_from_scheme(
    scheme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate individual lesson plans from a scheme of work"""
    # Get the scheme with all its weeks and lessons
    scheme = db.query(SchemeOfWork).options(
        joinedload(SchemeOfWork.weeks).joinedload(SchemeWeek.lessons),
        joinedload(SchemeOfWork.subject_rel)
    ).filter(
        SchemeOfWork.id == scheme_id,
        SchemeOfWork.user_id == current_user.id
    ).first()
    
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme of work not found")
    
    # Check if lesson plans already exist for this scheme
    existing_plans = db.query(LessonPlan).join(SchemeLesson).join(SchemeWeek).filter(
        SchemeWeek.scheme_id == scheme_id
    ).count()
    
    if existing_plans > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Lesson plans already exist for this scheme ({existing_plans} plans found). Delete existing plans first if you want to regenerate."
        )
    
    created_plans = []
    lesson_counter = 1
    
    # Generate lesson plans for each lesson in each week
    # Fetch school settings for roll/stream info
    school_settings = db.query(SchoolSettings).first()

    # Fetch Term Start Date
    term_start_date = None
    try:
        # Assuming scheme.term is like "Term 1", "Term 2"
        term_number = int(scheme.term.split(" ")[-1])
        school_term = db.query(SchoolTerm).filter(
            SchoolTerm.year == scheme.year,
            SchoolTerm.term_number == term_number
        ).first()
        if school_term:
            term_start_date = school_term.start_date
    except Exception as e:
        print(f"Error fetching term dates: {e}")

    # Fetch Timetable Slots for this Subject
    timetable_slots = []
    try:
        # Find timetable entries for this subject and grade
        # We need to match the subject name and grade
        # This is a bit tricky as subject names might vary slightly, but let's try exact match first
        # Also need to handle the day of week mapping
        
        # Get all entries for this subject/grade
        entries = db.query(TimetableEntry).filter(
            TimetableEntry.subject == scheme.subject,
            TimetableEntry.grade == scheme.grade
        ).all()
        
        # Sort them by day and start time to create a sequence
        # Day: Monday=1, Tuesday=2...
        # We want a list of slots: [Slot1(Mon), Slot2(Mon), Slot3(Tue)...]
        
        # Helper to convert day name to number
        day_map = {"Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5}
        
        processed_entries = []
        for entry in entries:
            day_num = day_map.get(entry.day_of_week, 6)
            processed_entries.append({
                "day": day_num,
                "start": entry.start_time,
                "end": entry.end_time,
                "section": entry.section # e.g. "Grade 9 Blue"
            })
            
        # Sort by day then start time
        timetable_slots = sorted(processed_entries, key=lambda x: (x['day'], x['start']))
        
    except Exception as e:
        print(f"Error fetching timetable: {e}")
    
    for week in scheme.weeks:
        for lesson in week.lessons:
            # Try to find matching SubStrand to get curriculum details
            # We match by subject_id (via Strand) and substrand_name
            substrand_details = db.query(SubStrand).join(Strand).filter(
                Strand.subject_id == scheme.subject_id,
                SubStrand.substrand_name == lesson.sub_strand
            ).first()
            
            # Fallback: If not found in user's subject, try the template
            if not substrand_details and scheme.subject_rel.template_id:
                substrand_details = db.query(TemplateSubstrand).join(TemplateStrand).filter(
                    TemplateStrand.curriculum_template_id == scheme.subject_rel.template_id,
                    TemplateSubstrand.substrand_name == lesson.sub_strand
                ).first()
            
            core_competencies_text = ""
            values_text = ""
            pcis_text = ""
            
            # Helper to clean curriculum items (remove explanations)
            def clean_list_items(items):
                if not items:
                    return ""
                
                # Normalize to list of strings
                if isinstance(items, list):
                    raw_list = items
                else:
                    # If it's a string, try to split by comma if it looks like a list
                    # This handles "Unity; expl, Love; expl"
                    text = str(items)
                    if "," in text:
                        raw_list = text.split(',')
                    else:
                        raw_list = [text]
                
                cleaned = []
                for item in raw_list:
                    item_str = str(item).strip()
                    if not item_str:
                        continue
                        
                    # Heuristics to extract the key term
                    # We look for separators like ; : or - 
                    # And we take the first part if the separator exists
                    
                    # 1. Semicolon (Unity; explanation) - High priority based on user feedback
                    if ";" in item_str:
                        item_str = item_str.split(";")[0]
                        
                    # 2. Colon (Communication: Ability to...)
                    elif ":" in item_str:
                        item_str = item_str.split(":")[0]
                        
                    # 3. Dash (Unity - Working together)
                    elif " - " in item_str:
                        item_str = item_str.split(" - ")[0]
                    
                    cleaned.append(item_str.strip())
                
                # Remove duplicates and join
                # Use dict.fromkeys to preserve order while removing duplicates
                return ", ".join(list(dict.fromkeys(cleaned)))

            if substrand_details:
                # Extract and format JSON fields
                core_competencies_text = clean_list_items(substrand_details.core_competencies)
                values_text = clean_list_items(substrand_details.values)
                pcis_text = clean_list_items(substrand_details.pcis)

            # Determine Roll and Stream info if possible
            roll_text = ""
            grade_text = scheme.grade
            date_text = None
            time_text = ""
            
            # 1. Try to populate from Timetable (Smart Scheduling)
            if term_start_date and timetable_slots:
                # Calculate target slot index: (lesson_number - 1) % num_slots
                # But wait, lesson_number is per week (1, 2, 3...)
                # So we just take the (lesson.lesson_number - 1)-th slot of the week
                slot_idx = lesson.lesson_number - 1
                
                if slot_idx < len(timetable_slots):
                    slot = timetable_slots[slot_idx]
                    
                    # Calculate Date
                    # Start Date is usually Monday of Week 1 (or close to it)
                    # Let's find the Monday of the week containing term_start_date
                    start_monday = term_start_date - timedelta(days=term_start_date.weekday())
                    
                    # Target Monday = Start Monday + (WeekNum - 1) weeks
                    target_monday = start_monday + timedelta(weeks=week.week_number - 1)
                    
                    # Target Date = Target Monday + (DayOfWeek - 1) days
                    # slot['day'] is 1=Mon, 2=Tue...
                    target_date = target_monday + timedelta(days=slot['day'] - 1)
                    
                    date_text = target_date.strftime("%Y-%m-%d")
                    time_text = f"{slot['start']} - {slot['end']}"
                    
                    # Use section from timetable if available
                    if slot['section']:
                        grade_text = slot['section']
            
            # 2. Fallback: Try to populate Roll from School Settings if not already set via Timetable logic
            # (We do this even if timetable logic ran, to get the roll count for that section)
            if school_settings and school_settings.streams_per_grade:
                # Try to find stream info for this grade (or specific section if we found one)
                target_grade_key = grade_text # e.g. "Grade 9 Blue" or "Grade 9"
                
                # Helper to find streams for a grade key
                def find_streams(key_to_search):
                    # Direct match
                    if key_to_search in school_settings.streams_per_grade:
                        return school_settings.streams_per_grade[key_to_search]
                    # Partial match (e.g. "Grade 9" matches "Grade 9")
                    for k, v in school_settings.streams_per_grade.items():
                        if key_to_search.startswith(k) or k.startswith(key_to_search):
                            return v
                    return None

                streams = find_streams(target_grade_key)
                
                if streams and isinstance(streams, list):
                    # If we have a specific section (e.g. "Grade 9 Blue"), try to match it
                    found_stream = None
                    if " " in target_grade_key: # heuristic for "Grade 9 Blue"
                        stream_name_part = target_grade_key.split(" ")[-1] # "Blue"
                        for s in streams:
                            if s.get('name') == stream_name_part:
                                found_stream = s
                                break
                    
                    # If we found a specific stream, use it
                    if found_stream:
                        pupils = found_stream.get('pupils', 0)
                        if pupils > 0:
                            roll_text = f" / {pupils}"
                    
                    # If we didn't find a specific stream, but there's only 1 stream total, use it
                    elif len(streams) == 1:
                        stream = streams[0]
                        pupils = stream.get('pupils', 0)
                        if pupils > 0:
                            roll_text = f" / {pupils}"
            
            # Create lesson plan from scheme lesson
            lesson_plan = LessonPlan(
                user_id=current_user.id,
                subject_id=scheme.subject_id,
                scheme_lesson_id=lesson.id,
                
                # Header Information
                learning_area=scheme.subject,
                grade=grade_text,
                date=date_text,  # Auto-populated from timetable
                time=time_text,  # Auto-populated from timetable
                roll=roll_text,  # Auto-populated from settings
                
                # Lesson Details from scheme
                strand_theme_topic=lesson.strand,
                sub_strand_sub_theme_sub_topic=lesson.sub_strand,
                specific_learning_outcomes=lesson.specific_learning_outcomes,
                key_inquiry_questions=lesson.key_inquiry_questions or "",
                core_competences=core_competencies_text,
                values_to_be_developed=values_text,
                pcis_to_be_addressed=pcis_text,
                learning_resources=lesson.learning_resources or "",
                
                # Organization of Learning - populate from learning experiences
                introduction=f"Introduce the topic: {lesson.strand} - {lesson.sub_strand}",
                development=lesson.learning_experiences or "Detailed lesson development activities to be planned",
                conclusion="Summarize key points and assess learning outcomes",
                summary=f"Lesson {lesson_counter}: {lesson.strand} - {lesson.sub_strand}",
                
                # Reflection (empty - to be filled after teaching)
                reflection_self_evaluation="",
                
                # Status
                status="pending"
            )
            
            db.add(lesson_plan)
            created_plans.append({
                "lesson_number": lesson_counter,
                "week": week.week_number,
                "lesson_in_week": lesson.lesson_number,
                "strand": lesson.strand,
                "sub_strand": lesson.sub_strand
            })
            lesson_counter += 1
    
    db.commit()
    
    return {
        "message": f"Successfully generated {len(created_plans)} lesson plans from scheme of work",
        "scheme_id": scheme_id,
        "scheme_title": f"{scheme.subject} - {scheme.grade} - {scheme.term} {scheme.year}",
        "total_plans": len(created_plans),
        "lesson_plans": created_plans
    }

# ============================================================================
# RECORD OF WORK ENDPOINTS
# ============================================================================

@app.get(f"{settings.API_V1_PREFIX}/records-of-work", response_model=List[RecordOfWorkSummary])
async def get_records_of_work(
    archived: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all records of work for the current user"""
    records = db.query(RecordOfWork).filter(
        RecordOfWork.user_id == current_user.id,
        RecordOfWork.is_archived == archived
    ).order_by(RecordOfWork.created_at.desc()).all()
    return records

@app.get(f"{settings.API_V1_PREFIX}/records-of-work/{{record_id}}", response_model=RecordOfWorkResponse)
async def get_record_of_work(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific record of work by ID"""
    record = db.query(RecordOfWork).options(
        joinedload(RecordOfWork.entries)
    ).filter(
        RecordOfWork.id == record_id,
        RecordOfWork.user_id == current_user.id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record of work not found")
    return record

@app.post(f"{settings.API_V1_PREFIX}/records-of-work", response_model=RecordOfWorkResponse, status_code=201)
async def create_record_of_work(
    data: RecordOfWorkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new record of work"""
    # Get school context for the user
    school_context = get_user_school_context(current_user.id, db)
    
    # Use provided school_name or fallback to school context
    school_name = data.school_name or school_context.get("school_name", "")
    teacher_name = data.teacher_name or current_user.name
    
    record = RecordOfWork(
        user_id=current_user.id,
        subject_id=data.subject_id,
        school_name=school_name,
        teacher_name=teacher_name,
        learning_area=data.learning_area,
        grade=data.grade,
        term=data.term,
        year=data.year
    )
    db.add(record)
    db.flush()
    
    # Add entries if provided
    for entry_data in data.entries:
        entry = RecordOfWorkEntry(
            record_id=record.id,
            week_number=entry_data.week_number,
            strand=entry_data.strand,
            topic=entry_data.topic,
            learning_outcome_a=entry_data.learning_outcome_a,
            learning_outcome_b=entry_data.learning_outcome_b,
            learning_outcome_c=entry_data.learning_outcome_c,
            learning_outcome_d=entry_data.learning_outcome_d,
            reflection=entry_data.reflection,
            signature=entry_data.signature
        )
        db.add(entry)
    
    db.commit()
    db.refresh(record)
    return record

@app.post(f"{settings.API_V1_PREFIX}/records-of-work/create-from-scheme/{{scheme_id}}", response_model=RecordOfWorkResponse)
async def create_record_of_work_from_scheme(
    scheme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a record of work from an existing scheme of work"""
    # Get the scheme
    scheme = db.query(SchemeOfWork).options(
        joinedload(SchemeOfWork.weeks).joinedload(SchemeWeek.lessons)
    ).filter(
        SchemeOfWork.id == scheme_id,
        SchemeOfWork.user_id == current_user.id
    ).first()
    
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme of work not found")
    
    # Get school context for the user
    school_context = get_user_school_context(current_user.id, db)
    
    # Create the record of work
    record = RecordOfWork(
        user_id=current_user.id,
        subject_id=scheme.subject_id,
        school_name=scheme.school or school_context.get("school_name", ""),
        teacher_name=scheme.teacher_name or current_user.name,
        learning_area=scheme.subject,
        grade=scheme.grade,
        term=scheme.term,
        year=scheme.year
    )
    db.add(record)
    db.flush()
    
    # Create entries from scheme weeks/lessons
    for week in scheme.weeks:
        # Group lessons by strand for each week
        strands = {}
        for lesson in week.lessons:
            strand = lesson.strand or "General"
            if strand not in strands:
                strands[strand] = {
                    "topics": [],
                    "outcomes": []
                }
            if lesson.sub_strand:
                strands[strand]["topics"].append(lesson.sub_strand)
            if lesson.specific_learning_outcomes:
                strands[strand]["outcomes"].append(lesson.specific_learning_outcomes)
        
        # Create an entry for each strand in the week
        for strand, data in strands.items():
            entry = RecordOfWorkEntry(
                record_id=record.id,
                week_number=week.week_number,
                strand=strand,
                topic="; ".join(data["topics"][:2]) if data["topics"] else None,
                learning_outcome_a=data["outcomes"][0] if len(data["outcomes"]) > 0 else None,
                learning_outcome_b=data["outcomes"][1] if len(data["outcomes"]) > 1 else None,
                learning_outcome_c=data["outcomes"][2] if len(data["outcomes"]) > 2 else None,
                learning_outcome_d=data["outcomes"][3] if len(data["outcomes"]) > 3 else None
            )
            db.add(entry)
    
    db.commit()
    db.refresh(record)
    return record

@app.put(f"{settings.API_V1_PREFIX}/records-of-work/{{record_id}}", response_model=RecordOfWorkResponse)
async def update_record_of_work(
    record_id: int,
    data: RecordOfWorkUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a record of work"""
    record = db.query(RecordOfWork).filter(
        RecordOfWork.id == record_id,
        RecordOfWork.user_id == current_user.id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record of work not found")
    
    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)
    
    db.commit()
    db.refresh(record)
    return record

@app.delete(f"{settings.API_V1_PREFIX}/records-of-work/{{record_id}}")
async def delete_record_of_work(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a record of work"""
    record = db.query(RecordOfWork).filter(
        RecordOfWork.id == record_id,
        RecordOfWork.user_id == current_user.id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record of work not found")
    
    db.delete(record)
    db.commit()
    return {"message": "Record of work deleted successfully"}

@app.post(f"{settings.API_V1_PREFIX}/records-of-work/{{record_id}}/archive")
async def archive_record_of_work(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Archive a record of work"""
    record = db.query(RecordOfWork).filter(
        RecordOfWork.id == record_id,
        RecordOfWork.user_id == current_user.id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record of work not found")
    
    record.is_archived = True
    db.commit()
    return {"message": "Record of work archived successfully"}

@app.post(f"{settings.API_V1_PREFIX}/records-of-work/{{record_id}}/unarchive")
async def unarchive_record_of_work(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unarchive a record of work"""
    record = db.query(RecordOfWork).filter(
        RecordOfWork.id == record_id,
        RecordOfWork.user_id == current_user.id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record of work not found")
    
    record.is_archived = False
    db.commit()
    return {"message": "Record of work unarchived successfully"}

# Entry-level operations
@app.put(f"{settings.API_V1_PREFIX}/records-of-work/{{record_id}}/entries/{{entry_id}}", response_model=RecordOfWorkEntryResponse)
async def update_record_entry(
    record_id: int,
    entry_id: int,
    data: RecordOfWorkEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a specific entry in a record of work"""
    # Verify ownership of record
    record = db.query(RecordOfWork).filter(
        RecordOfWork.id == record_id,
        RecordOfWork.user_id == current_user.id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record of work not found")
    
    entry = db.query(RecordOfWorkEntry).filter(
        RecordOfWorkEntry.id == entry_id,
        RecordOfWorkEntry.record_id == record_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)
    
    db.commit()
    db.refresh(entry)
    return entry

@app.post(f"{settings.API_V1_PREFIX}/records-of-work/{{record_id}}/entries", response_model=RecordOfWorkEntryResponse, status_code=201)
async def add_record_entry(
    record_id: int,
    data: RecordOfWorkEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new entry to a record of work"""
    # Verify ownership of record
    record = db.query(RecordOfWork).filter(
        RecordOfWork.id == record_id,
        RecordOfWork.user_id == current_user.id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record of work not found")
    
    entry = RecordOfWorkEntry(
        record_id=record_id,
        week_number=data.week_number,
        strand=data.strand,
        topic=data.topic,
        learning_outcome_a=data.learning_outcome_a,
        learning_outcome_b=data.learning_outcome_b,
        learning_outcome_c=data.learning_outcome_c,
        learning_outcome_d=data.learning_outcome_d,
        reflection=data.reflection,
        signature=data.signature
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@app.delete(f"{settings.API_V1_PREFIX}/records-of-work/{{record_id}}/entries/{{entry_id}}")
async def delete_record_entry(
    record_id: int,
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific entry from a record of work"""
    # Verify ownership of record
    record = db.query(RecordOfWork).filter(
        RecordOfWork.id == record_id,
        RecordOfWork.user_id == current_user.id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record of work not found")
    
    entry = db.query(RecordOfWorkEntry).filter(
        RecordOfWorkEntry.id == entry_id,
        RecordOfWorkEntry.record_id == record_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    db.delete(entry)
    db.commit()
    return {"message": "Entry deleted successfully"}

# ============================================================================
# SHARING & COLLABORATION ENDPOINTS
# ============================================================================

@app.post(f"{settings.API_V1_PREFIX}/{{resource_type}}/{{resource_id}}/share")
def share_resource(
    resource_type: str,
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a shareable link for a resource"""
    if resource_type not in ['schemes', 'lesson-plans', 'records-of-work']:
        raise HTTPException(status_code=400, detail="Invalid resource type")
        
    model_map = {
        'schemes': SchemeOfWork,
        'lesson-plans': LessonPlan,
        'records-of-work': RecordOfWork
    }
    
    model = model_map[resource_type]
    resource = db.query(model).filter(model.id == resource_id, model.user_id == current_user.id).first()
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    if not resource.share_token:
        resource.share_token = secrets.token_urlsafe(16)
        
    resource.is_public = True
    db.commit()
    
    return {
        "share_token": resource.share_token,
        "share_url": f"{settings.FRONTEND_URL}/shared/{resource.share_token}",
        "is_public": True
    }

@app.post(f"{settings.API_V1_PREFIX}/{{resource_type}}/{{resource_id}}/unshare")
def unshare_resource(
    resource_type: str,
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke public access to a resource"""
    if resource_type not in ['schemes', 'lesson-plans', 'records-of-work']:
        raise HTTPException(status_code=400, detail="Invalid resource type")
        
    model_map = {
        'schemes': SchemeOfWork,
        'lesson-plans': LessonPlan,
        'records-of-work': RecordOfWork
    }
    
    model = model_map[resource_type]
    resource = db.query(model).filter(model.id == resource_id, model.user_id == current_user.id).first()
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    resource.is_public = False
    db.commit()
    
    return {"message": "Resource unshared successfully", "is_public": False}

@app.get(f"{settings.API_V1_PREFIX}/shared/{{resource_type}}/{{token}}")
def get_shared_resource(
    resource_type: str,
    token: str,
    db: Session = Depends(get_db)
):
    """Get a shared resource by token (Public Access)"""
    if resource_type not in ['schemes', 'lesson-plans', 'records-of-work']:
        raise HTTPException(status_code=400, detail="Invalid resource type")
        
    model_map = {
        'schemes': SchemeOfWork,
        'lesson-plans': LessonPlan,
        'records-of-work': RecordOfWork
    }
    
    model = model_map[resource_type]
    resource = db.query(model).filter(model.share_token == token, model.is_public == True).first()
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found or not public")
        
    # For schemes, we need to load weeks and lessons
    if resource_type == 'schemes':
        # Eager load logic here if needed, or rely on lazy loading if session is open
        # But for public access, we might want to return a specific schema
        pass
        
    return resource

# ============================================================================
# NOTES & STATUS ENDPOINTS
# ============================================================================

from pydantic import BaseModel

class ResourceUpdate(BaseModel):
    notes: Optional[str] = None
    status: Optional[str] = None

@app.patch(f"{settings.API_V1_PREFIX}/{{resource_type}}/{{resource_id}}/update-meta")
def update_resource_meta(
    resource_type: str,
    resource_id: int,
    data: ResourceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update notes and status for a resource"""
    if resource_type not in ['schemes', 'lesson-plans', 'records-of-work']:
        raise HTTPException(status_code=400, detail="Invalid resource type")
        
    model_map = {
        'schemes': SchemeOfWork,
        'lesson-plans': LessonPlan,
        'records-of-work': RecordOfWork
    }
    
    model = model_map[resource_type]
    resource = db.query(model).filter(model.id == resource_id, model.user_id == current_user.id).first()
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    if data.notes is not None:
        resource.notes = data.notes
    if data.status is not None:
        # Validate status if needed
        resource.status = data.status
        
    db.commit()
    db.refresh(resource)
    return resource

# ============================================================================
# TEMPLATE / DUPLICATE ENDPOINTS
# ============================================================================

@app.post(f"{settings.API_V1_PREFIX}/{{resource_type}}/{{resource_id}}/duplicate")
def duplicate_resource(
    resource_type: str,
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Duplicate a resource (Save as Template)"""
    if resource_type not in ['schemes', 'lesson-plans']:
        raise HTTPException(status_code=400, detail="Duplication only supported for schemes and lesson plans")
        
    if resource_type == 'schemes':
        original = db.query(SchemeOfWork).filter(SchemeOfWork.id == resource_id, SchemeOfWork.user_id == current_user.id).first()
        if not original:
            raise HTTPException(status_code=404, detail="Scheme not found")
            
        # Create copy
        new_scheme = SchemeOfWork(
            user_id=current_user.id,
            subject_id=original.subject_id,
            teacher_name=original.teacher_name,
            school=original.school,
            term=original.term,
            year=original.year,
            subject=f"{original.subject} (Copy)",
            grade=original.grade,
            total_weeks=original.total_weeks,
            total_lessons=original.total_lessons,
            status='draft',
            notes=original.notes
        )
        db.add(new_scheme)
        db.flush()
        
        # Copy weeks and lessons
        for week in original.weeks:
            new_week = SchemeWeek(scheme_id=new_scheme.id, week_number=week.week_number)
            db.add(new_week)
            db.flush()
            for idx, lesson_payload in enumerate(week.lessons):
                lesson = SchemeLesson(
                    week_id=new_week.id,
                    lesson_number=idx + 1,
                    strand=lesson_payload.strand,
                    sub_strand=lesson_payload.sub_strand,
                    specific_learning_outcomes=lesson_payload.specific_learning_outcomes,
                    key_inquiry_questions=lesson_payload.key_inquiry_questions,
                    learning_experiences=lesson_payload.learning_experiences,
                    learning_resources=lesson_payload.learning_resources,
                    textbook_name=lesson_payload.textbook_name,
                    textbook_teacher_guide_pages=lesson_payload.textbook_teacher_guide_pages,
                    textbook_learner_book_pages=lesson_payload.textbook_learner_book_pages,
                    assessment_methods=lesson_payload.assessment_methods,
                    reflection=""
                )
                db.add(lesson)
        
        db.commit()
        db.refresh(new_scheme)
        return new_scheme
        
    elif resource_type == 'lesson-plans':
        original = db.query(LessonPlan).filter(LessonPlan.id == resource_id, LessonPlan.user_id == current_user.id).first()
        if not original:
            raise HTTPException(status_code=404, detail="Lesson plan not found")
            
        new_plan = LessonPlan(
            user_id=current_user.id,
            subject_id=original.subject_id,
            scheme_lesson_id=original.scheme_lesson_id,
            learning_area=original.learning_area,
            grade=original.grade,
            date=None,
            time=None,
            roll=original.roll,
            strand_theme_topic=original.strand_theme_topic,
            sub_strand_sub_theme_sub_topic=original.sub_strand_sub_theme_sub_topic,
            specific_learning_outcomes=original.specific_learning_outcomes,
            key_inquiry_questions=original.key_inquiry_questions,
            core_competences=original.core_competences,
            values_to_be_developed=original.values_to_be_developed,
            pcis_to_be_addressed=original.pcis_to_be_addressed,
            learning_resources=original.learning_resources,
            introduction=original.introduction,
            development=original.development,
            conclusion=original.conclusion,
            summary=original.summary,
            reflection_self_evaluation="",
            status='pending',
            notes=original.notes
        )
        db.add(new_plan)
        db.commit()
        db.refresh(new_plan)
        return new_plan

@app.post(f"{settings.API_V1_PREFIX}/admin/users/{{user_id}}/impersonate", response_model=Token)
def impersonate_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Impersonate a user (Admin only)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Create access token for the target user
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# ============================================================================
# SYSTEM ANNOUNCEMENTS ENDPOINTS
# ============================================================================

@app.get(f"{settings.API_V1_PREFIX}/announcements", response_model=List[SystemAnnouncementResponse])
def get_active_announcements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all active announcements for users"""
    now = datetime.utcnow()
    announcements = db.query(SystemAnnouncement).filter(
        SystemAnnouncement.is_active == True,
        (SystemAnnouncement.expires_at == None) | (SystemAnnouncement.expires_at > now)
    ).order_by(SystemAnnouncement.created_at.desc()).all()
    
    return announcements

@app.get(f"{settings.API_V1_PREFIX}/admin/announcements", response_model=List[SystemAnnouncementResponse])
def get_all_announcements(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all announcements (Admin only)"""
    announcements = db.query(SystemAnnouncement).order_by(SystemAnnouncement.created_at.desc()).all()
    return announcements

@app.post(f"{settings.API_V1_PREFIX}/admin/announcements", response_model=SystemAnnouncementResponse)
def create_announcement(
    announcement: SystemAnnouncementCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new announcement (Admin only)"""
    new_announcement = SystemAnnouncement(
        **announcement.dict(),
        created_by=current_user.id
    )
    db.add(new_announcement)
    db.commit()
    db.refresh(new_announcement)
    return new_announcement

@app.delete(f"{settings.API_V1_PREFIX}/admin/announcements/{{announcement_id}}")
def delete_announcement(
    announcement_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete an announcement (Admin only)"""
    announcement = db.query(SystemAnnouncement).filter(SystemAnnouncement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    db.delete(announcement)
    db.commit()
    return {"message": "Announcement deleted successfully"}

@app.patch(f"{settings.API_V1_PREFIX}/admin/announcements/{{announcement_id}}/toggle")
def toggle_announcement_status(
    announcement_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Toggle active status of an announcement (Admin only)"""
    announcement = db.query(SystemAnnouncement).filter(SystemAnnouncement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    announcement.is_active = not announcement.is_active
    db.commit()
    db.refresh(announcement)
    return announcement

# ============================================================================
# FILE DOWNLOAD ENDPOINT
# ============================================================================

@app.get(f"{settings.API_V1_PREFIX}/notes/{{note_id}}/download")
async def download_note_file(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stream file download from Cloudinary with correct file type and name."""
    import httpx
    
    # Get note and verify ownership
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    
    if not note or not note.file_url:
        raise HTTPException(status_code=404, detail="Note or file not found")
    
    # DEBUG: Log what we're working with
    print(f"\n{'='*80}")
    print(f"DOWNLOAD REQUEST - Note ID: {note_id}")
    print(f"  Title: {note.title}")
    print(f"  Stored file_type: '{note.file_type}'")
    print(f"  Cloudinary URL: {note.file_url}")
    print(f"{'='*80}\n")
    
    # Extract public_id from URL and generate authenticated download URL
    try:
        print(f"Extracting public_id from URL...")
        public_id = cloudinary_storage.extract_public_id_from_url(note.file_url)
        
        if not public_id:
            print(f"ERROR: Could not extract public_id from URL")
            raise HTTPException(
                status_code=500,
                detail="Invalid file URL format"
            )
        
        print(f"  Public ID: {public_id}")
        
        # Determine resource type based on file extension
        resource_type = "raw" if note.file_type in ['pdf', 'docx', 'pptx', 'xlsx'] else "image"
        print(f"  Resource Type: {resource_type}")
        
        # Generate a fresh authenticated URL using Cloudinary SDK
        import cloudinary.utils
        
        # For raw files, we need to use the 'raw' resource type and specify delivery type
        if resource_type == "raw":
            # Build URL with authentication - Cloudinary handles signing automatically
            download_url = cloudinary.utils.cloudinary_url(
                public_id,
                resource_type="raw",
                secure=True,
                sign_url=True,  # Important: Sign the URL
                type="upload"
            )[0]
        else:
            # For images/videos, use standard URL
            download_url = cloudinary.utils.cloudinary_url(
                public_id,
                resource_type=resource_type,
                secure=True,
                sign_url=True
            )[0]
        
        print(f"  Generated authenticated URL: {download_url[:80]}...")
        
        # Fetch file from Cloudinary with the authenticated URL
        async with httpx.AsyncClient(timeout=60.0) as client:
            print(f"Fetching file from Cloudinary...")
            response = await client.get(download_url)
            
            if response.status_code != 200:
                print(f"ERROR: Cloudinary returned status {response.status_code}")
                print(f"  Response: {response.text[:200]}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to fetch file from storage (status: {response.status_code})"
                )
            
            # Log what Cloudinary returned
            cloudinary_content_type = response.headers.get('content-type', 'unknown')
            print(f"Cloudinary Response:")
            print(f"  Content-Type: {cloudinary_content_type}")
            print(f"  Content-Length: {len(response.content)} bytes")
            
    except httpx.TimeoutException as e:
        print(f"ERROR: Timeout fetching file from Cloudinary: {str(e)}")
        raise HTTPException(
            status_code=504,
            detail="Timeout fetching file from cloud storage"
        )
    except httpx.HTTPError as e:
        print(f"ERROR: HTTP error fetching file: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch file: {str(e)}"
        )
    except Exception as e:
        print(f"ERROR: Unexpected error fetching file: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )
    
    # Clean filename and ensure it has the correct extension
    # Use the stored file_type to ensure correct extension
    filename = note.title.strip()
    file_ext = note.file_type.lower().strip() if note.file_type else ''
    
    # Remove any existing extension from title
    if '.' in filename:
        name_parts = filename.rsplit('.', 1)
        filename = name_parts[0]
    
    # Add the correct extension from database
    if file_ext:
        filename = f"{filename}.{file_ext}"
    else:
        # Fallback: try to get extension from URL
        print(f"WARNING: No file_type in database, trying to extract from URL")
        url_parts = note.file_url.split('.')
        if len(url_parts) > 1:
            file_ext = url_parts[-1].lower()
            filename = f"{filename}.{file_ext}"
    
    # Comprehensive MIME type mapping based on stored file_type
    mime_type_map = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'mp4': 'video/mp4',
            'mov': 'video/quicktime',
            'avi': 'video/x-msvideo',
            'mkv': 'video/x-matroska',
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'txt': 'text/plain',
            'csv': 'text/csv',
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed',
    }
    
    # Use the file type from database, not from Cloudinary response
    media_type = mime_type_map.get(file_ext, 'application/octet-stream')
    
    print(f"\nDownload Response:")
    print(f"  Filename: {filename}")
    print(f"  Extension: {file_ext}")
    print(f"  MIME Type: {media_type}")
    print(f"{'='*80}\n")
    
    # Return streaming response with proper headers
    # CRITICAL: Use the stored file_type to ensure correct download
    return StreamingResponse(
        iter([response.content]),
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": media_type,
            "Content-Length": str(len(response.content)),
            "Cache-Control": "no-cache"
        }
    )


# ============================================================================
# TIMETABLE MANAGEMENT ENDPOINTS
# ============================================================================

@app.post(f"{settings.API_V1_PREFIX}/timetable/schedules", response_model=SchoolScheduleResponse)
async def create_school_schedule(
    schedule: SchoolScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new school schedule configuration and auto-generate time slots"""
    
    # Check if user already has an active schedule for this level
    query = db.query(SchoolSchedule).filter(
        SchoolSchedule.user_id == current_user.id,
        SchoolSchedule.is_active == True
    )
    
    if schedule.education_level:
        query = query.filter(SchoolSchedule.education_level == schedule.education_level)
    else:
        # If no level specified, check if any schedule exists without level (legacy)
        # or just check if ANY active schedule exists if we want to enforce one per user when no level
        pass 
        
    existing = query.first()
    
    if existing:
        level_msg = f" for {schedule.education_level}" if schedule.education_level else ""
        raise HTTPException(
            status_code=400,
            detail=f"You already have an active schedule{level_msg}. Deactivate it first or update it."
        )
    
    # Create schedule
    db_schedule = SchoolSchedule(
        user_id=current_user.id,
        **schedule.dict()
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    
    # Auto-generate time slots
    generate_time_slots(db_schedule, db)
    
    return db_schedule


def generate_time_slots(schedule: SchoolSchedule, db: Session):
    """Generate time slots based on schedule configuration"""
    from datetime import datetime, timedelta
    
    # Parse times
    def parse_time(time_str: str) -> datetime:
        return datetime.strptime(time_str, "%H:%M")
    
    current_time = parse_time(schedule.school_start_time)
    slot_number = 1
    sequence = 1
    
    # Session 1 (Before first break)
    for i in range(schedule.lessons_before_first_break):
        duration = schedule.single_lesson_duration if i % 2 == 0 else schedule.double_lesson_duration
        
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=slot_number,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=duration)).strftime("%H:%M"),
            slot_type="lesson",
            label=f"Lesson {slot_number}",
            sequence_order=sequence
        )
        db.add(time_slot)
        
        current_time += timedelta(minutes=duration)
        slot_number += 1
        sequence += 1
    
    # First Break
    if schedule.first_break_duration > 0:
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=0,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=schedule.first_break_duration)).strftime("%H:%M"),
            slot_type="break",
            label="First Break",
            sequence_order=sequence
        )
        db.add(time_slot)
        current_time += timedelta(minutes=schedule.first_break_duration)
        sequence += 1
    
    # Session 2 (Before second break)
    for i in range(schedule.lessons_before_second_break):
        duration = schedule.single_lesson_duration
        
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=slot_number,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=duration)).strftime("%H:%M"),
            slot_type="lesson",
            label=f"Lesson {slot_number}",
            sequence_order=sequence
        )
        db.add(time_slot)
        
        current_time += timedelta(minutes=duration)
        slot_number += 1
        sequence += 1
    
    # Second Break (Tea Break)
    if schedule.second_break_duration > 0:
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=0,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=schedule.second_break_duration)).strftime("%H:%M"),
            slot_type="break",
            label="Second Break",
            sequence_order=sequence
        )
        db.add(time_slot)
        current_time += timedelta(minutes=schedule.second_break_duration)
        sequence += 1
    
    # Session 3 (Before lunch)
    for i in range(schedule.lessons_before_lunch):
        duration = schedule.single_lesson_duration
        
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=slot_number,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=duration)).strftime("%H:%M"),
            slot_type="lesson",
            label=f"Lesson {slot_number}",
            sequence_order=sequence
        )
        db.add(time_slot)
        
        current_time += timedelta(minutes=duration)
        slot_number += 1
        sequence += 1
    
    # Lunch Break
    if schedule.lunch_break_duration > 0:
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=0,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=schedule.lunch_break_duration)).strftime("%H:%M"),
            slot_type="lunch",
            label="Lunch Break",
            sequence_order=sequence
        )
        db.add(time_slot)
        current_time += timedelta(minutes=schedule.lunch_break_duration)
        sequence += 1
    
    # Session 4 (After lunch)
    for i in range(schedule.lessons_after_lunch):
        duration = schedule.single_lesson_duration
        
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=slot_number,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=duration)).strftime("%H:%M"),
            slot_type="lesson",
            label=f"Lesson {slot_number}",
            sequence_order=sequence
        )
        db.add(time_slot)
        
        current_time += timedelta(minutes=duration)
        slot_number += 1
        sequence += 1
    
    db.commit()


@app.get(f"{settings.API_V1_PREFIX}/timetable/schedules", response_model=List[SchoolScheduleResponse])
async def get_school_schedules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all school schedules for current user"""
    schedules = db.query(SchoolSchedule).filter(
        SchoolSchedule.user_id == current_user.id
    ).order_by(SchoolSchedule.is_active.desc(), SchoolSchedule.created_at.desc()).all()
    
    return schedules


@app.get(f"{settings.API_V1_PREFIX}/timetable/schedules/active", response_model=SchoolScheduleResponse)
async def get_active_schedule(
    education_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the active schedule, falling back to a generic one when needed."""
    schedule = get_active_schedule_or_fallback(db, current_user, education_level)
    if not schedule:
        detail = f"No active schedule found for {education_level}" if education_level else "No active schedule found"
        raise HTTPException(status_code=404, detail=f"{detail}. Please create one.")

    return schedule


@app.put(f"{settings.API_V1_PREFIX}/timetable/schedules/{{schedule_id}}", response_model=SchoolScheduleResponse)
async def update_school_schedule(
    schedule_id: int,
    schedule_update: SchoolScheduleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a school schedule and regenerate time slots"""
    schedule = db.query(SchoolSchedule).filter(
        SchoolSchedule.id == schedule_id,
        SchoolSchedule.user_id == current_user.id
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Update fields
    update_data = schedule_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(schedule, key, value)
    
    db.commit()
    db.refresh(schedule)
    
    # Regenerate time slots if timing changed
    if any(key in update_data for key in ['school_start_time', 'single_lesson_duration', 
                                            'double_lesson_duration', 'lessons_before_first_break',
                                            'lessons_before_second_break', 'lessons_before_lunch',
                                            'lessons_after_lunch', 'first_break_duration',
                                            'second_break_duration', 'lunch_break_duration']):
        # Get existing time slots to preserve lesson mappings
        existing_slots = db.query(TimeSlot).filter(
            TimeSlot.schedule_id == schedule_id
        ).order_by(TimeSlot.sequence_order).all()
        
        # Get existing entries to remap later
        existing_entries = db.query(TimetableEntry).filter(
            TimetableEntry.schedule_id == schedule_id
        ).all()
        
        # Create mapping of old slot details (sequence_order, slot_type) to entry details
        entry_mappings = {}
        for entry in existing_entries:
            old_slot = next((s for s in existing_slots if s.id == entry.time_slot_id), None)
            if old_slot:
                # Map by sequence order and slot type to preserve lesson positions
                key = (old_slot.sequence_order, old_slot.slot_type)
                if key not in entry_mappings:
                    entry_mappings[key] = []
                entry_mappings[key].append({
                    'subject_id': entry.subject_id,
                    'day_of_week': entry.day_of_week,
                    'room_number': entry.room_number,
                    'grade_section': entry.grade_section,
                    'notes': entry.notes,
                    'is_double_lesson': entry.is_double_lesson,
                    'strand_id': entry.strand_id,
                    'substrand_id': entry.substrand_id,
                    'lesson_id': entry.lesson_id
                })
        
        # Delete old entries and slots
        db.query(TimetableEntry).filter(TimetableEntry.schedule_id == schedule_id).delete()
        db.query(TimeSlot).filter(TimeSlot.schedule_id == schedule_id).delete()
        db.commit()
        
        # Generate new time slots
        generate_time_slots(schedule, db)
        
        # Get newly created time slots
        new_slots = db.query(TimeSlot).filter(
            TimeSlot.schedule_id == schedule_id
        ).order_by(TimeSlot.sequence_order).all()
        
        # Recreate entries with new time slot IDs
        for new_slot in new_slots:
            key = (new_slot.sequence_order, new_slot.slot_type)
            if key in entry_mappings:
                for entry_data in entry_mappings[key]:
                    new_entry = TimetableEntry(
                        user_id=current_user.id,
                        schedule_id=schedule_id,
                        time_slot_id=new_slot.id,
                        **entry_data
                    )
                    db.add(new_entry)
        
        db.commit()
    
    return schedule


@app.delete(f"{settings.API_V1_PREFIX}/timetable/schedules/{{schedule_id}}")
async def delete_school_schedule(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a school schedule (soft delete by deactivating)"""
    schedule = db.query(SchoolSchedule).filter(
        SchoolSchedule.id == schedule_id,
        SchoolSchedule.user_id == current_user.id
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Soft delete
    schedule.is_active = False
    db.commit()
    
    return {"message": "Schedule deactivated successfully"}


@app.get(f"{settings.API_V1_PREFIX}/timetable/time-slots", response_model=List[TimeSlotResponse])
async def get_time_slots(
    education_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return time slots for the active (or fallback) schedule."""
    schedule = resolve_schedule_for_context(db, current_user, education_level)
    
    if not schedule:
        detail = (
            f"No active schedule found for {education_level}"
            if education_level else "No active schedule found"
        )
        raise HTTPException(
            status_code=404,
            detail=f"{detail}. Please create one."
        )
    
    time_slots = db.query(TimeSlot).filter(
        TimeSlot.schedule_id == schedule.id
    ).order_by(TimeSlot.sequence_order).all()
    
    return time_slots


@app.post(f"{settings.API_V1_PREFIX}/timetable/entries", response_model=TimetableEntryResponse)
async def create_timetable_entry(
    entry: TimetableEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new timetable entry (assign subject to time slot on specific day)"""
    
    # Verify time slot exists and belongs to a schedule owned by the user
    time_slot = db.query(TimeSlot).join(SchoolSchedule).filter(
        TimeSlot.id == entry.time_slot_id,
        SchoolSchedule.user_id == current_user.id
    ).first()
    
    if not time_slot:
        raise HTTPException(status_code=404, detail="Time slot not found or access denied")
        
    schedule = time_slot.schedule
    
    if time_slot.slot_type != "lesson":
        raise HTTPException(status_code=400, detail="Cannot assign subject to break/lunch slot")
    
    # Log what we received
    print(f"\n=== CREATE TIMETABLE ENTRY ===")
    print(f"Received subject_id: {entry.subject_id}")
    print(f"Time slot: {entry.time_slot_id}")
    print(f"Day: {entry.day_of_week}")
    
    # Try to find subject in user's subjects, or check if it's a curriculum template
    subject = db.query(Subject).filter(
        Subject.id == entry.subject_id,
        Subject.user_id == current_user.id
    ).first()
    
    print(f"Found in user's subjects: {subject.subject_name if subject else 'No'}")
    
    # If not found in user's subjects, check if it's a curriculum template
    if not subject:
        curriculum_template = db.query(CurriculumTemplate).filter(
            CurriculumTemplate.id == entry.subject_id,
            CurriculumTemplate.is_active == True
        ).first()
        
        if not curriculum_template:
            raise HTTPException(status_code=404, detail="Subject or curriculum template not found")
        
        print(f"Found curriculum template: {curriculum_template.subject} - {curriculum_template.grade}")
        
        # Check if user already has this subject with EXACT template match
        existing_subject = db.query(Subject).filter(
            Subject.user_id == current_user.id,
            Subject.template_id == curriculum_template.id
        ).first()
        
        print(f"Found existing subject from template: {existing_subject.subject_name if existing_subject else 'No'}")
        
        if existing_subject:
            # Use the existing subject
            subject = existing_subject
            entry.subject_id = subject.id
        else:
            # Create a new subject from the template for this user
            new_subject = Subject(
                user_id=current_user.id,
                template_id=curriculum_template.id,
                subject_name=curriculum_template.subject,
                grade=curriculum_template.grade,
                total_lessons=0,
                lessons_completed=0,
                progress_percentage=0.0
            )
            db.add(new_subject)
            db.flush()  # Get the ID without committing
            subject = new_subject
            entry.subject_id = subject.id
            print(f"Created new subject: {subject.subject_name} - {subject.grade} (ID: {subject.id})")
    
    # Time slot verification moved to start of function
    # Verify time slot exists and is a lesson slot
    # (Already verified above)
    
    # Check for duplicate entry (same user, time slot, and day)
    existing = db.query(TimetableEntry).filter(
        TimetableEntry.user_id == current_user.id,
        TimetableEntry.time_slot_id == entry.time_slot_id,
        TimetableEntry.day_of_week == entry.day_of_week
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="This time slot is already occupied on this day"
        )
    
    # Handle double lesson - need to occupy next slot
    if entry.is_double_lesson:
        # Find all lesson slots for this schedule, ordered by sequence
        all_lesson_slots = db.query(TimeSlot).filter(
            TimeSlot.schedule_id == schedule.id,
            TimeSlot.slot_type == "lesson"
        ).order_by(TimeSlot.sequence_order).all()
        
        # Find current slot's position
        current_slot_index = next((i for i, slot in enumerate(all_lesson_slots) if slot.id == entry.time_slot_id), None)
        
        if current_slot_index is None or current_slot_index >= len(all_lesson_slots) - 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot create double lesson: no consecutive slot available"
            )
        
        next_slot = all_lesson_slots[current_slot_index + 1]
        
        # Check if next slot is already occupied
        next_slot_occupied = db.query(TimetableEntry).filter(
            TimetableEntry.user_id == current_user.id,
            TimetableEntry.time_slot_id == next_slot.id,
            TimetableEntry.day_of_week == entry.day_of_week
        ).first()
        
        if next_slot_occupied:
            raise HTTPException(
                status_code=400,
                detail="Cannot create double lesson: next time slot is already occupied"
            )
        
        print(f"Creating double lesson: slot {entry.time_slot_id} + {next_slot.id}")
        
        # Create entry for FIRST slot
        db_entry = TimetableEntry(
            user_id=current_user.id,
            schedule_id=schedule.id,
            **entry.dict()
        )
        db.add(db_entry)
        db.flush()  # Get the ID
        
        # Create entry for SECOND slot (consecutive)
        db_entry_2 = TimetableEntry(
            user_id=current_user.id,
            schedule_id=schedule.id,
            subject_id=entry.subject_id,
            time_slot_id=next_slot.id,
            day_of_week=entry.day_of_week,
            room_number=entry.room_number,
            grade_section=entry.grade_section,
            notes=f"(Part 2 of double lesson)",
            is_double_lesson=True
        )
        db.add(db_entry_2)
        db.commit()
        db.refresh(db_entry)
        
        return db_entry
    else:
        # Single lesson - create only one entry
        db_entry = TimetableEntry(
            user_id=current_user.id,
            schedule_id=schedule.id,
            **entry.dict()
        )
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        
        return db_entry


@app.get(f"{settings.API_V1_PREFIX}/timetable/entries", response_model=List[TimetableEntryResponse])
async def get_timetable_entries(
    day_of_week: Optional[int] = None,
    education_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all timetable entries, optionally filtered by day or education level."""
    schedule = resolve_schedule_for_context(db, current_user, education_level, day_of_week)
    if not schedule:
        return []
    query = db.query(TimetableEntry).filter(
        TimetableEntry.user_id == current_user.id,
        TimetableEntry.schedule_id == schedule.id
    )
    if day_of_week:
        query = query.filter(TimetableEntry.day_of_week == day_of_week)
    entries = query.order_by(TimetableEntry.day_of_week, TimetableEntry.time_slot_id).all()
    return entries


@app.get(f"{settings.API_V1_PREFIX}/timetable/entries/today")
async def get_today_entries(
    education_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get today's timetable with curriculum content"""
    from datetime import datetime
    
    # Get current day (1=Monday, 5=Friday)
    today = datetime.now().isoweekday()
    
    if today > 5:  # Weekend
        return {
            "day": today,
            "day_name": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][today - 1],
            "is_weekend": True,
            "entries": []
        }
    
    schedule = resolve_schedule_for_context(db, current_user, education_level, today)
    if not schedule:
        detail = (
            f"No active schedule found for {education_level}"
            if education_level else "No active schedule found"
        )
        raise HTTPException(status_code=404, detail=f"{detail}. Please create one.")
    
    # Get today's entries with subject and curriculum info
    entries = db.query(
        TimetableEntry,
        TimeSlot,
        Subject,
        Lesson
    ).join(
        TimeSlot, TimetableEntry.time_slot_id == TimeSlot.id
    ).join(
        Subject, TimetableEntry.subject_id == Subject.id
    ).outerjoin(
        Lesson, TimetableEntry.lesson_id == Lesson.id
    ).filter(
        TimetableEntry.user_id == current_user.id,
        TimetableEntry.schedule_id == schedule.id,
        TimetableEntry.day_of_week == today
    ).order_by(TimeSlot.sequence_order).all()
    
    result = []
    for entry, slot, subject, lesson in entries:
        entry_data = {
            "id": entry.id,
            "time_slot": {
                "id": slot.id,
                "start_time": slot.start_time,
                "end_time": slot.end_time,
                "label": slot.label
            },
            "subject": {
                "id": subject.id,
                "subject_name": subject.subject_name,
                "grade": subject.grade
            },
            "room_number": entry.room_number,
            "grade_section": entry.grade_section,
            "notes": entry.notes,
            "is_double_lesson": entry.is_double_lesson
        }
        
        # Add curriculum content if linked
        if lesson:
            entry_data["lesson"] = {
                "id": lesson.id,
                "lesson_title": lesson.lesson_title,
                "learning_outcomes": lesson.learning_outcomes,
                "is_completed": lesson.is_completed
            }
        
        result.append(entry_data)
    
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    
    return {
        "day": today,
        "day_name": day_names[today - 1],
        "is_weekend": False,
        "entries": result
    }


@app.get(f"{settings.API_V1_PREFIX}/timetable/entries/next")
async def get_next_lesson(
    education_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the next upcoming lesson"""
    from datetime import datetime
    
    current_time = datetime.now()
    current_day = current_time.isoweekday()
    current_time_str = current_time.strftime("%H:%M")
    
    schedule = resolve_schedule_for_context(db, current_user, education_level)
    if not schedule:
        detail = (
            f"No active schedule found for {education_level}"
            if education_level else "No active schedule found"
        )
        return {
            "has_next_lesson": False,
            "message": f"{detail}. Please create one."
        }
    print(f"[get_next_lesson] Current time: {current_time_str}, Current day: {current_day}")
    
    # Find next lesson today or on following days (check up to 8 days to cover full week)
    for day_offset in range(8):
        check_day = ((current_day - 1 + day_offset) % 7) + 1  # Properly wrap 1-7 (1=Mon, 7=Sun)
        
        if check_day > 5:  # Skip weekends (6=Saturday, 7=Sunday)
            continue
        
        # Get entries for this day
        entries = db.query(
            TimetableEntry,
            TimeSlot,
            Subject,
            Lesson
        ).join(
            TimeSlot, TimetableEntry.time_slot_id == TimeSlot.id
        ).join(
            Subject, TimetableEntry.subject_id == Subject.id
        ).outerjoin(
            Lesson, TimetableEntry.lesson_id == Lesson.id
        ).filter(
            TimetableEntry.user_id == current_user.id,
            TimetableEntry.schedule_id == schedule.id,
            TimetableEntry.day_of_week == check_day,
            TimeSlot.slot_type == "lesson"
        ).order_by(TimeSlot.sequence_order).all()
        
        for entry, slot, subject, lesson in entries:
            # If checking today, only consider future time slots
            if day_offset == 0 and slot.start_time <= current_time_str:
                continue
            
            # Found next lesson!
            result = {
                "has_next_lesson": True,
                "is_today": day_offset == 0,
                "day_of_week": check_day,
                "day_name": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][check_day - 1],
                "time_slot": {
                    "id": slot.id,
                    "start_time": slot.start_time,
                    "end_time": slot.end_time,
                    "label": slot.label
                },
                "subject": {
                    "id": subject.id,
                    "subject_name": subject.subject_name,
                    "grade": subject.grade
                },
                "room_number": entry.room_number,
                "grade_section": entry.grade_section,
                "is_double_lesson": entry.is_double_lesson
            }
            
            if lesson:
                result["lesson"] = {
                    "id": lesson.id,
                    "lesson_title": lesson.lesson_title,
                    "learning_outcomes": lesson.learning_outcomes,
                    "is_completed": lesson.is_completed
                }
            
            return result
    
    return {
        "has_next_lesson": False,
        "message": "No upcoming lessons in the next week"
    }


@app.put(f"{settings.API_V1_PREFIX}/timetable/entries/{{entry_id}}", response_model=TimetableEntryResponse)
async def update_timetable_entry(
    entry_id: int,
    entry_update: TimetableEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a timetable entry"""
    entry = db.query(TimetableEntry).filter(
        TimetableEntry.id == entry_id,
        TimetableEntry.user_id == current_user.id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    
    # Update fields
    update_data = entry_update.dict(exclude_unset=True)
    
    # Validate subject if being updated
    if "subject_id" in update_data:
        subject = db.query(Subject).filter(
            Subject.id == update_data["subject_id"],
            Subject.user_id == current_user.id
        ).first()
        
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
    
    # Handle double lesson changes
    was_double = entry.is_double_lesson
    becoming_double = update_data.get("is_double_lesson", was_double)
    
    if becoming_double and not was_double:
        # Converting to double lesson - need to occupy next slot
        schedule = db.query(SchoolSchedule).filter(
            SchoolSchedule.user_id == current_user.id,
            SchoolSchedule.is_active == True
        ).first()
        
        all_lesson_slots = db.query(TimeSlot).filter(
            TimeSlot.schedule_id == schedule.id,
            TimeSlot.slot_type == "lesson"
        ).order_by(TimeSlot.sequence_order).all()
        
        current_slot_index = next((i for i, slot in enumerate(all_lesson_slots) if slot.id == entry.time_slot_id), None)
        
        if current_slot_index is None or current_slot_index >= len(all_lesson_slots) - 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot convert to double lesson: no consecutive slot available"
            )
        
        next_slot = all_lesson_slots[current_slot_index + 1]
        
        # Check if next slot is already occupied
        next_slot_occupied = db.query(TimetableEntry).filter(
            TimetableEntry.user_id == current_user.id,
            TimetableEntry.time_slot_id == next_slot.id,
            TimetableEntry.day_of_week == entry.day_of_week
        ).first()
        
        if next_slot_occupied:
            raise HTTPException(
                status_code=400,
                detail="Cannot convert to double lesson: next time slot is already occupied"
            )
        
        # Create second slot entry
        db_entry_2 = TimetableEntry(
            user_id=current_user.id,
            schedule_id=entry.schedule_id,
            subject_id=update_data.get("subject_id", entry.subject_id),
            time_slot_id=next_slot.id,
            day_of_week=entry.day_of_week,
            room_number=update_data.get("room_number", entry.room_number),
            grade_section=update_data.get("grade_section", entry.grade_section),
            notes=f"(Part 2 of double lesson)",
            is_double_lesson=True
        )
        db.add(db_entry_2)
    
    elif not becoming_double and was_double:
        # Converting from double to single - need to remove next slot entry
        schedule = db.query(SchoolSchedule).filter(
            SchoolSchedule.user_id == current_user.id,
            SchoolSchedule.is_active == True
        ).first()
        
        all_lesson_slots = db.query(TimeSlot).filter(
            TimeSlot.schedule_id == schedule.id,
            TimeSlot.slot_type == "lesson"
        ).order_by(TimeSlot.sequence_order).all()
        
        current_slot_index = next((i for i, slot in enumerate(all_lesson_slots) if slot.id == entry.time_slot_id), None)
        
        if current_slot_index is not None and current_slot_index < len(all_lesson_slots) - 1:
            next_slot = all_lesson_slots[current_slot_index + 1]
            
            # Find and delete the second part of double lesson
            second_entry = db.query(TimetableEntry).filter(
                TimetableEntry.user_id == current_user.id,
                TimetableEntry.time_slot_id == next_slot.id,
                TimetableEntry.day_of_week == entry.day_of_week,
                TimetableEntry.subject_id == entry.subject_id,
                TimetableEntry.is_double_lesson == True
            ).first()
            
            if second_entry:
                db.delete(second_entry)
    
    # Apply updates
    for key, value in update_data.items():
        setattr(entry, key, value)
    
    db.commit()
    db.refresh(entry)
    
    return entry


@app.delete(f"{settings.API_V1_PREFIX}/timetable/entries/{{entry_id}}")
async def delete_timetable_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a timetable entry (and its paired slot if it's a double lesson)"""
    entry = db.query(TimetableEntry).filter(
        TimetableEntry.id == entry_id,
        TimetableEntry.user_id == current_user.id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    
    # If this is a double lesson, delete the paired entry too
    if entry.is_double_lesson:
        schedule = db.query(SchoolSchedule).filter(
            SchoolSchedule.user_id == current_user.id,
            SchoolSchedule.is_active == True
        ).first()
        
        all_lesson_slots = db.query(TimeSlot).filter(
            TimeSlot.schedule_id == schedule.id,
            TimeSlot.slot_type == "lesson"
        ).order_by(TimeSlot.sequence_order).all()
        
        current_slot_index = next((i for i, slot in enumerate(all_lesson_slots) if slot.id == entry.time_slot_id), None)
        
        if current_slot_index is not None and current_slot_index < len(all_lesson_slots) - 1:
            next_slot = all_lesson_slots[current_slot_index + 1]
            
            # Find and delete the second part
            second_entry = db.query(TimetableEntry).filter(
                TimetableEntry.user_id == current_user.id,
                TimetableEntry.time_slot_id == next_slot.id,
                TimetableEntry.day_of_week == entry.day_of_week,
                TimetableEntry.subject_id == entry.subject_id,
                TimetableEntry.is_double_lesson == True
            ).first()
            
            if second_entry:
                db.delete(second_entry)
    
    db.delete(entry)
    db.commit()
    
    return {"message": "Timetable entry deleted successfully"}


@app.get(f"{settings.API_V1_PREFIX}/timetable/dashboard")
async def get_timetable_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive timetable dashboard data (today's lessons + next lesson)"""
    
    # Get today's schedule
    today_data = await get_today_entries(current_user, db)
    
    # Get next lesson
    next_lesson = await get_next_lesson(current_user, db)
    
    return {
        "today": today_data,
        "next_lesson": next_lesson
    }

# ============================================================================
# SYSTEM ANNOUNCEMENTS ENDPOINTS
# ============================================================================

@app.get(f"{settings.API_V1_PREFIX}/announcements", response_model=List[SystemAnnouncementResponse])
def get_active_announcements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all active announcements for users"""
    now = datetime.utcnow()
    announcements = db.query(SystemAnnouncement).filter(
        SystemAnnouncement.is_active == True,
        (SystemAnnouncement.expires_at == None) | (SystemAnnouncement.expires_at > now)
    ).order_by(SystemAnnouncement.created_at.desc()).all()
    
    return announcements

@app.get(f"{settings.API_V1_PREFIX}/admin/announcements", response_model=List[SystemAnnouncementResponse])
def get_all_announcements(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all announcements (Admin only)"""
    announcements = db.query(SystemAnnouncement).order_by(SystemAnnouncement.created_at.desc()).all()
    return announcements

@app.post(f"{settings.API_V1_PREFIX}/admin/announcements", response_model=SystemAnnouncementResponse)
def create_announcement(
    announcement: SystemAnnouncementCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new announcement (Admin only)"""
    new_announcement = SystemAnnouncement(
        **announcement.dict(),
        created_by=current_user.id
    )
    db.add(new_announcement)
    db.commit()
    db.refresh(new_announcement)
    return new_announcement

@app.delete(f"{settings.API_V1_PREFIX}/admin/announcements/{{announcement_id}}")
def delete_announcement(
    announcement_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete an announcement (Admin only)"""
    announcement = db.query(SystemAnnouncement).filter(SystemAnnouncement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    db.delete(announcement)
    db.commit()
    return {"message": "Announcement deleted successfully"}

@app.patch(f"{settings.API_V1_PREFIX}/admin/announcements/{{announcement_id}}/toggle")
def toggle_announcement_status(
    announcement_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Toggle active status of an announcement (Admin only)"""
    announcement = db.query(SystemAnnouncement).filter(SystemAnnouncement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    announcement.is_active = not announcement.is_active
    db.commit()
    db.refresh(announcement)
    return announcement

# ============================================================================
# FILE DOWNLOAD ENDPOINT
# ============================================================================

@app.get(f"{settings.API_V1_PREFIX}/notes/{{note_id}}/download")
async def download_note_file(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stream file download from Cloudinary with correct file type and name."""
    import httpx
    
    # Get note and verify ownership
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    
    if not note or not note.file_url:
        raise HTTPException(status_code=404, detail="Note or file not found")
    
    # DEBUG: Log what we're working with
    print(f"\n{'='*80}")
    print(f"DOWNLOAD REQUEST - Note ID: {note_id}")
    print(f"  Title: {note.title}")
    print(f"  Stored file_type: '{note.file_type}'")
    print(f"  Cloudinary URL: {note.file_url}")
    print(f"{'='*80}\n")
    
    # Extract public_id from URL and generate authenticated download URL
    try:
        print(f"Extracting public_id from URL...")
        public_id = cloudinary_storage.extract_public_id_from_url(note.file_url)
        
        if not public_id:
            print(f"ERROR: Could not extract public_id from URL")
            raise HTTPException(
                status_code=500,
                detail="Invalid file URL format"
            )
        
        print(f"  Public ID: {public_id}")
        
        # Determine resource type based on file extension
        resource_type = "raw" if note.file_type in ['pdf', 'docx', 'pptx', 'xlsx'] else "image"
        print(f"  Resource Type: {resource_type}")
        
        # Generate a fresh authenticated URL using Cloudinary SDK
        import cloudinary.utils
        
        # For raw files, we need to use the 'raw' resource type and specify delivery type
        if resource_type == "raw":
            # Build URL with authentication - Cloudinary handles signing automatically
            download_url = cloudinary.utils.cloudinary_url(
                public_id,
                resource_type="raw",
                secure=True,
                sign_url=True,  # Important: Sign the URL
                type="upload"
            )[0]
        else:
            # For images/videos, use standard URL
            download_url = cloudinary.utils.cloudinary_url(
                public_id,
                resource_type=resource_type,
                secure=True,
                sign_url=True
            )[0]
        
        print(f"  Generated authenticated URL: {download_url[:80]}...")
        
        # Fetch file from Cloudinary with the authenticated URL
        async with httpx.AsyncClient(timeout=60.0) as client:
            print(f"Fetching file from Cloudinary...")
            response = await client.get(download_url)
            
            if response.status_code != 200:
                print(f"ERROR: Cloudinary returned status {response.status_code}")
                print(f"  Response: {response.text[:200]}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to fetch file from storage (status: {response.status_code})"
                )
            
            # Log what Cloudinary returned
            cloudinary_content_type = response.headers.get('content-type', 'unknown')
            print(f"Cloudinary Response:")
            print(f"  Content-Type: {cloudinary_content_type}")
            print(f"  Content-Length: {len(response.content)} bytes")
            
    except httpx.TimeoutException as e:
        print(f"ERROR: Timeout fetching file from Cloudinary: {str(e)}")
        raise HTTPException(
            status_code=504,
            detail="Timeout fetching file from cloud storage"
        )
    except httpx.HTTPError as e:
        print(f"ERROR: HTTP error fetching file: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch file: {str(e)}"
        )
    except Exception as e:
        print(f"ERROR: Unexpected error fetching file: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )
    
    # Clean filename and ensure it has the correct extension
    # Use the stored file_type to ensure correct extension
    filename = note.title.strip()
    file_ext = note.file_type.lower().strip() if note.file_type else ''
    
    # Remove any existing extension from title
    if '.' in filename:
        name_parts = filename.rsplit('.', 1)
        filename = name_parts[0]
    
    # Add the correct extension from database
    if file_ext:
        filename = f"{filename}.{file_ext}"
    else:
        # Fallback: try to get extension from URL
        print(f"WARNING: No file_type in database, trying to extract from URL")
        url_parts = note.file_url.split('.')
        if len(url_parts) > 1:
            file_ext = url_parts[-1].lower()
            filename = f"{filename}.{file_ext}"
    
    # Comprehensive MIME type mapping based on stored file_type
    mime_type_map = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'mp4': 'video/mp4',
            'mov': 'video/quicktime',
            'avi': 'video/x-msvideo',
            'mkv': 'video/x-matroska',
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'txt': 'text/plain',
            'csv': 'text/csv',
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed',
    }
    
    # Use the file type from database, not from Cloudinary response
    media_type = mime_type_map.get(file_ext, 'application/octet-stream')
    
    print(f"\nDownload Response:")
    print(f"  Filename: {filename}")
    print(f"  Extension: {file_ext}")
    print(f"  MIME Type: {media_type}")
    print(f"{'='*80}\n")
    
    # Return streaming response with proper headers
    # CRITICAL: Use the stored file_type to ensure correct download
    return StreamingResponse(
        iter([response.content]),
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": media_type,
            "Content-Length": str(len(response.content)),
            "Cache-Control": "no-cache"
        }
    )


# ============================================================================
# TIMETABLE MANAGEMENT ENDPOINTS
# ============================================================================

@app.post(f"{settings.API_V1_PREFIX}/timetable/schedules", response_model=SchoolScheduleResponse)
async def create_school_schedule(
    schedule: SchoolScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new school schedule configuration and auto-generate time slots"""
    
    # Check if user already has an active schedule for this level
    query = db.query(SchoolSchedule).filter(
        SchoolSchedule.user_id == current_user.id,
        SchoolSchedule.is_active == True
    )
    
    if schedule.education_level:
        query = query.filter(SchoolSchedule.education_level == schedule.education_level)
    else:
        # If no level specified, check if any schedule exists without level (legacy)
        # or just check if ANY active schedule exists if we want to enforce one per user when no level
        pass 
        
    existing = query.first()
    
    if existing:
        level_msg = f" for {schedule.education_level}" if schedule.education_level else ""
        raise HTTPException(
            status_code=400,
            detail=f"You already have an active schedule{level_msg}. Deactivate it first or update it."
        )
    
    # Create schedule
    db_schedule = SchoolSchedule(
        user_id=current_user.id,
        **schedule.dict()
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    
    # Auto-generate time slots
    generate_time_slots(db_schedule, db)
    
    return db_schedule


def generate_time_slots(schedule: SchoolSchedule, db: Session):
    """Generate time slots based on schedule configuration"""
    from datetime import datetime, timedelta
    
    # Parse times
    def parse_time(time_str: str) -> datetime:
        return datetime.strptime(time_str, "%H:%M")
    
    current_time = parse_time(schedule.school_start_time)
    slot_number = 1
    sequence = 1
    
    # Session 1 (Before first break)
    for i in range(schedule.lessons_before_first_break):
        duration = schedule.single_lesson_duration if i % 2 == 0 else schedule.double_lesson_duration
        
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=slot_number,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=duration)).strftime("%H:%M"),
            slot_type="lesson",
            label=f"Lesson {slot_number}",
            sequence_order=sequence
        )
        db.add(time_slot)
        
        current_time += timedelta(minutes=duration)
        slot_number += 1
        sequence += 1
    
    # First Break
    if schedule.first_break_duration > 0:
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=0,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=schedule.first_break_duration)).strftime("%H:%M"),
            slot_type="break",
            label="First Break",
            sequence_order=sequence
        )
        db.add(time_slot)
        current_time += timedelta(minutes=schedule.first_break_duration)
        sequence += 1
    
    # Session 2 (Before second break)
    for i in range(schedule.lessons_before_second_break):
        duration = schedule.single_lesson_duration
        
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=slot_number,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=duration)).strftime("%H:%M"),
            slot_type="lesson",
            label=f"Lesson {slot_number}",
            sequence_order=sequence
        )
        db.add(time_slot)
        
        current_time += timedelta(minutes=duration)
        slot_number += 1
        sequence += 1
    
    # Second Break (Tea Break)
    if schedule.second_break_duration > 0:
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=0,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=schedule.second_break_duration)).strftime("%H:%M"),
            slot_type="break",
            label="Second Break",
            sequence_order=sequence
        )
        db.add(time_slot)
        current_time += timedelta(minutes=schedule.second_break_duration)
        sequence += 1
    
    # Session 3 (Before lunch)
    for i in range(schedule.lessons_before_lunch):
        duration = schedule.single_lesson_duration
        
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=slot_number,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=duration)).strftime("%H:%M"),
            slot_type="lesson",
            label=f"Lesson {slot_number}",
            sequence_order=sequence
        )
        db.add(time_slot)
        
        current_time += timedelta(minutes=duration)
        slot_number += 1
        sequence += 1
    
    # Lunch Break
    if schedule.lunch_break_duration > 0:
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=0,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=schedule.lunch_break_duration)).strftime("%H:%M"),
            slot_type="lunch",
            label="Lunch Break",
            sequence_order=sequence
        )
        db.add(time_slot)
        current_time += timedelta(minutes=schedule.lunch_break_duration)
        sequence += 1
    
    # Session 4 (After lunch)
    for i in range(schedule.lessons_after_lunch):
        duration = schedule.single_lesson_duration
        
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=slot_number,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=duration)).strftime("%H:%M"),
            slot_type="lesson",
            label=f"Lesson {slot_number}",
            sequence_order=sequence
        )
        db.add(time_slot)
        
        current_time += timedelta(minutes=duration)
        slot_number += 1
        sequence += 1
    
    db.commit()


@app.get(f"{settings.API_V1_PREFIX}/timetable/schedules", response_model=List[SchoolScheduleResponse])
async def get_school_schedules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all school schedules for current user"""
    schedules = db.query(SchoolSchedule).filter(
        SchoolSchedule.user_id == current_user.id
    ).order_by(SchoolSchedule.is_active.desc(), SchoolSchedule.created_at.desc()).all()
    
    return schedules


@app.get(f"{settings.API_V1_PREFIX}/timetable/schedules/active", response_model=SchoolScheduleResponse)
async def get_active_schedule(
    education_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the active schedule, falling back to a generic one when needed."""
    schedule = get_active_schedule_or_fallback(db, current_user, education_level)
    if not schedule:
        detail = f"No active schedule found for {education_level}" if education_level else "No active schedule found"
        raise HTTPException(status_code=404, detail=f"{detail}. Please create one.")

    return schedule


@app.put(f"{settings.API_V1_PREFIX}/timetable/schedules/{{schedule_id}}", response_model=SchoolScheduleResponse)
async def update_school_schedule(
    schedule_id: int,
    schedule_update: SchoolScheduleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a school schedule and regenerate time slots"""
    schedule = db.query(SchoolSchedule).filter(
        SchoolSchedule.id == schedule_id,
        SchoolSchedule.user_id == current_user.id
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Update fields
    update_data = schedule_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(schedule, key, value)
    
    db.commit()
    db.refresh(schedule)
    
    # Regenerate time slots if timing changed
    if any(key in update_data for key in ['school_start_time', 'single_lesson_duration', 
                                            'double_lesson_duration', 'lessons_before_first_break',
                                            'lessons_before_second_break', 'lessons_before_lunch',
                                            'lessons_after_lunch', 'first_break_duration',
                                            'second_break_duration', 'lunch_break_duration']):
        # Get existing time slots to preserve lesson mappings
        existing_slots = db.query(TimeSlot).filter(
            TimeSlot.schedule_id == schedule_id
        ).order_by(TimeSlot.sequence_order).all()
        
        # Get existing entries to remap later
        existing_entries = db.query(TimetableEntry).filter(
            TimetableEntry.schedule_id == schedule_id
        ).all()
        
        # Create mapping of old slot details (sequence_order, slot_type) to entry details
        entry_mappings = {}
        for entry in existing_entries:
            old_slot = next((s for s in existing_slots if s.id == entry.time_slot_id), None)
            if old_slot:
                # Map by sequence order and slot type to preserve lesson positions
                key = (old_slot.sequence_order, old_slot.slot_type)
                if key not in entry_mappings:
                    entry_mappings[key] = []
                entry_mappings[key].append({
                    'subject_id': entry.subject_id,
                    'day_of_week': entry.day_of_week,
                    'room_number': entry.room_number,
                    'grade_section': entry.grade_section,
                    'notes': entry.notes,
                    'is_double_lesson': entry.is_double_lesson,
                    'strand_id': entry.strand_id,
                    'substrand_id': entry.substrand_id,
                    'lesson_id': entry.lesson_id
                })
        
        # Delete old entries and slots
        db.query(TimetableEntry).filter(TimetableEntry.schedule_id == schedule_id).delete()
        db.query(TimeSlot).filter(TimeSlot.schedule_id == schedule_id).delete()
        db.commit()
        
        # Generate new time slots
        generate_time_slots(schedule, db)
        
        # Get newly created time slots
        new_slots = db.query(TimeSlot).filter(
            TimeSlot.schedule_id == schedule_id
        ).order_by(TimeSlot.sequence_order).all()
        
        # Recreate entries with new time slot IDs
        for new_slot in new_slots:
            key = (new_slot.sequence_order, new_slot.slot_type)
            if key in entry_mappings:
                for entry_data in entry_mappings[key]:
                    new_entry = TimetableEntry(
                        user_id=current_user.id,
                        schedule_id=schedule_id,
                        time_slot_id=new_slot.id,
                        **entry_data
                    )
                    db.add(new_entry)
        
        db.commit()
    
    return schedule


@app.delete(f"{settings.API_V1_PREFIX}/timetable/schedules/{{schedule_id}}")
async def delete_school_schedule(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a school schedule (soft delete by deactivating)"""
    schedule = db.query(SchoolSchedule).filter(
        SchoolSchedule.id == schedule_id,
        SchoolSchedule.user_id == current_user.id
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Soft delete
    schedule.is_active = False
    db.commit()
    
    return {"message": "Schedule deactivated successfully"}


@app.get(f"{settings.API_V1_PREFIX}/timetable/time-slots", response_model=List[TimeSlotResponse])
async def get_time_slots(
    education_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return time slots for the active (or fallback) schedule."""
    schedule = resolve_schedule_for_context(db, current_user, education_level)
    
    if not schedule:
        detail = (
            f"No active schedule found for {education_level}"
            if education_level else "No active schedule found"
        )
        raise HTTPException(
            status_code=404,
            detail=f"{detail}. Please create one."
        )
    
    time_slots = db.query(TimeSlot).filter(
        TimeSlot.schedule_id == schedule.id
    ).order_by(TimeSlot.sequence_order).all()
    
    return time_slots


@app.post(f"{settings.API_V1_PREFIX}/timetable/entries", response_model=TimetableEntryResponse)
async def create_timetable_entry(
    entry: TimetableEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new timetable entry (assign subject to time slot on specific day)"""
    
    # Verify time slot exists and belongs to a schedule owned by the user
    time_slot = db.query(TimeSlot).join(SchoolSchedule).filter(
        TimeSlot.id == entry.time_slot_id,
        SchoolSchedule.user_id == current_user.id
    ).first()
    
    if not time_slot:
        raise HTTPException(status_code=404, detail="Time slot not found or access denied")
        
    schedule = time_slot.schedule
    
    if time_slot.slot_type != "lesson":
        raise HTTPException(status_code=400, detail="Cannot assign subject to break/lunch slot")
    
    # Log what we received
    print(f"\n=== CREATE TIMETABLE ENTRY ===")
    print(f"Received subject_id: {entry.subject_id}")
    print(f"Time slot: {entry.time_slot_id}")
    print(f"Day: {entry.day_of_week}")
    
    # Try to find subject in user's subjects, or check if it's a curriculum template
    subject = db.query(Subject).filter(
        Subject.id == entry.subject_id,
        Subject.user_id == current_user.id
    ).first()
    
    print(f"Found in user's subjects: {subject.subject_name if subject else 'No'}")
    
    # If not found in user's subjects, check if it's a curriculum template
    if not subject:
        curriculum_template = db.query(CurriculumTemplate).filter(
            CurriculumTemplate.id == entry.subject_id,
            CurriculumTemplate.is_active == True
        ).first()
        
        if not curriculum_template:
            raise HTTPException(status_code=404, detail="Subject or curriculum template not found")
        
        print(f"Found curriculum template: {curriculum_template.subject} - {curriculum_template.grade}")
        
        # Check if user already has this subject with EXACT template match
        existing_subject = db.query(Subject).filter(
            Subject.user_id == current_user.id,
            Subject.template_id == curriculum_template.id
        ).first()
        
        print(f"Found existing subject from template: {existing_subject.subject_name if existing_subject else 'No'}")
        
        if existing_subject:
            # Use the existing subject
            subject = existing_subject
            entry.subject_id = subject.id
        else:
            # SaaS: Check Subject Limits for Individual Basic Plan
            if current_user.subscription_type == SubscriptionType.INDIVIDUAL_BASIC:
                subject_count = db.query(Subject).filter(Subject.user_id == current_user.id).count()
                if subject_count >= 4:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Basic Plan is limited to 4 subjects. Please upgrade to Premium to add more."
                    )

            # Create a new subject from the template for this user
            new_subject = Subject(
                user_id=current_user.id,
                template_id=curriculum_template.id,
                subject_name=curriculum_template.subject,
                grade=curriculum_template.grade,
                total_lessons=0,
                lessons_completed=0,
                progress_percentage=0.0
            )
            db.add(new_subject)
            db.flush()  # Get the ID without committing
            subject = new_subject
            entry.subject_id = subject.id
            print(f"Created new subject: {subject.subject_name} - {subject.grade} (ID: {subject.id})")
            

if __name__ == "__main__":
    port = int(os.getenv("API_PORT", os.getenv("PORT", 8000)))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
