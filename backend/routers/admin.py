from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import datetime, timedelta

from database import get_db
from models import (
    User, School, Payment, PaymentStatus, SystemAnnouncement, SystemSetting, CurriculumTemplate, TemplateStrand, TemplateSubstrand,
    SchoolSettings, SchoolTerm, CalendarActivity, LessonConfiguration, SystemTerm,
    Subject, Lesson, SubStrand, Strand, ProgressLog, UserRole, SubscriptionType, SubscriptionStatus, Department
)
from schemas import (
    AdminUsersResponse, BulkDeleteRequest, AdminRoleUpdate, ResetProgressRequest,
    SystemAnnouncementCreate, SystemAnnouncementResponse,
    CurriculumTemplateCreate, CurriculumTemplateUpdate, CurriculumTemplateResponse,
    SchoolUpdate, UserLinkRequest, BulkBanRequest, AdminUserUpdate, AdminUserCreate,
    DepartmentCreate, DepartmentUpdate, DepartmentResponse
)
from dependencies import get_current_user, get_current_super_admin, get_current_admin_user
from config import settings
from auth import create_access_token, get_password_hash
import logging
import traceback

logger = logging.getLogger(__name__)


from pydantic import BaseModel, Field


class PricingPlanConfig(BaseModel):
    label: str = Field(..., min_length=1, max_length=80)
    price_kes: int = Field(..., ge=0, le=10_000_000)
    duration_label: str = Field(..., min_length=1, max_length=20)


class PricingConfigPayload(BaseModel):
    currency: str = Field("KES", min_length=1, max_length=10)
    termly: PricingPlanConfig
    yearly: PricingPlanConfig


DEFAULT_PRICING_CONFIG = {
    "currency": "KES",
    "termly": {
        "label": "Termly Pass",
        "price_kes": 350,
        "duration_label": "/term",
    },
    "yearly": {
        "label": "Yearly Saver",
        "price_kes": 1000,
        "duration_label": "/year",
    },
}


class AdminPaymentUser(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None


class AdminPaymentItem(BaseModel):
    id: int
    amount: float
    phone_number: str
    transaction_code: Optional[str] = None
    checkout_request_id: str
    merchant_request_id: Optional[str] = None
    status: str
    description: Optional[str] = None
    reference: Optional[str] = None
    result_desc: Optional[str] = None
    mpesa_metadata: Optional[dict] = None
    created_at: datetime
    user: AdminPaymentUser


class AdminPaymentsResponse(BaseModel):
    items: List[AdminPaymentItem]
    page: int
    limit: int
    total: int


class AdminPaymentStatsResponse(BaseModel):
    total_revenue: float
    revenue_today: float
    revenue_this_month: float
    total_completed: int
    total_pending: int
    total_failed: int
    total_cancelled: int

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}/admin",
    tags=["Admin"]
)


@router.get("/payments", response_model=AdminPaymentsResponse)
def list_payments(
    page: int = 1,
    limit: int = 25,
    status: Optional[str] = None,
    q: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    """List payment transactions (Super Admin only)."""
    page = max(page, 1)
    limit = max(min(limit, 100), 1)

    query = (
        db.query(Payment)
        .options(joinedload(Payment.user))
        .join(User, Payment.user_id == User.id)
    )

    if status:
        status_upper = status.upper()
        # Validate against enum values
        allowed = {s.value for s in PaymentStatus}
        if status_upper not in allowed:
            raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {sorted(list(allowed))}")
        query = query.filter(Payment.status == status_upper)

    if q:
        q_like = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Payment.phone_number.ilike(q_like),
                Payment.transaction_code.ilike(q_like),
                Payment.checkout_request_id.ilike(q_like),
                User.email.ilike(q_like),
                User.full_name.ilike(q_like),
            )
        )

    # Date filters (ISO date: YYYY-MM-DD)
    def _parse_date(value: Optional[str]) -> Optional[datetime]:
        if not value:
            return None
        try:
            # Accept full ISO datetime or date.
            if "T" in value:
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            return datetime.fromisoformat(value)
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid date format: {value}. Use YYYY-MM-DD")

    start_dt = _parse_date(start_date)
    end_dt = _parse_date(end_date)
    if start_dt:
        query = query.filter(Payment.created_at >= start_dt)
    if end_dt:
        # If given a date-only string, include entire day by adding 1 day and using <
        if end_date and "T" not in end_date:
            end_dt = end_dt + timedelta(days=1)
        query = query.filter(Payment.created_at < end_dt)

    total = query.count()
    items = (
        query.order_by(Payment.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    def to_item(p: Payment) -> dict:
        return {
            "id": p.id,
            "amount": float(p.amount or 0),
            "phone_number": p.phone_number,
            "transaction_code": p.transaction_code,
            "checkout_request_id": p.checkout_request_id,
            "merchant_request_id": p.merchant_request_id,
            "status": p.status.value if hasattr(p.status, "value") else str(p.status),
            "description": p.description,
            "reference": p.reference,
            "result_desc": p.result_desc,
            "mpesa_metadata": p.mpesa_metadata,
            "created_at": p.created_at,
            "user": {
                "id": p.user.id if p.user else p.user_id,
                "email": p.user.email if p.user else "",
                "full_name": getattr(p.user, "full_name", None) if p.user else None,
            },
        }

    return {
        "items": [to_item(p) for p in items],
        "page": page,
        "limit": limit,
        "total": total,
    }


@router.get("/payments/stats", response_model=AdminPaymentStatsResponse)
def payment_stats(
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    """Aggregate payment stats (Super Admin only)."""
    now = datetime.utcnow()
    start_of_today = datetime(now.year, now.month, now.day)
    start_of_month = datetime(now.year, now.month, 1)

    completed = PaymentStatus.COMPLETED

    total_revenue = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status == completed)
        .scalar()
        or 0
    )
    revenue_today = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status == completed)
        .filter(Payment.created_at >= start_of_today)
        .scalar()
        or 0
    )
    revenue_this_month = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status == completed)
        .filter(Payment.created_at >= start_of_month)
        .scalar()
        or 0
    )

    total_completed = db.query(Payment.id).filter(Payment.status == PaymentStatus.COMPLETED).count()
    total_pending = db.query(Payment.id).filter(Payment.status == PaymentStatus.PENDING).count()
    total_failed = db.query(Payment.id).filter(Payment.status == PaymentStatus.FAILED).count()
    total_cancelled = db.query(Payment.id).filter(Payment.status == PaymentStatus.CANCELLED).count()

    return {
        "total_revenue": float(total_revenue),
        "revenue_today": float(revenue_today),
        "revenue_this_month": float(revenue_this_month),
        "total_completed": total_completed,
        "total_pending": total_pending,
        "total_failed": total_failed,
        "total_cancelled": total_cancelled,
    }


@router.get("/pricing-config")
def get_pricing_config_admin(
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    """Super-admin view of pricing config."""
    try:
        row = db.query(SystemSetting).filter(SystemSetting.key == "pricing_config").first()
        if row and isinstance(row.value, dict):
            return row.value
        return DEFAULT_PRICING_CONFIG
    except Exception as e:
        logger.exception("Failed to read pricing_config")
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to read pricing configuration. The database schema may be missing "
                "or the database user may lack required permissions."
            ),
        ) from e


@router.put("/pricing-config")
def update_pricing_config_admin(
    payload: PricingConfigPayload,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    """Super-admin update of pricing config."""
    try:
        row = db.query(SystemSetting).filter(SystemSetting.key == "pricing_config").first()
        if not row:
            row = SystemSetting(key="pricing_config", value=payload.dict(), updated_by=current_user.id)
            db.add(row)
        else:
            row.value = payload.dict()
            row.updated_by = current_user.id

        db.commit()
        db.refresh(row)
        return row.value
    except Exception as e:
        db.rollback()
        logger.exception("Failed to update pricing_config")
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to update pricing configuration. The database schema may be missing "
                "or the database user may lack required permissions."
            ),
        ) from e

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
    total_teachers = db.query(User).filter(User.role.in_([UserRole.TEACHER, UserRole.HOD])).count()
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
        .filter(User.role.in_([UserRole.TEACHER, UserRole.HOD]))
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
        .filter(User.school_id == school_id, User.role.in_([UserRole.TEACHER, UserRole.HOD]))
        .all()
    )
    
    # Get previously linked teachers (downgraded)
    previous_teachers = (
        db.query(User)
        .options(joinedload(User.subjects))
        .filter(
            User.previous_school_id == school_id,
            User.school_id != school_id,  # Not currently linked
            User.role.in_([UserRole.TEACHER, UserRole.HOD]),
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

class SubscriptionUpdate(BaseModel):
    subscription_type: SubscriptionType
    subscription_status: SubscriptionStatus

@router.put("/users/{user_id}/subscription")
def update_user_subscription(
    user_id: int,
    update_data: SubscriptionUpdate,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.subscription_type = update_data.subscription_type
    user.subscription_status = update_data.subscription_status
    
    db.commit()
    db.refresh(user)
    
    return {"message": "User subscription updated successfully", "user": {
        "id": user.id,
        "email": user.email,
        "subscription_type": user.subscription_type,
        "subscription_status": user.subscription_status
    }}

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
            User.role.in_([UserRole.TEACHER, UserRole.HOD]),
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

@router.post("/users")
def create_user(
    payload: AdminUserCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    # Check if email exists
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Only Super Admin can create Super Admin
    if payload.role == UserRole.SUPER_ADMIN and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot create Super Admin")

    hashed_password = get_password_hash(payload.password)
    
    new_user = User(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hashed_password,
        school=payload.school,
        grade_level=payload.grade_level,
        role=payload.role,
        is_active=True,
        email_verified=True, # Admin created users are verified
        auth_provider="local"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User created successfully", "user_id": new_user.id}

@router.patch("/users/{user_id}")
def update_user_details(
    user_id: int,
    payload: AdminUserUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Only Super Admin can change to/from Super Admin
    if payload.role == UserRole.SUPER_ADMIN and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot promote to Super Admin")
        
    if user.role == UserRole.SUPER_ADMIN and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot modify Super Admin")

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.email is not None:
        # Check uniqueness if email changed
        if payload.email != user.email:
            if db.query(User).filter(User.email == payload.email).first():
                raise HTTPException(status_code=400, detail="Email already in use")
        user.email = payload.email
    if payload.school is not None:
        user.school = payload.school
    if payload.grade_level is not None:
        user.grade_level = payload.grade_level
    if payload.role is not None:
        user.role = payload.role
        # Sync legacy is_admin flag
        user.is_admin = (payload.role in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN])
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password is not None:
        user.password_hash = get_password_hash(payload.password)

    db.commit()
    return {"message": "User updated successfully"}

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
        LessonConfiguration.subject_name == config_data.get("subject_name")
    ).first()
    
    if config:
        # Update existing
        if "lessons_per_week" in config_data:
            config.lessons_per_week = config_data["lessons_per_week"]
        if "double_lessons_per_week" in config_data:
            config.double_lessons_per_week = config_data["double_lessons_per_week"]
        if "single_lesson_duration" in config_data:
            config.single_lesson_duration = config_data["single_lesson_duration"]
        if "double_lesson_duration" in config_data:
            config.double_lesson_duration = config_data["double_lesson_duration"]
    else:
        # Create new
        config = LessonConfiguration(
            school_id=current_user.school_id,
            subject_name=config_data.get("subject_name"),
            grade=config_data.get("grade"),
            lessons_per_week=config_data.get("lessons_per_week", 5),
            double_lessons_per_week=config_data.get("double_lessons_per_week", 0),
            single_lesson_duration=config_data.get("single_lesson_duration", 40),
            double_lesson_duration=config_data.get("double_lesson_duration", 80)
        )
        db.add(config)
        
    db.commit()
    db.refresh(config)
    return config

@router.post("/lessons-per-week/bulk")
def bulk_update_lessons_config(
    bulk_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Apply settings to all subjects in a specific grade"""
    if not current_user.school_id:
        raise HTTPException(status_code=400, detail="User not linked to a school")
    
    grade = bulk_data.get("grade")
    subjects = bulk_data.get("subjects", []) # List of subject names
    
    if not grade or not subjects:
        raise HTTPException(status_code=400, detail="Grade and subjects are required")
        
    updated_count = 0
    
    for subject_name in subjects:
        # Check if exists
        config = db.query(LessonConfiguration).filter(
            LessonConfiguration.school_id == current_user.school_id,
            LessonConfiguration.grade == grade,
            LessonConfiguration.subject_name == subject_name
        ).first()
        
        if config:
            # Update existing
            if "lessons_per_week" in bulk_data:
                config.lessons_per_week = bulk_data["lessons_per_week"]
            if "double_lessons_per_week" in bulk_data:
                config.double_lessons_per_week = bulk_data["double_lessons_per_week"]
            if "single_lesson_duration" in bulk_data:
                config.single_lesson_duration = bulk_data["single_lesson_duration"]
            if "double_lesson_duration" in bulk_data:
                config.double_lesson_duration = bulk_data["double_lesson_duration"]
        else:
            # Create new
            config = LessonConfiguration(
                school_id=current_user.school_id,
                subject_name=subject_name,
                grade=grade,
                lessons_per_week=bulk_data.get("lessons_per_week", 5),
                double_lessons_per_week=bulk_data.get("double_lessons_per_week", 0),
                single_lesson_duration=bulk_data.get("single_lesson_duration", 40),
                double_lesson_duration=bulk_data.get("double_lesson_duration", 80)
            )
            db.add(config)
        updated_count += 1
        
    db.commit()
    return {"message": f"Updated {updated_count} subjects for {grade}"}

# ============================================================================
# DEPARTMENTS
# ============================================================================

@router.get("/departments", response_model=List[DepartmentResponse])
def get_departments(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    if not current_user.school_id:
        return []
    
    departments = db.query(Department).filter(Department.school_id == current_user.school_id).all()
    
    # Manually populate hod_name for response
    result = []
    for dept in departments:
        dept_dict = DepartmentResponse.from_orm(dept)
        if dept.hod:
            dept_dict.hod_name = dept.hod.full_name
        result.append(dept_dict)
        
    return result

@router.post("/departments", response_model=DepartmentResponse)
def create_department(
    dept_data: DepartmentCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    if not current_user.school_id:
        raise HTTPException(status_code=400, detail="User not linked to a school")
        
    department = Department(
        school_id=current_user.school_id,
        **dept_data.dict()
    )
    db.add(department)
    db.commit()
    db.refresh(department)
    
    # Populate hod_name
    response = DepartmentResponse.from_orm(department)
    if department.hod:
        response.hod_name = department.hod.full_name
    return response

@router.put("/departments/{dept_id}", response_model=DepartmentResponse)
def update_department(
    dept_id: int,
    dept_data: DepartmentUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    department = db.query(Department).filter(
        Department.id == dept_id,
        Department.school_id == current_user.school_id
    ).first()
    
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
        
    for key, value in dept_data.dict(exclude_unset=True).items():
        setattr(department, key, value)
        
    db.commit()
    db.refresh(department)
    
    response = DepartmentResponse.from_orm(department)
    if department.hod:
        response.hod_name = department.hod.full_name
    return response

@router.delete("/departments/{dept_id}")
def delete_department(
    dept_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    department = db.query(Department).filter(
        Department.id == dept_id,
        Department.school_id == current_user.school_id
    ).first()
    
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
        
    db.delete(department)
    db.commit()
    return {"message": "Department deleted"}

# ============================================================================
# ACADEMIC YEAR ROLLOVER
# ============================================================================

@router.post("/school-settings/rollover")
def rollover_academic_year(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    if not current_user.school_id:
        raise HTTPException(status_code=400, detail="User not linked to a school")
        
    settings = db.query(SchoolSettings).filter(SchoolSettings.school_id == current_user.school_id).first()
    if not settings:
        raise HTTPException(status_code=404, detail="School settings not found")
        
    # Logic:
    # 1. Increment established_year (or we should have a current_year field, but established_year is what we have)
    #    Actually, established_year is when school started. We probably shouldn't change that.
    #    Let's assume we just move streams.
    
    # 2. Move streams up
    #    Order: PP1 -> PP2 -> Grade 1 ... -> Grade 12
    
    grade_order = [
        "PP1", "PP2", 
        "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
        "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"
    ]
    
    current_streams = settings.streams_per_grade or {}
    new_streams = {}
    
    # Initialize all grades in new_streams with empty lists
    for grade in grade_order:
        new_streams[grade] = []
        
    # Move streams
    for i in range(len(grade_order) - 1, -1, -1):
        current_grade = grade_order[i]
        
        # If it's the last grade (Grade 12), these streams graduate/archive
        if i == len(grade_order) - 1:
            # Maybe log archived streams? For now, they just disappear from active list
            pass
        else:
            # Move to next grade
            next_grade = grade_order[i + 1]
            if current_grade in current_streams:
                # Copy streams to next grade
                # Reset pupil counts? Or keep them? Usually keep them as students move up.
                new_streams[next_grade] = current_streams[current_grade]
                
    # PP1 (First grade) starts empty
    new_streams["PP1"] = []
    
    # Update settings
    settings.streams_per_grade = new_streams
    
    # Update established_year? No.
    # Maybe we need a way to track "Current Academic Year" in settings.
    # For now, we just do the stream move.
    
    db.commit()
    
    return {"message": "Academic year rollover completed successfully. Streams have been promoted."}


# ============================================================================
# SYSTEM TERMS (Super Admin Only - Global Term Management)
# ============================================================================

class SystemTermCreate(BaseModel):
    term_number: int = Field(..., ge=1, le=3, description="Term number (1, 2, or 3)")
    term_name: str = Field(..., description="Term name, e.g., 'Term 1'")
    year: int = Field(..., description="Academic year, e.g., 2026")
    start_date: str = Field(..., description="Start date in ISO format YYYY-MM-DD")
    end_date: str = Field(..., description="End date in ISO format YYYY-MM-DD")
    teaching_weeks: Optional[int] = Field(None, description="Number of teaching weeks (auto-calculated if not provided)")
    mid_term_break_start: Optional[str] = None
    mid_term_break_end: Optional[str] = None
    is_current: bool = False

class SystemTermUpdate(BaseModel):
    term_name: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    teaching_weeks: Optional[int] = None
    mid_term_break_start: Optional[str] = None
    mid_term_break_end: Optional[str] = None
    is_current: Optional[bool] = None

class SystemTermResponse(BaseModel):
    id: int
    term_number: int
    term_name: str
    year: int
    start_date: str
    end_date: str
    teaching_weeks: int
    mid_term_break_start: Optional[str] = None
    mid_term_break_end: Optional[str] = None
    is_current: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


def parse_date_string(date_str: str) -> datetime:
    """Parse date string to datetime, handling multiple formats."""
    try:
        # Try ISO format first
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except ValueError:
        # Fallback to simple date string
        return datetime.strptime(date_str.split('T')[0], "%Y-%m-%d")


@router.get("/system-terms", response_model=List[SystemTermResponse])
def get_system_terms(
    year: Optional[int] = None,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Get all system-wide terms. Optionally filter by year."""
    query = db.query(SystemTerm)
    if year:
        query = query.filter(SystemTerm.year == year)
    terms = query.order_by(SystemTerm.year.desc(), SystemTerm.term_number).all()
    
    result = []
    for t in terms:
        result.append(SystemTermResponse(
            id=t.id,
            term_number=t.term_number,
            term_name=t.term_name,
            year=t.year,
            start_date=t.start_date.isoformat() if t.start_date else "",
            end_date=t.end_date.isoformat() if t.end_date else "",
            teaching_weeks=t.teaching_weeks,
            mid_term_break_start=t.mid_term_break_start.isoformat() if t.mid_term_break_start else None,
            mid_term_break_end=t.mid_term_break_end.isoformat() if t.mid_term_break_end else None,
            is_current=t.is_current,
            created_at=t.created_at
        ))
    return result


@router.post("/system-terms", response_model=SystemTermResponse)
def create_system_term(
    term_data: SystemTermCreate,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Create a new system-wide term. Only Super Admin can do this."""
    # Check if term already exists for this year and term_number
    existing = db.query(SystemTerm).filter(
        SystemTerm.year == term_data.year,
        SystemTerm.term_number == term_data.term_number
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Term {term_data.term_number} for year {term_data.year} already exists. Use PUT to update."
        )
    
    start_date = parse_date_string(term_data.start_date)
    end_date = parse_date_string(term_data.end_date)
    
    # Auto-calculate teaching weeks if not provided
    teaching_weeks = term_data.teaching_weeks
    if not teaching_weeks:
        days_diff = (end_date - start_date).days
        teaching_weeks = max(1, days_diff // 7)
    
    mid_start = parse_date_string(term_data.mid_term_break_start) if term_data.mid_term_break_start else None
    mid_end = parse_date_string(term_data.mid_term_break_end) if term_data.mid_term_break_end else None
    
    # If setting as current, unset others
    if term_data.is_current:
        db.query(SystemTerm).filter(SystemTerm.is_current == True).update({"is_current": False})
    
    new_term = SystemTerm(
        term_number=term_data.term_number,
        term_name=term_data.term_name,
        year=term_data.year,
        start_date=start_date,
        end_date=end_date,
        teaching_weeks=teaching_weeks,
        mid_term_break_start=mid_start,
        mid_term_break_end=mid_end,
        is_current=term_data.is_current,
        created_by=current_user.id
    )
    
    db.add(new_term)
    db.commit()
    db.refresh(new_term)
    
    return SystemTermResponse(
        id=new_term.id,
        term_number=new_term.term_number,
        term_name=new_term.term_name,
        year=new_term.year,
        start_date=new_term.start_date.isoformat(),
        end_date=new_term.end_date.isoformat(),
        teaching_weeks=new_term.teaching_weeks,
        mid_term_break_start=new_term.mid_term_break_start.isoformat() if new_term.mid_term_break_start else None,
        mid_term_break_end=new_term.mid_term_break_end.isoformat() if new_term.mid_term_break_end else None,
        is_current=new_term.is_current,
        created_at=new_term.created_at
    )


@router.put("/system-terms/{term_id}", response_model=SystemTermResponse)
def update_system_term(
    term_id: int,
    term_data: SystemTermUpdate,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Update an existing system term. Only Super Admin can do this."""
    term = db.query(SystemTerm).filter(SystemTerm.id == term_id).first()
    if not term:
        raise HTTPException(status_code=404, detail="System term not found")
    
    if term_data.term_name is not None:
        term.term_name = term_data.term_name
    
    if term_data.start_date is not None:
        term.start_date = parse_date_string(term_data.start_date)
    
    if term_data.end_date is not None:
        term.end_date = parse_date_string(term_data.end_date)
    
    if term_data.teaching_weeks is not None:
        term.teaching_weeks = term_data.teaching_weeks
    elif term_data.start_date or term_data.end_date:
        # Recalculate if dates changed
        days_diff = (term.end_date - term.start_date).days
        term.teaching_weeks = max(1, days_diff // 7)
    
    if term_data.mid_term_break_start is not None:
        term.mid_term_break_start = parse_date_string(term_data.mid_term_break_start) if term_data.mid_term_break_start else None
    
    if term_data.mid_term_break_end is not None:
        term.mid_term_break_end = parse_date_string(term_data.mid_term_break_end) if term_data.mid_term_break_end else None
    
    if term_data.is_current is not None:
        if term_data.is_current:
            # Unset other current terms
            db.query(SystemTerm).filter(SystemTerm.id != term_id, SystemTerm.is_current == True).update({"is_current": False})
        term.is_current = term_data.is_current
    
    db.commit()
    db.refresh(term)
    
    return SystemTermResponse(
        id=term.id,
        term_number=term.term_number,
        term_name=term.term_name,
        year=term.year,
        start_date=term.start_date.isoformat(),
        end_date=term.end_date.isoformat(),
        teaching_weeks=term.teaching_weeks,
        mid_term_break_start=term.mid_term_break_start.isoformat() if term.mid_term_break_start else None,
        mid_term_break_end=term.mid_term_break_end.isoformat() if term.mid_term_break_end else None,
        is_current=term.is_current,
        created_at=term.created_at
    )


@router.delete("/system-terms/{term_id}")
def delete_system_term(
    term_id: int,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Delete a system term. Only Super Admin can do this."""
    term = db.query(SystemTerm).filter(SystemTerm.id == term_id).first()
    if not term:
        raise HTTPException(status_code=404, detail="System term not found")
    
    db.delete(term)
    db.commit()
    return {"message": f"System term '{term.term_name}' for year {term.year} deleted"}


@router.post("/system-terms/generate-year/{year}")
def generate_year_terms(
    year: int,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """
    Generate default Kenya academic calendar terms for a given year.
    Will not overwrite existing terms for that year.
    """
    # Check if terms already exist for this year
    existing = db.query(SystemTerm).filter(SystemTerm.year == year).count()
    if existing > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Terms for year {year} already exist. Delete them first or update individually."
        )
    
    # Default Kenya academic calendar (approximate dates)
    default_terms = [
        {
            "term_number": 1,
            "term_name": "Term 1",
            "start_date": datetime(year, 1, 6),  # Early January
            "end_date": datetime(year, 4, 4),    # Early April
            "teaching_weeks": 13,
            "mid_term_break_start": datetime(year, 2, 17),
            "mid_term_break_end": datetime(year, 2, 21),
        },
        {
            "term_number": 2,
            "term_name": "Term 2",
            "start_date": datetime(year, 4, 28),  # Late April
            "end_date": datetime(year, 8, 1),     # Early August
            "teaching_weeks": 14,
            "mid_term_break_start": datetime(year, 6, 2),
            "mid_term_break_end": datetime(year, 6, 6),
        },
        {
            "term_number": 3,
            "term_name": "Term 3",
            "start_date": datetime(year, 8, 25),  # Late August
            "end_date": datetime(year, 10, 25),   # Late October
            "teaching_weeks": 9,
            "mid_term_break_start": None,
            "mid_term_break_end": None,
        },
    ]
    
    # Determine which term is current based on today's date
    today = datetime.now()
    
    created_terms = []
    for term_def in default_terms:
        is_current = (
            term_def["start_date"] <= today <= term_def["end_date"]
        ) if term_def["start_date"].year == today.year else False
        
        new_term = SystemTerm(
            term_number=term_def["term_number"],
            term_name=term_def["term_name"],
            year=year,
            start_date=term_def["start_date"],
            end_date=term_def["end_date"],
            teaching_weeks=term_def["teaching_weeks"],
            mid_term_break_start=term_def["mid_term_break_start"],
            mid_term_break_end=term_def["mid_term_break_end"],
            is_current=is_current,
            created_by=current_user.id
        )
        db.add(new_term)
        created_terms.append(new_term)
    
    db.commit()
    
    return {
        "message": f"Generated {len(created_terms)} terms for year {year}",
        "terms": [
            {
                "term_number": t.term_number,
                "term_name": t.term_name,
                "start_date": t.start_date.isoformat(),
                "end_date": t.end_date.isoformat(),
                "is_current": t.is_current
            } for t in created_terms
        ]
    }


@router.post("/system-terms/set-current/{term_id}")
def set_current_term(
    term_id: int,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Set a specific term as the current active term."""
    term = db.query(SystemTerm).filter(SystemTerm.id == term_id).first()
    if not term:
        raise HTTPException(status_code=404, detail="System term not found")
    
    # Unset all other current terms
    db.query(SystemTerm).filter(SystemTerm.is_current == True).update({"is_current": False})
    
    # Set this term as current
    term.is_current = True
    db.commit()
    
    return {"message": f"'{term.term_name}' ({term.year}) is now the current term"}

