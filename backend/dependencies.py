from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from datetime import datetime

from database import get_db
from models import (
    User, UserRole, SubscriptionType, Term, SchoolSchedule, 
    TimetableEntry, SchoolSettings, TeacherProfile, SystemTerm
)
from auth import verify_token

security = HTTPBearer(auto_error=False)

def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
):
    token = None
    email = None

    # 1. Try to get token from Bearer header
    if credentials:
        token = credentials.credentials
        email = verify_token(token)
    
    # 2. If header token is missing or invalid, try to get from HttpOnly cookie
    if not email:
        token = request.cookies.get("access_token")
        if token:
            email = verify_token(token)
        
    if not email:
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
    
    # SaaS: Check 1-Month Trial Expiry for Basic/Free Users
    # School-linked users and Admins are exempt
    if user.role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN] and \
       user.subscription_type in [SubscriptionType.INDIVIDUAL_BASIC, SubscriptionType.FREE] and \
       not user.school_id:
        # Calculate account age
        created_at = user.created_at
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            except ValueError:
                pass # Keep as is if parsing fails
        
        # Ensure we have a datetime object
        if created_at:
            # If it's naive, assume UTC
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=None) # simplified for comparison
            
            now = datetime.utcnow()
            age = now - created_at
            
            # 30 days trial
            if age.days > 30:
                # Strict block for expired trial users
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Your 30-day free trial has expired. Please upgrade to continue accessing the system."
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

def get_current_super_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to verify the user is a Super Admin."""
    # Allow if role is SUPER_ADMIN OR if legacy is_admin flag is True
    if current_user.role == UserRole.SUPER_ADMIN:
        return current_user
        
    if current_user.is_admin:
        return current_user

    raise HTTPException(
        status_code=403,
        detail="Super Admin access required"
    )

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to verify the user is an Admin (Super Admin or School Admin)."""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return current_user

def ensure_user_terms(db: Session, user: User) -> List[Term]:
    """
    Get terms for a user. Now uses SystemTerms as the source of truth.
    Legacy user-specific terms are deprecated.
    
    Priority:
    1. SystemTerms (global, managed by Super Admin)
    2. Legacy user terms (for backward compatibility during migration)
    3. Auto-generated defaults (only if nothing else exists)
    """
    current_year = datetime.now().year
    
    # First, try to get system terms for current year
    system_terms = db.query(SystemTerm).filter(
        SystemTerm.year == current_year
    ).order_by(SystemTerm.term_number).all()
    
    # If no terms for current year, try next year (useful at year end)
    if not system_terms:
        system_terms = db.query(SystemTerm).filter(
            SystemTerm.year == current_year + 1
        ).order_by(SystemTerm.term_number).all()
    
    # If still no system terms, try previous year (for year transition)
    if not system_terms:
        system_terms = db.query(SystemTerm).filter(
            SystemTerm.year == current_year - 1
        ).order_by(SystemTerm.term_number).all()
    
    # Convert SystemTerm to Term-like objects for backward compatibility
    if system_terms:
        # Create Term-like objects from SystemTerm
        result = []
        for st in system_terms:
            # Create a pseudo-Term object that matches the old interface
            term = Term(
                id=st.id,
                user_id=user.id,  # Associate with user for compatibility
                term_number=st.term_number,
                term_name=st.term_name,
                academic_year=str(st.year),
                start_date=st.start_date,
                end_date=st.end_date,
                teaching_weeks=st.teaching_weeks,
                is_current=st.is_current
            )
            # Don't add to session - these are read-only views
            result.append(term)
        
        # Ensure at least one is marked as current
        has_current = any(t.is_current for t in result)
        if not has_current and result:
            # Find the term that matches current date
            today = datetime.now()
            for t in result:
                if t.start_date <= today <= t.end_date:
                    t.is_current = True
                    break
            else:
                # If no term matches current date, mark first as current
                result[0].is_current = True
        
        return result
    
    # Fallback: Check for legacy user-specific terms
    legacy_terms = db.query(Term).filter(Term.user_id == user.id).order_by(Term.term_number).all()
    if legacy_terms:
        has_current = any(term.is_current for term in legacy_terms)
        if not has_current and legacy_terms:
            legacy_terms[0].is_current = True
            db.commit()
        return legacy_terms
    
    # Last resort: Create default terms for current year
    # This should rarely happen if Super Admin has set up system terms
    default_definitions = [
        {
            "term_number": 1,
            "term_name": "Term 1",
            "start_date": datetime(current_year, 1, 6, 0, 0, 0),
            "end_date": datetime(current_year, 4, 4, 23, 59, 59),
            "teaching_weeks": 13,
            "is_current": False,
        },
        {
            "term_number": 2,
            "term_name": "Term 2",
            "start_date": datetime(current_year, 4, 28, 0, 0, 0),
            "end_date": datetime(current_year, 8, 1, 23, 59, 59),
            "teaching_weeks": 14,
            "is_current": False,
        },
        {
            "term_number": 3,
            "term_name": "Term 3",
            "start_date": datetime(current_year, 8, 25, 0, 0, 0),
            "end_date": datetime(current_year, 10, 24, 23, 59, 59),
            "teaching_weeks": 9,
            "is_current": False,
        },
    ]
    
    # Determine current term based on date
    today = datetime.now()
    for definition in default_definitions:
        if definition["start_date"] <= today <= definition["end_date"]:
            definition["is_current"] = True
            break
    else:
        # Default to first term if we're between terms
        default_definitions[0]["is_current"] = True

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
    
    normalized_level = education_level.strip() if education_level else None
    if normalized_level in {"", "all", "general"}:
        normalized_level = None

    # 1. Check for School-Wide Schedule if user is in a school
    if user.school_id:
        school_query = db.query(SchoolSchedule).filter(
            SchoolSchedule.school_id == user.school_id,
            SchoolSchedule.is_active == True
        )
        
        schedule = None
        if normalized_level:
            schedule = school_query.filter(SchoolSchedule.education_level == normalized_level).first()
            
        if not schedule:
             schedule = school_query.filter(
                or_(SchoolSchedule.education_level == None, SchoolSchedule.education_level == "")
            ).first()
            
        if not schedule:
            schedule = school_query.order_by(SchoolSchedule.created_at.desc()).first()
            
        if schedule:
            return schedule

    # 2. Fallback to User-Specific Schedule
    base_query = db.query(SchoolSchedule).filter(
        SchoolSchedule.user_id == user.id,
        SchoolSchedule.is_active == True
    )

    schedule = None
    if normalized_level:
        schedule = base_query.filter(SchoolSchedule.education_level == normalized_level).first()

    if not schedule:
        schedule = base_query.filter(
            or_(SchoolSchedule.education_level == None, SchoolSchedule.education_level == "")
        ).first()

    if not schedule:
        # Try to find ANY schedule for the user if we can't find one for the specific level
        # This is a "soft" fallback to ensure the UI always has something to show
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

def get_user_school_context(user: User, db: Session) -> Optional[dict]:
    """
    Get school context for a user - either from SchoolSettings or TeacherProfile.
    Returns a dict with standardized fields for use in document generation.
    
    Logic:
    - If user has school_id (linked to a school) → Use SchoolSettings
    - If user has NO school_id (independent) → Use TeacherProfile
    """
    if user.school_id:
        settings = db.query(SchoolSettings).filter(SchoolSettings.school_id == user.school_id).first()
        if settings:
            return {
                "school_name": settings.school_name,
                "name": settings.school_name,
                "motto": settings.school_motto,
                "address": settings.school_address,
                "logo_url": settings.logo_url,
                "phone": settings.school_phone,
                "email": settings.school_email,
                "website": settings.school_website,
                "head_teacher": settings.head_teacher_name,
                "type": "school"
            }
    
    # Individual teacher - use TeacherProfile
    profile = db.query(TeacherProfile).filter(TeacherProfile.user_id == user.id).first()
    if profile:
        return {
            "school_name": profile.school_name or f"{user.full_name}'s School",
            "name": profile.school_name or f"{user.full_name}'s School",
            "motto": profile.school_motto,
            "address": profile.school_address,
            "logo_url": profile.school_logo_url,
            "phone": profile.school_phone,
            "email": user.email,
            "website": None,
            "head_teacher": profile.tsc_number, # Use TSC as identifier if needed
            "type": "individual"
        }
    
    return None

def get_default_lesson_config(user: User, db: Session) -> dict:
    """Get default lesson configuration for a user from their TeacherProfile."""
    
    # Check TeacherProfile
    profile = db.query(TeacherProfile).filter(
        TeacherProfile.user_id == user.id
    ).first()
    
    if profile:
        return {
            "lessons_per_week": profile.lessons_per_week or 5,
            "lesson_duration": profile.lesson_duration or 40,
            "double_lesson_duration": 80, # Default assumption
            "double_lessons_per_week": 0,
            "term_weeks": 13
        }
    
    # Return system defaults
    return {
        "lessons_per_week": 5,
        "lesson_duration": 40,
        "double_lesson_duration": 80,
        "double_lessons_per_week": 0,
        "term_weeks": 13
    }
