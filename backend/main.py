from fastapi import FastAPI, Depends, HTTPException, status, Response, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
import uvicorn
import json
import os
import mimetypes

from database import get_db, engine
from models import (
    User, Subject, Strand, SubStrand, Lesson, ProgressLog, Note, Term,
    CurriculumTemplate, TemplateStrand, TemplateSubstrand,
    NoteAnnotation, PresentationSession, SpeakerNote, SharedPresentation,
    SchoolSchedule, TimeSlot, TimetableEntry
)
from sqlalchemy import text, func, and_
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
    TimeSlotResponse, TimetableEntryCreate, TimetableEntryUpdate, TimetableEntryResponse
)
from auth import verify_password, get_password_hash, create_access_token, verify_token
from config import settings
from curriculum_importer import import_curriculum_from_json, get_imported_curricula

# Create tables (DISABLED - using SQL migrations instead)
# Base.metadata.create_all(bind=engine)
# Note: Run database/schema.sql and database/curriculum_templates_schema.sql manually

# Initialize FastAPI app
app = FastAPI(
    title="TeachTrack CBC API",
    description="API for TeachTrack CBC - Curriculum tracking for Kenyan teachers",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods including preflight variations
    allow_headers=["*"],
)

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
    """Dependency to check if current user is an admin"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
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
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        phone=user_data.phone,
        school=user_data.school,
        grade_level=user_data.grade_level,
        email_verified=True  # Auto-verify for now
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
            password_hash=None  # No password for OAuth users
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
            "auth_provider": user.auth_provider
        }
    }

# Subject endpoints
@app.get(f"{settings.API_V1_PREFIX}/subjects", response_model=List[SubjectResponse])
def get_subjects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
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
    # Verify subject belongs to user
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.user_id == current_user.id
    ).first()
    
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
            "sub_strands": [
                {
                    "id": ss.id,
                    "substrand_name": ss.substrand_name,
                    "substrand_code": ss.substrand_code,
                    "lessons_count": ss.lessons_count
                }
                for ss in sub_strands
            ]
        })
    
    return result

@app.post(f"{settings.API_V1_PREFIX}/subjects", response_model=SubjectResponse)
def create_subject(
    subject_data: SubjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_subject = Subject(
        user_id=current_user.id,
        subject_name=subject_data.subject_name,
        grade=subject_data.grade,
        curriculum_pdf_url=subject_data.curriculum_pdf_url
    )
    
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    
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
    current_user: User = Depends(get_current_user),
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
                    # Fallback: create generic lessons if no SLOs
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
    
    # Get all lessons with strand/substrand info
    lessons = db.query(
        Lesson.id,
        Lesson.lesson_number,
        Lesson.lesson_title,
        Lesson.is_completed,
        Lesson.completed_at,
        SubStrand.substrand_name,
        SubStrand.substrand_code,
        Strand.strand_name,
        Strand.strand_code
    ).select_from(Lesson
    ).join(SubStrand, Lesson.substrand_id == SubStrand.id
    ).join(Strand, SubStrand.strand_id == Strand.id
    ).filter(
        Strand.subject_id == subject_id
    ).order_by(Strand.sequence_order, SubStrand.sequence_order, Lesson.sequence_order).all()
    
    return {
        "subject_id": subject_id,
        "subject_name": subject.subject_name,
        "total_lessons": subject.total_lessons,
        "lessons_completed": subject.lessons_completed,
        "progress_percentage": subject.progress_percentage,
        "lessons": [
            {
                "id": l[0],
                "lesson_number": l[1],
                "lesson_title": l[2],
                "is_completed": l[3],
                "completed_at": l[4].isoformat() if l[4] else None,
                "substrand_name": l[5],
                "substrand_code": l[6],
                "strand_name": l[7],
                "strand_code": l[8]
            }
            for l in lessons
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
# TERM MANAGEMENT ENDPOINTS
# ============================================================================

@app.get(f"{settings.API_V1_PREFIX}/terms")
def get_terms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all terms for the current user"""
    terms = db.query(Term).filter(Term.user_id == current_user.id).order_by(Term.term_number).all()
    
    return {
        "terms": [
            {
                "id": t.id,
                "term_number": t.term_number,
                "term_name": t.term_name,
                "academic_year": t.academic_year,
                "start_date": t.start_date.isoformat() if t.start_date else None,
                "end_date": t.end_date.isoformat() if t.end_date else None,
                "teaching_weeks": t.teaching_weeks,
                "is_current": t.is_current
            }
            for t in terms
        ]
    }

@app.post(f"{settings.API_V1_PREFIX}/terms")
def create_term(
    term_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new term"""
    term = Term(
        user_id=current_user.id,
        term_number=term_data["term_number"],
        term_name=term_data["term_name"],
        academic_year=term_data["academic_year"],
        start_date=datetime.fromisoformat(term_data["start_date"]),
        end_date=datetime.fromisoformat(term_data["end_date"]),
        teaching_weeks=term_data["teaching_weeks"],
        is_current=term_data.get("is_current", False)
    )
    
    # If marking as current, unmark all other terms
    if term.is_current:
        db.query(Term).filter(Term.user_id == current_user.id).update({"is_current": False})
    
    db.add(term)
    db.commit()
    db.refresh(term)
    
    return {
        "message": "Term created successfully",
        "term": {
            "id": term.id,
            "term_number": term.term_number,
            "term_name": term.term_name,
            "academic_year": term.academic_year,
            "start_date": term.start_date.isoformat(),
            "end_date": term.end_date.isoformat(),
            "teaching_weeks": term.teaching_weeks,
            "is_current": term.is_current
        }
    }

@app.put(f"{settings.API_V1_PREFIX}/terms/{{term_id}}")
def update_term(
    term_id: int,
    term_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a term"""
    term = db.query(Term).filter(Term.id == term_id, Term.user_id == current_user.id).first()
    
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
    
    # Update fields
    if "term_name" in term_data:
        term.term_name = term_data["term_name"]
    if "start_date" in term_data:
        term.start_date = datetime.fromisoformat(term_data["start_date"])
    if "end_date" in term_data:
        term.end_date = datetime.fromisoformat(term_data["end_date"])
    if "teaching_weeks" in term_data:
        term.teaching_weeks = term_data["teaching_weeks"]
    if "is_current" in term_data:
        if term_data["is_current"]:
            # Unmark all other terms
            db.query(Term).filter(Term.user_id == current_user.id).update({"is_current": False})
        term.is_current = term_data["is_current"]
    
    db.commit()
    db.refresh(term)
    
    return {
        "message": "Term updated successfully",
        "term": {
            "id": term.id,
            "term_number": term.term_number,
            "term_name": term.term_name,
            "academic_year": term.academic_year,
            "start_date": term.start_date.isoformat(),
            "end_date": term.end_date.isoformat(),
            "teaching_weeks": term.teaching_weeks,
            "is_current": term.is_current
        }
    }

@app.get(f"{settings.API_V1_PREFIX}/terms/current")
def get_current_term(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the currently active term"""
    term = db.query(Term).filter(
        Term.user_id == current_user.id,
        Term.is_current == True
    ).first()
    
    if not term:
        return {"current_term": None}
    
    return {
        "current_term": {
            "id": term.id,
            "term_number": term.term_number,
            "term_name": term.term_name,
            "academic_year": term.academic_year,
            "start_date": term.start_date.isoformat(),
            "end_date": term.end_date.isoformat(),
            "teaching_weeks": term.teaching_weeks,
            "is_current": term.is_current
        }
    }

# ============================================================================
# SUBJECT SCHEDULING ENDPOINTS
# ============================================================================

@app.put(f"{settings.API_V1_PREFIX}/subjects/{{subject_id}}/scheduling")
def update_subject_scheduling(
    subject_id: int,
    scheduling_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update scheduling configuration for a subject"""
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.user_id == current_user.id
    ).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Update scheduling fields
    if "lessons_per_week" in scheduling_data:
        subject.lessons_per_week = scheduling_data["lessons_per_week"]
    if "single_lesson_duration" in scheduling_data:
        subject.single_lesson_duration = scheduling_data["single_lesson_duration"]
    if "double_lesson_duration" in scheduling_data:
        subject.double_lesson_duration = scheduling_data["double_lesson_duration"]
    if "double_lessons_per_week" in scheduling_data:
        subject.double_lessons_per_week = scheduling_data["double_lessons_per_week"]
    
    db.commit()
    db.refresh(subject)
    
    return {
        "message": "Scheduling updated successfully",
        "scheduling": {
            "lessons_per_week": subject.lessons_per_week,
            "single_lesson_duration": subject.single_lesson_duration,
            "double_lesson_duration": subject.double_lesson_duration,
            "double_lessons_per_week": subject.double_lessons_per_week
        }
    }

@app.get(f"{settings.API_V1_PREFIX}/subjects/{{subject_id}}/scheduling")
def get_subject_scheduling(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get scheduling configuration for a subject"""
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.user_id == current_user.id
    ).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    return {
        "subject_id": subject.id,
        "subject_name": subject.subject_name,
        "scheduling": {
            "lessons_per_week": subject.lessons_per_week,
            "single_lesson_duration": subject.single_lesson_duration,
            "double_lesson_duration": subject.double_lesson_duration,
            "double_lessons_per_week": subject.double_lessons_per_week
        }
    }

@app.put(f"{settings.API_V1_PREFIX}/user/settings")
def update_user_settings(
    settings_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's default settings"""
    user = db.query(User).filter(User.id == current_user.id).first()
    
    if "default_lesson_duration" in settings_data:
        user.default_lesson_duration = settings_data["default_lesson_duration"]
    if "default_double_lesson_duration" in settings_data:
        user.default_double_lesson_duration = settings_data["default_double_lesson_duration"]
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Settings updated successfully",
        "settings": {
            "default_lesson_duration": user.default_lesson_duration,
            "default_double_lesson_duration": user.default_double_lesson_duration
        }
    }

# ============================================================================
# CURRICULUM IMPORT ENDPOINTS (Admin)
# ============================================================================

@app.post(f"{settings.API_V1_PREFIX}/admin/import-curriculum")
async def import_curriculum(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Import curriculum from JSON file
    Upload a JSON file with curriculum structure
    """
    
    # Optional: Add admin check here
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Read uploaded file
        contents = await file.read()
        json_data = json.loads(contents.decode('utf-8'))
        
        # Import curriculum
        result = import_curriculum_from_json(json_data, db)
        
        if result["success"]:
            return {
                "success": True,
                "message": result["message"],
                "curriculum_id": result["curriculum_id"],
                "stats": result.get("stats", {}),
                "filename": file.filename
            }
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON file: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

@app.get(f"{settings.API_V1_PREFIX}/admin/curricula")
def list_imported_curricula(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of all imported curriculum templates"""
    curricula = get_imported_curricula(db)
    return {
        "curricula": curricula,
        "total": len(curricula)
    }

@app.delete(f"{settings.API_V1_PREFIX}/admin/curricula/{{curriculum_id}}")
def delete_curriculum(
    curriculum_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a curriculum template (admin only)"""
    
    # Optional: Add admin check
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Admin access required")
    
    curriculum = db.query(CurriculumTemplate).filter(CurriculumTemplate.id == curriculum_id).first()
    
    if not curriculum:
        raise HTTPException(status_code=404, detail="Curriculum not found")
    
    # Check if any users are using this curriculum
    users_count = db.query(Subject).filter(Subject.template_id == curriculum_id).count()
    
    if users_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete. {users_count} users are using this curriculum."
        )
    
    db.delete(curriculum)
    db.commit()
    
    return {
        "success": True,
        "message": f"Deleted {curriculum.subject} {curriculum.grade}"
    }

# ============================================================================
# ADMIN - USER MANAGEMENT ENDPOINTS
# ============================================================================

@app.get(f"{settings.API_V1_PREFIX}/admin/users")
def get_all_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users with their subjects and progress (Admin only)"""
    
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = db.query(User).all()
    
    result = []
    for user in users:
        # Get user's subjects with progress
        subjects = db.query(Subject).filter(Subject.user_id == user.id).all()
        
        subject_data = []
        for subject in subjects:
            subject_data.append({
                "id": subject.id,
                "subject_name": subject.subject_name,
                "grade": subject.grade,
                "total_lessons": subject.total_lessons,
                "lessons_completed": subject.lessons_completed,
                "progress_percentage": float(subject.progress_percentage)
            })
        
        result.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "school": user.school,
            "grade_level": user.grade_level,
            "is_admin": user.is_admin,
            "auth_provider": user.auth_provider,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "subjects_count": len(subjects),
            "subjects": subject_data
        })
    
    return {
        "users": result,
        "total": len(result)
    }

@app.patch(f"{settings.API_V1_PREFIX}/admin/users/{{user_id}}/role")
def update_user_role(
    user_id: int,
    is_admin: bool,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle user admin role (Admin only)"""
    
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent removing admin role from yourself
    if user.id == current_user.id and not is_admin:
        raise HTTPException(status_code=400, detail="Cannot remove admin role from yourself")
    
    user.is_admin = is_admin
    db.commit()
    
    return {
        "success": True,
        "message": f"User {'promoted to' if is_admin else 'demoted from'} admin",
        "user_id": user_id,
        "is_admin": is_admin
    }

@app.delete(f"{settings.API_V1_PREFIX}/admin/users/{{user_id}}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a user account (Admin only)"""
    
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deleting yourself
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    email = user.email
    db.delete(user)
    db.commit()
    
    return {
        "success": True,
        "message": f"Deleted user {email}"
    }

@app.post(f"{settings.API_V1_PREFIX}/admin/users/{{user_id}}/reset-progress")
def reset_user_progress(
    user_id: int,
    subject_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset user's progress for a subject or all subjects (Admin only)"""
    
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        if subject_id:
            # Reset specific subject
            subject = db.query(Subject).filter(
                Subject.id == subject_id,
                Subject.user_id == user_id
            ).first()
            
            if not subject:
                raise HTTPException(status_code=404, detail="Subject not found")
            
            # Reset all lessons in this subject
            lessons = db.query(Lesson).join(SubStrand).join(Strand).filter(
                Strand.subject_id == subject_id
            ).all()
            
            for lesson in lessons:
                lesson.is_completed = False
                lesson.completed_at = None
            
            subject.lessons_completed = 0
            subject.progress_percentage = 0.0
            
            db.commit()
            
            return {
                "success": True,
                "message": f"Reset progress for {subject.subject_name}",
                "subject_id": subject_id
            }
        else:
            # Reset all subjects for this user
            subjects = db.query(Subject).filter(Subject.user_id == user_id).all()
            
            for subject in subjects:
                lessons = db.query(Lesson).join(SubStrand).join(Strand).filter(
                    Strand.subject_id == subject.id
                ).all()
                
                for lesson in lessons:
                    lesson.is_completed = False
                    lesson.completed_at = None
                
                subject.lessons_completed = 0
                subject.progress_percentage = 0.0
            
            db.commit()
            
            return {
                "success": True,
                "message": f"Reset all progress for {user.email}",
                "subjects_reset": len(subjects)
            }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reset progress: {str(e)}")

# ============================================================================
# ADMIN - ANALYTICS ENDPOINTS
# ============================================================================

@app.get(f"{settings.API_V1_PREFIX}/admin/analytics")
def get_admin_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics for admin dashboard"""
    
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get total counts
    total_users = db.query(User).count()
    total_templates = db.query(CurriculumTemplate).count()
    total_subjects = db.query(Subject).count()
    
    # Most used curricula
    curriculum_usage = db.query(
        CurriculumTemplate.subject,
        CurriculumTemplate.grade,
        func.count(Subject.id).label('usage_count')
    ).outerjoin(
        Subject, 
        and_(
            Subject.subject_name == CurriculumTemplate.subject,
            Subject.grade == CurriculumTemplate.grade
        )
    ).group_by(
        CurriculumTemplate.subject,
        CurriculumTemplate.grade
    ).order_by(
        func.count(Subject.id).desc()
    ).limit(10).all()
    
    most_used = [
        {
            "subject": row.subject,
            "grade": row.grade,
            "usage_count": row.usage_count
        }
        for row in curriculum_usage
    ]
    
    # Average completion rates per subject
    subject_stats = db.query(
        Subject.subject_name,
        func.avg(Subject.progress_percentage).label('avg_completion'),
        func.count(Subject.id).label('subject_count')
    ).group_by(
        Subject.subject_name
    ).all()
    
    completion_rates = [
        {
            "subject": row.subject_name,
            "avg_completion": round(float(row.avg_completion or 0), 2),
            "count": row.subject_count
        }
        for row in subject_stats
    ]
    
    # Teacher engagement metrics
    active_teachers = db.query(User).join(Subject).group_by(User.id).having(func.count(Subject.id) > 0).count()
    
    users_with_subjects = db.query(
        User.id,
        User.email,
        func.count(Subject.id).label('subject_count'),
        func.avg(Subject.progress_percentage).label('avg_progress')
    ).outerjoin(Subject).group_by(User.id, User.email).all()
    
    engagement_data = [
        {
            "user_id": row.id,
            "email": row.email,
            "subjects": row.subject_count,
            "avg_progress": round(float(row.avg_progress or 0), 2)
        }
        for row in users_with_subjects
    ]
    
    # Subject popularity (by grade)
    grade_distribution = db.query(
        Subject.grade,
        func.count(Subject.id).label('count')
    ).group_by(Subject.grade).order_by(Subject.grade).all()
    
    popularity = [
        {
            "grade": row.grade,
            "count": row.count
        }
        for row in grade_distribution
    ]
    
    # Activity timeline (subjects created in last 30 days)
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.now() - timedelta(days=30)
    
    recent_activity = db.query(
        func.date(Subject.created_at).label('date'),
        func.count(Subject.id).label('count')
    ).filter(
        Subject.created_at >= thirty_days_ago
    ).group_by(
        func.date(Subject.created_at)
    ).order_by(
        func.date(Subject.created_at)
    ).all()
    
    activity_timeline = [
        {
            "date": row.date.isoformat() if row.date else None,
            "count": row.count
        }
        for row in recent_activity
    ]
    
    # Overall progress statistics
    all_subjects = db.query(Subject).all()
    progress_ranges = {
        "0-25": 0,
        "26-50": 0,
        "51-75": 0,
        "76-100": 0
    }
    
    for subject in all_subjects:
        progress = subject.progress_percentage
        if progress <= 25:
            progress_ranges["0-25"] += 1
        elif progress <= 50:
            progress_ranges["26-50"] += 1
        elif progress <= 75:
            progress_ranges["51-75"] += 1
        else:
            progress_ranges["76-100"] += 1
    
    return {
        "overview": {
            "total_users": total_users,
            "active_teachers": active_teachers,
            "total_templates": total_templates,
            "total_subjects": total_subjects
        },
        "most_used_curricula": most_used,
        "completion_rates": completion_rates,
        "teacher_engagement": engagement_data,
        "subject_popularity": popularity,
        "activity_timeline": activity_timeline,
        "progress_distribution": progress_ranges
    }

# ============================================================================
# ADMIN - CURRICULUM TEMPLATE EDITOR ENDPOINTS
# ============================================================================

@app.get(f"{settings.API_V1_PREFIX}/admin/curriculum-templates/{{template_id}}")
def get_template_for_editing(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get curriculum template with all strands and substrands for editing (Admin only)"""
    
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    template = db.query(CurriculumTemplate).filter(CurriculumTemplate.id == template_id).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Get all strands with substrands
    strands = db.query(TemplateStrand).filter(
        TemplateStrand.curriculum_template_id == template_id
    ).order_by(TemplateStrand.sequence_order).all()
    
    strands_data = []
    for strand in strands:
        substrands = db.query(TemplateSubstrand).filter(
            TemplateSubstrand.strand_id == strand.id
        ).order_by(TemplateSubstrand.sequence_order).all()
        
        strands_data.append({
            "id": strand.id,
            "sequence_order": strand.sequence_order,
            "strand_name": strand.strand_name,
            "substrands": [
                {
                    "id": ss.id,
                    "sequence_order": ss.sequence_order,
                    "substrand_name": ss.substrand_name,
                    "specific_learning_outcomes": ss.specific_learning_outcomes,
                    "suggested_learning_experiences": ss.suggested_learning_experiences,
                    "key_inquiry_questions": ss.key_inquiry_questions,
                    "number_of_lessons": ss.number_of_lessons
                }
                for ss in substrands
            ]
        })
    
    # Calculate totals from the data
    total_substrands = sum(len(strand["substrands"]) for strand in strands_data)
    total_lessons = sum(
        ss["number_of_lessons"] 
        for strand in strands_data 
        for ss in strand["substrands"]
    )
    
    return {
        "id": template.id,
        "subject": template.subject,
        "grade": template.grade,
        "is_active": template.is_active,
        "total_strands": len(strands_data),
        "total_substrands": total_substrands,
        "total_lessons": total_lessons,
        "strands": strands_data
    }

@app.put(f"{settings.API_V1_PREFIX}/admin/curriculum-templates/{{template_id}}")
def update_curriculum_template(
    template_id: int,
    update_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update curriculum template including strands and substrands (Admin only)"""
    
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    template = db.query(CurriculumTemplate).filter(CurriculumTemplate.id == template_id).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    try:
        # Update template info
        template.subject = update_data.get("subject", template.subject)
        template.grade = update_data.get("grade", template.grade)
        template.is_active = update_data.get("is_active", template.is_active)
        
        # Get existing strand IDs
        existing_strand_ids = {strand.id for strand in db.query(TemplateStrand).filter(
            TemplateStrand.template_id == template_id
        ).all()}
        
        new_strand_ids = set()
        total_substrands = 0
        total_lessons = 0
        
        # Process strands from update data
        if "strands" in update_data:
            for strand_data in update_data["strands"]:
                strand_id = strand_data.get("id")
                
                # Check if it's a new strand (temporary ID from frontend)
                if strand_id and strand_id > 1000000000:  # Temporary IDs are timestamps
                    # Create new strand
                    new_strand = TemplateStrand(
                        curriculum_template_id=template_id,
                        strand_number=str(strand_data.get("sequence_order", 0)),  # Use sequence as strand number
                        sequence_order=strand_data.get("sequence_order"),
                        strand_name=strand_data.get("strand_name")
                    )
                    db.add(new_strand)
                    db.flush()  # Get the new ID
                    strand_id = new_strand.id
                else:
                    # Update existing strand
                    strand = db.query(TemplateStrand).filter(TemplateStrand.id == strand_id).first()
                    if strand:
                        strand.sequence_order = strand_data.get("sequence_order")
                        strand.strand_name = strand_data.get("strand_name")
                
                new_strand_ids.add(strand_id)
                
                # Get existing substrand IDs for this strand
                existing_substrand_ids = {ss.id for ss in db.query(TemplateSubstrand).filter(
                    TemplateSubstrand.strand_id == strand_id
                ).all()}
                
                new_substrand_ids = set()
                
                # Process substrands
                for substrand_data in strand_data.get("substrands", []):
                    substrand_id = substrand_data.get("id")
                    
                    # Check if it's a new substrand
                    if substrand_id and substrand_id > 1000000000:
                        # Create new substrand
                        new_substrand = TemplateSubstrand(
                            strand_id=strand_id,
                            substrand_number=str(substrand_data.get("sequence_order", 0)),  # Use sequence as substrand number
                            sequence_order=substrand_data.get("sequence_order"),
                            substrand_name=substrand_data.get("substrand_name"),
                            specific_learning_outcomes=substrand_data.get("specific_learning_outcomes"),
                            suggested_learning_experiences=substrand_data.get("suggested_learning_experiences"),
                            key_inquiry_questions=substrand_data.get("key_inquiry_questions"),
                            number_of_lessons=substrand_data.get("number_of_lessons", 1)
                        )
                        db.add(new_substrand)
                        db.flush()
                        substrand_id = new_substrand.id
                    else:
                        # Update existing substrand
                        substrand = db.query(TemplateSubstrand).filter(
                            TemplateSubstrand.id == substrand_id
                        ).first()
                        if substrand:
                            substrand.sequence_order = substrand_data.get("sequence_order")
                            substrand.substrand_name = substrand_data.get("substrand_name")
                            substrand.specific_learning_outcomes = substrand_data.get("specific_learning_outcomes")
                            substrand.suggested_learning_experiences = substrand_data.get("suggested_learning_experiences")
                            substrand.key_inquiry_questions = substrand_data.get("key_inquiry_questions")
                            substrand.number_of_lessons = substrand_data.get("number_of_lessons", 1)
                    
                    new_substrand_ids.add(substrand_id)
                    total_substrands += 1
                    total_lessons += substrand_data.get("number_of_lessons", 1)
                
                # Delete removed substrands
                for old_id in existing_substrand_ids - new_substrand_ids:
                    db.query(TemplateSubstrand).filter(TemplateSubstrand.id == old_id).delete()
        
        # Delete removed strands (and their substrands will cascade)
        for old_id in existing_strand_ids - new_strand_ids:
            db.query(TemplateSubstrand).filter(TemplateSubstrand.strand_id == old_id).delete()
            db.query(TemplateStrand).filter(TemplateStrand.id == old_id).delete()
        
        db.commit()
        
        return {
            "success": True,
            "message": "Curriculum template updated successfully",
            "template_id": template_id
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update template: {str(e)}")

# ============================================================================
# PRESENTATION FEATURES API ENDPOINTS
# ============================================================================

# Annotation Endpoints
@app.post(f"{settings.API_V1_PREFIX}/notes/{{note_id}}/annotations", response_model=NoteAnnotationResponse)
async def create_annotation(
    note_id: int,
    annotation: NoteAnnotationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save drawing/annotation for a note page"""
    # Verify note belongs to user
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db_annotation = NoteAnnotation(
        note_id=note_id,
        user_id=current_user.id,
        page_number=annotation.page_number,
        drawing_data=annotation.drawing_data
    )
    db.add(db_annotation)
    db.commit()
    db.refresh(db_annotation)
    return db_annotation

@app.get(f"{settings.API_V1_PREFIX}/notes/{{note_id}}/annotations", response_model=List[NoteAnnotationResponse])
async def get_annotations(
    note_id: int,
    page_number: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all annotations for a note, optionally filtered by page"""
    query = db.query(NoteAnnotation).filter(
        NoteAnnotation.note_id == note_id,
        NoteAnnotation.user_id == current_user.id
    )
    
    if page_number is not None:
        query = query.filter(NoteAnnotation.page_number == page_number)
    
    return query.order_by(NoteAnnotation.page_number).all()

@app.put(f"{settings.API_V1_PREFIX}/annotations/{{annotation_id}}", response_model=NoteAnnotationResponse)
async def update_annotation(
    annotation_id: int,
    annotation_update: NoteAnnotationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing annotation"""
    db_annotation = db.query(NoteAnnotation).filter(
        NoteAnnotation.id == annotation_id,
        NoteAnnotation.user_id == current_user.id
    ).first()
    
    if not db_annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    
    db_annotation.drawing_data = annotation_update.drawing_data
    db.commit()
    db.refresh(db_annotation)
    return db_annotation

@app.delete(f"{settings.API_V1_PREFIX}/annotations/{{annotation_id}}")
async def delete_annotation(
    annotation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an annotation"""
    db_annotation = db.query(NoteAnnotation).filter(
        NoteAnnotation.id == annotation_id,
        NoteAnnotation.user_id == current_user.id
    ).first()
    
    if not db_annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    
    db.delete(db_annotation)
    db.commit()
    return {"message": "Annotation deleted successfully"}

# Presentation Session (Timer) Endpoints
@app.post(f"{settings.API_V1_PREFIX}/notes/{{note_id}}/sessions", response_model=PresentationSessionResponse)
async def start_presentation_session(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new presentation session"""
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    session = PresentationSession(
        note_id=note_id,
        user_id=current_user.id
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@app.put(f"{settings.API_V1_PREFIX}/sessions/{{session_id}}", response_model=PresentationSessionResponse)
async def update_presentation_session(
    session_id: int,
    session_update: PresentationSessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update presentation session duration"""
    session = db.query(PresentationSession).filter(
        PresentationSession.id == session_id,
        PresentationSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.duration_seconds = session_update.duration_seconds
    if session_update.ended_at:
        session.ended_at = session_update.ended_at
    db.commit()
    db.refresh(session)
    return session

@app.get(f"{settings.API_V1_PREFIX}/notes/{{note_id}}/sessions", response_model=List[PresentationSessionResponse])
async def get_presentation_sessions(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all presentation sessions for a note"""
    return db.query(PresentationSession).filter(
        PresentationSession.note_id == note_id,
        PresentationSession.user_id == current_user.id
    ).order_by(PresentationSession.started_at.desc()).all()

# Speaker Notes Endpoints
@app.post(f"{settings.API_V1_PREFIX}/notes/{{note_id}}/speaker-notes", response_model=SpeakerNoteResponse)
async def create_or_update_speaker_note(
    note_id: int,
    speaker_note: SpeakerNoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update speaker notes for a page"""
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Check if speaker note exists for this page
    existing = db.query(SpeakerNote).filter(
        SpeakerNote.note_id == note_id,
        SpeakerNote.user_id == current_user.id,
        SpeakerNote.page_number == speaker_note.page_number
    ).first()
    
    if existing:
        existing.notes = speaker_note.notes
        db.commit()
        db.refresh(existing)
        return existing
    else:
        db_note = SpeakerNote(
            note_id=note_id,
            user_id=current_user.id,
            page_number=speaker_note.page_number,
            notes=speaker_note.notes
        )
        db.add(db_note)
        db.commit()
        db.refresh(db_note)
        return db_note

@app.get(f"{settings.API_V1_PREFIX}/notes/{{note_id}}/speaker-notes", response_model=List[SpeakerNoteResponse])
async def get_speaker_notes(
    note_id: int,
    page_number: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get speaker notes for a note"""
    query = db.query(SpeakerNote).filter(
        SpeakerNote.note_id == note_id,
        SpeakerNote.user_id == current_user.id
    )
    
    if page_number is not None:
        query = query.filter(SpeakerNote.page_number == page_number)
    
    return query.order_by(SpeakerNote.page_number).all()

# Shared Presentation Endpoints
@app.post(f"{settings.API_V1_PREFIX}/notes/{{note_id}}/share", response_model=SharedPresentationResponse)
async def create_share_link(
    note_id: int,
    share_request: SharedPresentationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a shareable link for a presentation"""
    import secrets
    from datetime import timedelta
    
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Generate unique token
    share_token = secrets.token_urlsafe(32)
    
    # Calculate expiry
    expires_at = None
    if share_request.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=share_request.expires_in_days)
    
    shared_pres = SharedPresentation(
        note_id=note_id,
        user_id=current_user.id,
        share_token=share_token,
        expires_at=expires_at,
        allow_download=share_request.allow_download
    )
    db.add(shared_pres)
    db.commit()
    db.refresh(shared_pres)
    
    # Build share URL
    share_url = f"{settings.FRONTEND_URL}/shared/{share_token}"
    
    response = SharedPresentationResponse(
        id=shared_pres.id,
        note_id=shared_pres.note_id,
        user_id=shared_pres.user_id,
        share_token=shared_pres.share_token,
        share_url=share_url,
        expires_at=shared_pres.expires_at,
        is_active=shared_pres.is_active,
        view_count=shared_pres.view_count,
        allow_download=shared_pres.allow_download,
        created_at=shared_pres.created_at
    )
    return response

@app.get(f"{settings.API_V1_PREFIX}/notes/{{note_id}}/shares", response_model=List[SharedPresentationResponse])
async def get_share_links(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all share links for a note"""
    shares = db.query(SharedPresentation).filter(
        SharedPresentation.note_id == note_id,
        SharedPresentation.user_id == current_user.id
    ).all()
    
    result = []
    for share in shares:
        share_url = f"{settings.FRONTEND_URL}/shared/{share.share_token}"
        result.append(SharedPresentationResponse(
            id=share.id,
            note_id=share.note_id,
            user_id=share.user_id,
            share_token=share.share_token,
            share_url=share_url,
            expires_at=share.expires_at,
            is_active=share.is_active,
            view_count=share.view_count,
            allow_download=share.allow_download,
            created_at=share.created_at
        ))
    return result

@app.delete(f"{settings.API_V1_PREFIX}/shares/{{share_id}}")
async def delete_share_link(
    share_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete/deactivate a share link"""
    share = db.query(SharedPresentation).filter(
        SharedPresentation.id == share_id,
        SharedPresentation.user_id == current_user.id
    ).first()
    
    if not share:
        raise HTTPException(status_code=404, detail="Share link not found")
    
    share.is_active = False
    db.commit()
    return {"message": "Share link deactivated"}

@app.get(f"{settings.API_V1_PREFIX}/shared/{{share_token}}")
async def get_shared_presentation(
    share_token: str,
    db: Session = Depends(get_db)
):
    """Public endpoint to view shared presentation"""
    share = db.query(SharedPresentation).filter(
        SharedPresentation.share_token == share_token,
        SharedPresentation.is_active == True
    ).first()
    
    if not share:
        raise HTTPException(status_code=404, detail="Shared presentation not found or expired")
    
    # Check expiry
    if share.expires_at and share.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="This share link has expired")
    
    # Increment view count
    share.view_count += 1
    db.commit()
    
    # Get note
    note = db.query(Note).filter(Note.id == share.note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {
        "note": {
            "id": note.id,
            "title": note.title,
            "file_url": note.file_url,
            "file_type": note.file_type,
            "thumbnail_url": note.thumbnail_url
        },
        "allow_download": share.allow_download,
        "view_count": share.view_count
    }

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
        resource_type = "raw" if note.file_type in ['pdf', 'docx', 'pptx', 'xlsx', 'doc', 'ppt', 'xls'] else "image"
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
    
    # Check if user already has an active schedule
    existing = db.query(SchoolSchedule).filter(
        SchoolSchedule.user_id == current_user.id,
        SchoolSchedule.is_active == True
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You already have an active schedule. Deactivate it first or update it."
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the currently active school schedule"""
    schedule = db.query(SchoolSchedule).filter(
        SchoolSchedule.user_id == current_user.id,
        SchoolSchedule.is_active == True
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="No active schedule found. Please create one.")
    
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
                                            'lessons_before_tea_break', 'lessons_before_lunch',
                                            'lessons_after_lunch', 'first_break_duration',
                                            'tea_break_duration', 'lunch_break_duration']):
        # Delete old time slots
        db.query(TimeSlot).filter(TimeSlot.schedule_id == schedule_id).delete()
        db.commit()
        
        # Generate new ones
        generate_time_slots(schedule, db)
    
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all time slots for active schedule"""
    # Get active schedule
    schedule = db.query(SchoolSchedule).filter(
        SchoolSchedule.user_id == current_user.id,
        SchoolSchedule.is_active == True
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="No active schedule found")
    
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
    
    # Get active schedule
    schedule = db.query(SchoolSchedule).filter(
        SchoolSchedule.user_id == current_user.id,
        SchoolSchedule.is_active == True
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="No active schedule. Please create one first.")
    
    # Try to find subject in user's subjects, or check if it's a curriculum template
    subject = db.query(Subject).filter(
        Subject.id == entry.subject_id,
        Subject.user_id == current_user.id
    ).first()
    
    # If not found in user's subjects, check if it's a curriculum template
    if not subject:
        curriculum_template = db.query(CurriculumTemplate).filter(
            CurriculumTemplate.id == entry.subject_id,
            CurriculumTemplate.is_active == True
        ).first()
        
        if not curriculum_template:
            raise HTTPException(status_code=404, detail="Subject or curriculum template not found")
        
        # Check if user already has this subject
        existing_subject = db.query(Subject).filter(
            Subject.user_id == current_user.id,
            Subject.subject_name == curriculum_template.subject,
            Subject.grade == curriculum_template.grade
        ).first()
        
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
                progress_percentage=0.00
            )
            db.add(new_subject)
            db.flush()  # Get the ID without committing
            subject = new_subject
            entry.subject_id = subject.id
    
    # Verify time slot exists and is a lesson slot
    time_slot = db.query(TimeSlot).filter(
        TimeSlot.id == entry.time_slot_id,
        TimeSlot.schedule_id == schedule.id
    ).first()
    
    if not time_slot:
        raise HTTPException(status_code=404, detail="Time slot not found")
    
    if time_slot.slot_type != "lesson":
        raise HTTPException(status_code=400, detail="Cannot assign subject to break/lunch slot")
    
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
    
    # Create entry
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
    day_of_week: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all timetable entries, optionally filtered by day"""
    
    # Get active schedule
    schedule = db.query(SchoolSchedule).filter(
        SchoolSchedule.user_id == current_user.id,
        SchoolSchedule.is_active == True
    ).first()
    
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
    
    # Get active schedule
    schedule = db.query(SchoolSchedule).filter(
        SchoolSchedule.user_id == current_user.id,
        SchoolSchedule.is_active == True
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="No active schedule found")
    
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the next upcoming lesson"""
    from datetime import datetime
    
    current_time = datetime.now()
    current_day = current_time.isoweekday()
    current_time_str = current_time.strftime("%H:%M")
    
    if current_day > 5:  # Weekend
        return {
            "has_next_lesson": False,
            "message": "No lessons on weekends"
        }
    
    # Get active schedule
    schedule = db.query(SchoolSchedule).filter(
        SchoolSchedule.user_id == current_user.id,
        SchoolSchedule.is_active == True
    ).first()
    
    if not schedule:
        return {
            "has_next_lesson": False,
            "message": "No active schedule"
        }
    
    # Find next lesson today or on following days
    for day_offset in range(6):  # Check today + next 5 days
        check_day = current_day + day_offset
        if check_day > 5:
            check_day = check_day - 5  # Wrap to next week
        
        if check_day > 5:  # Skip weekends
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
                "entry": {
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
                    "is_double_lesson": entry.is_double_lesson
                }
            }
            
            if lesson:
                result["entry"]["lesson"] = {
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
    """Delete a timetable entry"""
    entry = db.query(TimetableEntry).filter(
        TimetableEntry.id == entry_id,
        TimetableEntry.user_id == current_user.id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    
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


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
