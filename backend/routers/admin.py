from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import (
    User, School, SystemAnnouncement, CurriculumTemplate, 
    SchoolSettings, SchoolTerm, CalendarActivity, LessonConfiguration,
    Subject, Lesson, SubStrand, Strand, ProgressLog, UserRole, SubscriptionType
)
from schemas import (
    AdminUsersResponse, BulkDeleteRequest, AdminRoleUpdate, ResetProgressRequest,
    SystemAnnouncementCreate, SystemAnnouncementResponse,
    CurriculumTemplateCreate, CurriculumTemplateUpdate, CurriculumTemplateResponse
)
from dependencies import get_current_user, get_current_super_admin, get_current_admin_user
from config import settings
from auth import create_access_token

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}/admin",
    tags=["Admin"]
)

# ============================================================================
# SUPER ADMIN ENDPOINTS
# ============================================================================

@router.get("/stats")
def get_platform_stats(
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_schools = db.query(School).count()
    total_subjects = db.query(Subject).count()
    
    # Role counts
    total_teachers = db.query(User).filter(User.role == UserRole.TEACHER).count()
    total_school_admins = db.query(User).filter(User.role == UserRole.SCHOOL_ADMIN).count()

    # Subscription counts
    basic_subs = db.query(User).filter(User.subscription_type == SubscriptionType.INDIVIDUAL_BASIC).count()
    premium_subs = db.query(User).filter(User.subscription_type == SubscriptionType.INDIVIDUAL_PREMIUM).count()
    school_sponsored_subs = db.query(User).filter(User.subscription_type == SubscriptionType.SCHOOL_SPONSORED).count()
    
    return {
        "total_users": total_users,
        "total_teachers": total_teachers,
        "total_school_admins": total_school_admins,
        "total_schools": total_schools,
        "total_subjects": total_subjects,
        "subscriptions": {
            "basic": basic_subs,
            "premium": premium_subs,
            "school_sponsored": school_sponsored_subs
        }
    }

@router.get("/schools")
def get_all_schools(
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    return db.query(School).all()

@router.put("/users/{user_id}/upgrade")
def upgrade_user(
    user_id: int,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Logic to upgrade user subscription
    # For now just a placeholder
    return {"message": "User upgraded"}

@router.put("/users/{user_id}/role", response_model=dict)
def update_user_role_super(
    user_id: int,
    role_update: AdminRoleUpdate,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = role_update.role
    db.commit()
    return {"message": "User role updated", "role": user.role}

@router.post("/users/{user_id}/ban")
def ban_user(
    user_id: int,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = False
    db.commit()
    return {"message": "User banned"}

# ============================================================================
# ADMIN USER MANAGEMENT
# ============================================================================

@router.get("/users", response_model=AdminUsersResponse)
def list_admin_users(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    role: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    
    if search:
        query = query.filter(User.email.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%"))
    
    if role:
        query = query.filter(User.role == role)
        
    total = query.count()
    users = query.offset((page - 1) * limit).limit(limit).all()
    
    return {
        "users": users,
        "total": total,
        "page": page,
        "page_size": limit
    }

@router.post("/users/bulk-delete")
def bulk_delete_users(
    request: BulkDeleteRequest,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    db.query(User).filter(User.id.in_(request.user_ids)).delete(synchronize_session=False)
    db.commit()
    return {"message": f"Deleted {len(request.user_ids)} users"}

@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    payload: AdminRoleUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Only Super Admin can change to Super Admin
    if payload.role == UserRole.SUPER_ADMIN and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot promote to Super Admin")
        
    user.role = payload.role
    db.commit()
    return {"message": "Role updated"}

@router.delete("/users/{user_id}")
def delete_user_account(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}

def _reset_subject_progress(db: Session, subject: Subject):
    """Reset completion data for a single subject."""
    lessons = (
        db.query(Lesson)
        .join(SubStrand, Lesson.substrand_id == SubStrand.id)
        .join(Strand, SubStrand.strand_id == Strand.id)
        .filter(Strand.subject_id == subject.id)
        .all()
    )

    # This logic seems to be about resetting lesson completion status
    # But Lesson model doesn't have is_complete field in the snippet provided in main.py context
    # It seems main.py had:
    # for lesson in lessons:
    #    lesson.is_complete = False
    # But we should check if that field exists. Assuming it does based on main.py context.
    # If not, we might need to check ProgressLog.
    
    # Based on main.py snippet:
    # db.query(ProgressLog).filter(ProgressLog.subject_id == subject.id).delete()
    # subject.lessons_completed = 0
    # subject.progress_percentage = 0.0
    
    db.query(ProgressLog).filter(ProgressLog.subject_id == subject.id).delete()
    subject.lessons_completed = 0
    subject.progress_percentage = 0.0

@router.post("/users/{user_id}/reset-progress")
def reset_user_progress(
    user_id: int,
    payload: ResetProgressRequest = Body(default=None),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Reset logic here
    # If payload has subject_id, reset only that subject
    # Else reset all
    
    if payload and payload.subject_id:
        subject = db.query(Subject).filter(Subject.id == payload.subject_id).first()
        if subject:
            _reset_subject_progress(db, subject)
    else:
        # Reset all subjects for user? 
        # The main.py snippet was truncated, but usually this implies resetting all progress logs for the user
        db.query(ProgressLog).filter(ProgressLog.user_id == user_id).delete()
        
    db.commit()
    return {"message": "Progress reset"}

@router.post("/users/{user_id}/impersonate", response_model=dict)
def impersonate_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Create token for target user
    access_token = create_access_token(
        data={"sub": target_user.email},
        expires_delta=None # Default expiry
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": target_user.email,
            "full_name": target_user.full_name,
            "role": target_user.role
        }
    }

# ============================================================================
# CURRICULUM TEMPLATE MANAGEMENT (Admin Only)
# ============================================================================

@router.get("/curriculum-templates", response_model=List[CurriculumTemplateResponse])
async def get_all_curriculum_templates(
    education_level: str = None,
    grade: str = None,
    is_active: bool = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    query = db.query(CurriculumTemplate)
    if education_level:
        query = query.filter(CurriculumTemplate.education_level == education_level)
    if grade:
        query = query.filter(CurriculumTemplate.grade == grade)
    if is_active is not None:
        query = query.filter(CurriculumTemplate.is_active == is_active)
        
    return query.all()

@router.post("/curriculum-templates", response_model=CurriculumTemplateResponse)
async def create_curriculum_template(
    template: CurriculumTemplateCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    db_template = CurriculumTemplate(**template.dict())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@router.put("/curriculum-templates/{template_id}", response_model=CurriculumTemplateResponse)
async def update_curriculum_template(
    template_id: int,
    template_update: CurriculumTemplateUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    template = db.query(CurriculumTemplate).filter(CurriculumTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    for key, value in template_update.dict(exclude_unset=True).items():
        setattr(template, key, value)
        
    db.commit()
    db.refresh(template)
    return template

@router.delete("/curriculum-templates/{template_id}")
async def delete_curriculum_template(
    template_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    template = db.query(CurriculumTemplate).filter(CurriculumTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    db.delete(template)
    db.commit()
    return {"message": "Template deleted"}

# ============================================================================
# SCHOOL SETTINGS (Admin)
# ============================================================================

@router.get("/school-settings")
def get_school_settings(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    # If school admin, get their school settings
    if current_user.school_id:
        return db.query(SchoolSettings).filter(SchoolSettings.school_id == current_user.school_id).first()
    return None

@router.post("/school-settings")
def create_school_settings(
    settings_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    if not current_user.school_id:
        raise HTTPException(status_code=400, detail="User not linked to a school")
        
    settings = SchoolSettings(
        school_id=current_user.school_id,
        **settings_data
    )
    db.add(settings)
    db.commit()
    return settings

@router.put("/school-settings/{settings_id}")
def update_school_settings(
    settings_id: int,
    settings_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    settings = db.query(SchoolSettings).filter(SchoolSettings.id == settings_id).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
        
    for key, value in settings_data.items():
        setattr(settings, key, value)
        
    db.commit()
    return settings

@router.post("/upload-logo")
async def upload_school_logo(
    logo: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    # Placeholder for upload logic
    # In main.py it wasn't fully implemented in the snippet, but we should use cloudinary
    from cloudinary_storage import upload_file_to_cloudinary
    
    result = await upload_file_to_cloudinary(logo, folder="school_logos")
    logo_url = result.get("secure_url")
    
    if current_user.school_id:
        settings = db.query(SchoolSettings).filter(SchoolSettings.school_id == current_user.school_id).first()
        if settings:
            settings.logo_url = logo_url
            db.commit()
            
    return {"url": logo_url}

# ============================================================================
# SCHOOL TERMS (Admin)
# ============================================================================

@router.get("/school-terms")
def get_school_terms(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    if not current_user.school_id:
        return []
    return db.query(SchoolTerm).filter(SchoolTerm.school_id == current_user.school_id).all()

@router.post("/school-terms")
def create_school_term(
    term_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    if not current_user.school_id:
        raise HTTPException(status_code=400, detail="User not linked to a school")
        
    term = SchoolTerm(
        school_id=current_user.school_id,
        **term_data
    )
    db.add(term)
    db.commit()
    return term

@router.put("/school-terms/{term_id}")
def update_school_term(
    term_id: int,
    term_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    term = db.query(SchoolTerm).filter(SchoolTerm.id == term_id).first()
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
        
    for key, value in term_data.items():
        setattr(term, key, value)
        
    db.commit()
    return term

@router.delete("/school-terms/{term_id}")
def delete_school_term(
    term_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    term = db.query(SchoolTerm).filter(SchoolTerm.id == term_id).first()
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
        
    db.delete(term)
    db.commit()
    return {"message": "Term deleted"}

# ============================================================================
# CALENDAR ACTIVITIES
# ============================================================================

@router.get("/calendar-activities")
def get_calendar_activities(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    if not current_user.school_id:
        return []
    return db.query(CalendarActivity).filter(CalendarActivity.school_id == current_user.school_id).all()

@router.post("/calendar-activities")
def create_calendar_activity(
    activity_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    if not current_user.school_id:
        raise HTTPException(status_code=400, detail="User not linked to a school")
        
    activity = CalendarActivity(
        school_id=current_user.school_id,
        **activity_data
    )
    db.add(activity)
    db.commit()
    return activity

@router.put("/calendar-activities/{activity_id}")
def update_calendar_activity(
    activity_id: int,
    activity_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    activity = db.query(CalendarActivity).filter(CalendarActivity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    for key, value in activity_data.items():
        setattr(activity, key, value)
        
    db.commit()
    return activity

@router.delete("/calendar-activities/{activity_id}")
def delete_calendar_activity(
    activity_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    activity = db.query(CalendarActivity).filter(CalendarActivity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    db.delete(activity)
    db.commit()
    return {"message": "Activity deleted"}

# ============================================================================
# ANALYTICS
# ============================================================================

@router.get("/analytics")
def get_admin_analytics(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    # Placeholder for analytics logic
    return {
        "users": db.query(User).count(),
        "lessons_taught": 0,
        "active_teachers": 0
    }

# ============================================================================
# LESSONS PER WEEK CONFIG
# ============================================================================

@router.get("/lessons-per-week")
def get_lessons_per_week_configs(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    if not current_user.school_id:
        return []
    return db.query(LessonConfiguration).filter(LessonConfiguration.school_id == current_user.school_id).all()

@router.post("/lessons-per-week")
def update_lessons_per_week_config(
    config_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    if not current_user.school_id:
        raise HTTPException(status_code=400, detail="User not linked to a school")
        
    # Check if exists
    config = db.query(LessonConfiguration).filter(
        LessonConfiguration.school_id == current_user.school_id,
        LessonConfiguration.grade == config_data.get("grade"),
        LessonConfiguration.subject == config_data.get("subject")
    ).first()
    
    if config:
        for key, value in config_data.items():
            setattr(config, key, value)
    else:
        config = LessonConfiguration(
            school_id=current_user.school_id,
            **config_data
        )
        db.add(config)
        
    db.commit()
    return config
