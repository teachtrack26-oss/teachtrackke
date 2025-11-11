from fastapi import FastAPI, Depends, HTTPException, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session, joinedload
from typing import List
import uvicorn

from database import get_db, engine
from models import (
    User, Subject, Strand, SubStrand, Lesson, ProgressLog, Note,
    CurriculumTemplate, TemplateStrand, TemplateSubstrand
)
from sqlalchemy import text
from schemas import (
    UserCreate, UserLogin, UserResponse, Token, GoogleAuth,
    SubjectCreate, SubjectResponse,
    StrandCreate, StrandResponse,
    SubStrandCreate, SubStrandResponse,
    LessonCreate, LessonResponse,
    ProgressLogCreate, ProgressLogResponse,
    NoteCreate, NoteResponse
)
from auth import verify_password, get_password_hash, create_access_token, verify_token
from config import settings

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

# Debug middleware to log incoming preflight requests (remove in production)
@app.middleware("http")
async def log_requests(request, call_next):
    if request.method == "OPTIONS":
        origin = request.headers.get("origin")
        acr_method = request.headers.get("access-control-request-method")
        acr_headers = request.headers.get("access-control-request-headers")
        print(f"[CORS PRELIGHT] path={request.url.path} origin={origin} req-method={acr_method} req-headers={acr_headers}")
    response = await call_next(request)
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

# Curriculum upload endpoint
from fastapi import UploadFile, File, Form
import os
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
                substrand = SubStrand(
                    strand_id=strand.id,
                    substrand_code=substrand_data.get("subStrandNumber", f"{strand_index + 1}.{substrand_index + 1}"),
                    substrand_name=substrand_data["subStrandName"],
                    lessons_count=substrand_data.get("numberOfLessons", 1),
                    learning_outcomes=", ".join(substrand_data.get("specificLearningOutcomes", [])[:5]),
                    key_inquiry_questions=", ".join(substrand_data.get("keyInquiryQuestions", [])[:3]),
                    sequence_order=substrand_index + 1
                )
                db.add(substrand)
                db.commit()
                db.refresh(substrand)
                
                # Create lessons for this sub-strand
                for lesson_num in range(substrand_data.get("numberOfLessons", 1)):
                    lesson = Lesson(
                        substrand_id=substrand.id,
                        lesson_number=lesson_num + 1,
                        lesson_title=f"{substrand_data['subStrandName']} - Lesson {lesson_num + 1}",
                        learning_outcomes=", ".join(substrand_data.get("specificLearningOutcomes", [])[:3]),
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
        total_lessons = 0
        for t_strand in template.strands:
            for t_substrand in t_strand.substrands:
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
                
                # Create SubStrand with all curriculum details
                new_substrand = SubStrand(
                    strand_id=new_strand.id,
                    substrand_code=t_substrand.substrand_number,
                    substrand_name=t_substrand.substrand_name,
                    lessons_count=t_substrand.number_of_lessons,
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
                
                # Create Lessons
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


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
