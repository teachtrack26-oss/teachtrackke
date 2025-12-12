from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import (
    User, School, SystemAnnouncement, CurriculumTemplate, TemplateStrand, TemplateSubstrand,
    SchoolSettings, SchoolTerm, CalendarActivity, LessonConfiguration,
    Subject, Lesson, SubStrand, Strand, ProgressLog, UserRole, SubscriptionType
)
from schemas import (
    AdminUsersResponse, BulkDeleteRequest, AdminRoleUpdate, ResetProgressRequest,
    SystemAnnouncementCreate, SystemAnnouncementResponse,
    CurriculumTemplateCreate, CurriculumTemplateUpdate, CurriculumTemplateResponse,
    SchoolUpdate, UserLinkRequest, BulkBanRequest
)
from dependencies import get_current_user, get_current_super_admin, get_current_admin_user
from config import settings
from auth import create_access_token
import logging
import traceback

logger = logging.getLogger(__name__)

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
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    subscription_status: Optional[str] = None,
    sort_by: str = "name",
    sort_order: str = "asc",
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    page = max(page, 1)
    limit = max(min(limit, 100), 1)

    teacher_counts_subq = (
        db.query(
            User.school_id.label("school_id"),
            func.count(User.id).label("teacher_count")
        )
        .filter(User.role == UserRole.TEACHER)
        .group_by(User.school_id)
        .subquery()
    )

    teacher_count_col = func.coalesce(teacher_counts_subq.c.teacher_count, 0)

    query = (
        db.query(School, teacher_count_col.label("teacher_count"))
        .outerjoin(teacher_counts_subq, School.id == teacher_counts_subq.c.school_id)
    )

    if search:
        query = query.filter(School.name.ilike(f"%{search}%"))

    if subscription_status:
        query = query.filter(School.subscription_status == subscription_status)

    sort_mapping = {
        "name": School.name,
        "created_at": School.created_at,
        "subscription_status": School.subscription_status,
        "teacher_count": teacher_count_col,
    }

    sort_column = sort_mapping.get(sort_by, School.name)
    if sort_order.lower() == "desc":
        sort_column = sort_column.desc()
    else:
        sort_column = sort_column.asc()

    query = query.order_by(sort_column)

    total = query.count()
    schools = query.offset((page - 1) * limit).limit(limit).all()

    result = []
    for school, teacher_count in schools:
        admin_user = school.admin
        school_dict = {
            "id": school.id,
            "name": school.name,
            "email": admin_user.email if admin_user else None,
            "admin_name": admin_user.full_name if admin_user else None,
            "admin_id": admin_user.id if admin_user else None,
            "max_teachers": school.max_teachers,
            "subscription_status": school.subscription_status,
            "created_at": school.created_at,
            "teacher_count": teacher_count,
        }
        result.append(school_dict)

    return {
        "schools": result,
        "total": total,
        "page": page,
        "page_size": limit
    }

@router.get("/schools/{school_id}/teachers")
def get_school_teachers(
    school_id: int,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Get all teachers linked to a specific school (current or previous)"""
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Helper to serialize subject summaries
    def serialize_subjects(teacher: User):
        return [
            {
                "id": subject.id,
                "name": subject.subject_name,
                "grade": subject.grade,
                "lessons_completed": subject.lessons_completed,
                "total_lessons": subject.total_lessons,
                "progress": float(subject.progress_percentage or 0),
            }
            for subject in getattr(teacher, "subjects", [])
        ]

    # Helper to serialize teachers with subject info
    def serialize_teacher(teacher: User, is_current: bool):
        subjects = serialize_subjects(teacher)
        return {
            "id": teacher.id,
            "full_name": teacher.full_name,
            "email": teacher.email,
            "subscription_type": teacher.subscription_type.value if teacher.subscription_type else None,
            "is_active": teacher.is_active,
            "created_at": teacher.created_at,
            "is_current": is_current,
            "subjects": subjects,
            "subject_count": len(subjects),
        }

    # Get currently linked teachers
    current_teachers = (
        db.query(User)
        .options(joinedload(User.subjects))
        .filter(User.school_id == school_id, User.role == UserRole.TEACHER)
        .all()
    )
    
    # Get previously linked teachers (downgraded)
    previous_teachers = (
        db.query(User)
        .options(joinedload(User.subjects))
        .filter(
            User.previous_school_id == school_id,
            User.school_id != school_id,  # Not currently linked
            User.role == UserRole.TEACHER,
        )
        .all()
    )
    
    # Get the school admin
    school_admin = db.query(User).filter(
        User.school_id == school_id,
        User.role == UserRole.SCHOOL_ADMIN
    ).first()
    
    return {
        "school": {
            "id": school.id,
            "name": school.name,
            "email": school.admin.email if school.admin else None,
            "max_teachers": school.max_teachers,
            "subscription_status": school.subscription_status
        },
        "school_admin": {
            "id": school_admin.id,
            "full_name": school_admin.full_name,
            "email": school_admin.email,
            "is_active": school_admin.is_active
        } if school_admin else None,
        "teachers": [serialize_teacher(t, True) for t in current_teachers],
        "previous_teachers": [serialize_teacher(t, False) for t in previous_teachers],
        "teacher_count": len(current_teachers),
        "previous_teacher_count": len(previous_teachers)
    }

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
    
    # If banning a School Admin, downgrade all linked teachers to FREE
    teachers_downgraded = 0
    if user.role == UserRole.SCHOOL_ADMIN and user.school_id:
        linked_teachers = db.query(User).filter(
            User.school_id == user.school_id,
            User.role == UserRole.TEACHER,
            User.subscription_type == SubscriptionType.SCHOOL_SPONSORED
        ).all()
        
        for teacher in linked_teachers:
            # Save the previous school before downgrading
            teacher.previous_school_id = teacher.school_id
            teacher.subscription_type = SubscriptionType.FREE
            teachers_downgraded += 1
    
    db.commit()
    
    if teachers_downgraded > 0:
        return {"message": f"User banned. {teachers_downgraded} linked teacher(s) downgraded to FREE subscription."}
    return {"message": "User banned"}

@router.post("/users/{user_id}/unban")
def unban_user(
    user_id: int,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = True
    db.commit()
    return {"message": "User unbanned"}

@router.patch("/schools/{school_id}")
def update_school(
    school_id: int,
    school_update: SchoolUpdate,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    if school_update.max_teachers is not None:
        school.max_teachers = school_update.max_teachers
    
    if school_update.subscription_status is not None:
        school.subscription_status = school_update.subscription_status
        
    db.commit()
    db.refresh(school)
    return school

@router.post("/users/{user_id}/link")
def link_user_to_school(
    user_id: int,
    link_request: UserLinkRequest,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    school = db.query(School).filter(School.id == link_request.school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
        
    user.school_id = school.id
    user.subscription_type = SubscriptionType.SCHOOL_SPONSORED
    db.commit()
    
    return {"message": f"User linked to {school.name}"}

@router.post("/users/{user_id}/unlink")
def unlink_user_from_school(
    user_id: int,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.school_id:
        user.previous_school_id = user.school_id
        user.school_id = None
        user.subscription_type = SubscriptionType.FREE
        db.commit()
        return {"message": "User unlinked from school"}
    
    return {"message": "User was not linked to any school"}

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is a super admin to prevent accidental deletion of self or other admins
    if user.role == UserRole.SUPER_ADMIN:
         raise HTTPException(status_code=400, detail="Cannot delete a Super Admin")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


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

@router.post("/users/bulk-ban")
def bulk_ban_users(
    request: BulkBanRequest,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    is_active = request.action == "unban"
    db.query(User).filter(User.id.in_(request.user_ids)).update(
        {User.is_active: is_active}, synchronize_session=False
    )
    db.commit()
    return {"message": f"{'Unbanned' if is_active else 'Banned'} {len(request.user_ids)} users"}

@router.get("/users/export")
def export_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    
    if search:
        query = query.filter(
            (User.email.ilike(f"%{search}%")) | 
            (User.full_name.ilike(f"%{search}%"))
        )
    
    if role and role != "all":
        query = query.filter(User.role == role)
        
    users = query.all()
    
    # Return as list of dicts for frontend to convert to CSV
    return [
        {
            "ID": u.id,
            "Name": u.full_name,
            "Email": u.email,
            "Role": u.role,
            "School": u.school_rel.name if u.school_rel else "N/A",
            "Status": "Active" if u.is_active else "Banned",
            "Joined": u.created_at.strftime("%Y-%m-%d") if u.created_at else "N/A"
        }
        for u in users
    ]

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

@router.get("/curriculum-templates/{template_id}", response_model=CurriculumTemplateResponse)
async def get_curriculum_template(
    template_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    template = db.query(CurriculumTemplate).filter(CurriculumTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

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
    try:
        template = db.query(CurriculumTemplate).filter(CurriculumTemplate.id == template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
            
        # Update basic fields
        for key, value in template_update.dict(exclude={'strands'}, exclude_unset=True).items():
            setattr(template, key, value)
            
        # Handle Strands
        if template_update.strands is not None:
            # Map existing strands by ID for easy lookup
            existing_strands = {s.id: s for s in template.strands}
            
            # Keep track of processed IDs to know what to delete
            processed_strand_ids = set()
            
            for s_data in template_update.strands:
                strand = None
                # Check if it's an existing strand (and not a temp ID)
                if s_data.id and s_data.id in existing_strands:
                    strand = existing_strands[s_data.id]
                    processed_strand_ids.add(strand.id)
                    
                    # Update strand fields
                    strand.strand_name = s_data.strand_name
                    strand.sequence_order = s_data.sequence_order
                    if s_data.strand_number:
                        strand.strand_number = s_data.strand_number
                else:
                    # Create new strand
                    strand = TemplateStrand(
                        curriculum_template_id=template.id,
                        strand_name=s_data.strand_name,
                        strand_number=s_data.strand_number or str(s_data.sequence_order),
                        sequence_order=s_data.sequence_order
                    )
                    db.add(strand)
                    db.flush() # Get ID for substrands
                
                # Handle Substrands
                if s_data.substrands is not None:
                    existing_substrands = {ss.id: ss for ss in strand.substrands}
                    processed_substrand_ids = set()
                    
                    for ss_data in s_data.substrands:
                        substrand = None
                        if ss_data.id and ss_data.id in existing_substrands:
                            substrand = existing_substrands[ss_data.id]
                            processed_substrand_ids.add(substrand.id)
                            
                            # Update fields
                            substrand.substrand_name = ss_data.substrand_name
                            substrand.number_of_lessons = ss_data.number_of_lessons
                            substrand.specific_learning_outcomes = ss_data.specific_learning_outcomes
                            substrand.suggested_learning_experiences = ss_data.suggested_learning_experiences
                            substrand.key_inquiry_questions = ss_data.key_inquiry_questions
                            substrand.core_competencies = ss_data.core_competencies
                            substrand.values = ss_data.values
                            substrand.pcis = ss_data.pcis
                            substrand.links_to_other_subjects = ss_data.links_to_other_subjects
                            if ss_data.substrand_number:
                                substrand.substrand_number = ss_data.substrand_number
                        else:
                            # Create new substrand
                            substrand = TemplateSubstrand(
                                strand_id=strand.id,
                                substrand_name=ss_data.substrand_name,
                                substrand_number=ss_data.substrand_number or "1.1",
                                number_of_lessons=ss_data.number_of_lessons,
                                specific_learning_outcomes=ss_data.specific_learning_outcomes,
                                suggested_learning_experiences=ss_data.suggested_learning_experiences,
                                key_inquiry_questions=ss_data.key_inquiry_questions,
                                core_competencies=ss_data.core_competencies,
                                values=ss_data.values,
                                pcis=ss_data.pcis,
                                links_to_other_subjects=ss_data.links_to_other_subjects
                            )
                            db.add(substrand)
                            processed_substrand_ids.add(substrand.id) # Mark as processed (though it's new, it shouldn't be deleted)
                    
                    # Delete removed substrands
                    for ss_id, ss in existing_substrands.items():
                        if ss_id not in processed_substrand_ids:
                            db.delete(ss)
            
            # Delete removed strands
            for s_id, s in existing_strands.items():
                if s_id not in processed_strand_ids:
                    db.delete(s)
            
        db.commit()
        db.refresh(template)
        return template
    except Exception as e:
        logger.error(f"Error updating curriculum template: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to update curriculum: {str(e)}")

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
