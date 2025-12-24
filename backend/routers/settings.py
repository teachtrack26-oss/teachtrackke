from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import User, Term, SchoolSettings, SystemSetting, SystemTerm, UserTermAdjustment, UserRole
from schemas import UserSettingsResponse, UserSettingsUpdate, TermsResponse, TermResponse, TermUpdate
from dependencies import get_current_user, ensure_user_terms
from config import settings
from datetime import datetime, timedelta

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}",
    tags=["Settings"]
)


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

# User Settings

@router.get("/user/settings", response_model=UserSettingsResponse)
def get_user_settings(current_user: User = Depends(get_current_user)):
    # Return user preferences
    # Assuming User model has these fields or we map them
    return UserSettingsResponse(
        theme="light", # Placeholder
        notifications_enabled=True
    )

@router.put("/user/settings", response_model=UserSettingsResponse)
def update_user_settings(
    settings_update: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Update logic
    return UserSettingsResponse(
        theme="light",
        notifications_enabled=True
    )

# User Terms

@router.get("/terms", response_model=TermsResponse)
def list_user_terms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    terms = ensure_user_terms(db, current_user)
    return TermsResponse(terms=terms)

@router.put("/terms/{term_id}", response_model=TermResponse)
def update_user_term(
    term_id: int,
    term_update: TermUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    term = db.query(Term).filter(Term.id == term_id, Term.user_id == current_user.id).first()
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
        
    for key, value in term_update.dict(exclude_unset=True).items():
        setattr(term, key, value)
        
    # If setting as current, unset others
    if term_update.is_current:
        db.query(Term).filter(Term.user_id == current_user.id, Term.id != term_id).update({"is_current": False})
        
    db.commit()
    db.refresh(term)
    return term

# School Settings (Public/Teacher View)

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SchoolTermInput(BaseModel):
    term_number: int
    year: int
    start_date: str
    end_date: str
    mid_term_break_start: Optional[str] = None
    mid_term_break_end: Optional[str] = None
    term_name: Optional[str] = None

@router.get("/school-settings")
def get_school_settings_public(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.school_id:
        return db.query(SchoolSettings).filter(SchoolSettings.school_id == current_user.school_id).first()
    return None


def get_system_terms_for_user(db: Session, year: int = None) -> list:
    """
    Fetch system-wide terms. If year is not specified, get terms for current year.
    Returns terms in frontend-expected format.
    """
    if year is None:
        year = datetime.now().year
    
    # First try to get terms for the requested year
    terms = db.query(SystemTerm).filter(SystemTerm.year == year).order_by(SystemTerm.term_number).all()
    
    # If no terms for this year, try previous year (for year transition periods)
    if not terms:
        terms = db.query(SystemTerm).filter(SystemTerm.year == year - 1).order_by(SystemTerm.term_number).all()
    
    # If still no terms, return empty list - Super Admin needs to create them
    if not terms:
        return []
    
    response = []
    for t in terms:
        response.append({
            "id": t.id,
            "term_number": t.term_number,
            "term_name": t.term_name,
            "year": t.year,
            "start_date": t.start_date.isoformat() if t.start_date else None,
            "end_date": t.end_date.isoformat() if t.end_date else None,
            "teaching_weeks": t.teaching_weeks,
            "mid_term_break_start": t.mid_term_break_start.isoformat() if t.mid_term_break_start else None,
            "mid_term_break_end": t.mid_term_break_end.isoformat() if t.mid_term_break_end else None,
            "is_current": t.is_current,
            "is_system_term": True  # Flag to indicate this is read-only
        })
    return response


def get_current_system_term(db: Session) -> dict:
    """Get the current active system term based on is_current flag or date."""
    # First try to get the explicitly marked current term
    current = db.query(SystemTerm).filter(SystemTerm.is_current == True).first()
    
    if not current:
        # Fallback: find term by current date
        today = datetime.now()
        current = db.query(SystemTerm).filter(
            SystemTerm.start_date <= today,
            SystemTerm.end_date >= today
        ).first()
    
    if not current:
        # Final fallback: get most recent term
        current = db.query(SystemTerm).order_by(
            SystemTerm.year.desc(), 
            SystemTerm.term_number.desc()
        ).first()
    
    if current:
        return {
            "id": current.id,
            "term_number": current.term_number,
            "term_name": current.term_name,
            "year": current.year,
            "start_date": current.start_date.isoformat() if current.start_date else None,
            "end_date": current.end_date.isoformat() if current.end_date else None,
            "teaching_weeks": current.teaching_weeks,
            "is_current": True
        }
    return None


@router.get("/school-terms")
def get_school_terms_public(
    year: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get terms for scheme generation. 
    - Returns SYSTEM TERMS (managed by Super Admin) for all users.
    - Terms are READ-ONLY for teachers.
    - School Admins can override with school-specific terms (future feature).
    """
    # Always return system terms - these are the official academic calendar
    terms = get_system_terms_for_user(db, year)
    
    if not terms:
        # No system terms exist - return helpful message
        # In production, Super Admin should have created these
        return []
    
    return terms


@router.get("/school-terms/current")
def get_current_term_public(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the current active term."""
    current = get_current_system_term(db)
    if not current:
        raise HTTPException(
            status_code=404, 
            detail="No current term set. Contact administrator to configure academic terms."
        )
    return current


# Legacy endpoints - kept for backward compatibility but now read-only for teachers

@router.post("/school-terms")
def create_school_term_public(
    term_data: SchoolTermInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    DEPRECATED: Teachers can no longer create terms.
    Terms are managed by Super Admin via /admin/system-terms endpoints.
    """
    # Only allow Super Admin or School Admin to create terms
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Term creation is restricted. Terms are managed by administrators. Contact your school admin or system administrator."
        )
    
    # For School Admin - create a school-specific term (future feature)
    # For now, redirect to admin endpoints
    raise HTTPException(
        status_code=400,
        detail="Please use the admin dashboard to manage terms. Go to Admin > Academic Calendar."
    )


@router.put("/school-terms/{term_id}")
def update_school_term_public(
    term_id: int,
    term_data: SchoolTermInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    DEPRECATED: Teachers can no longer update terms.
    Terms are managed by Super Admin via /admin/system-terms endpoints.
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Term modification is restricted. Terms are managed by administrators."
        )
    
    raise HTTPException(
        status_code=400,
        detail="Please use the admin dashboard to manage terms. Go to Admin > Academic Calendar."
    )


@router.delete("/school-terms/{term_id}")
def delete_school_term_public(
    term_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    DEPRECATED: Teachers can no longer delete terms.
    Terms are managed by Super Admin via /admin/system-terms endpoints.
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Term deletion is restricted. Terms are managed by administrators."
        )
    
    raise HTTPException(
        status_code=400,
        detail="Please use the admin dashboard to manage terms. Go to Admin > Academic Calendar."
    )


@router.get("/pricing-config")
def get_pricing_config(db: Session = Depends(get_db)):
    """Public pricing configuration used by the /pricing page.

    Returns defaults if config is missing or the table isn't present.
    """
    try:
        row = db.query(SystemSetting).filter(SystemSetting.key == "pricing_config").first()
        if row and isinstance(row.value, dict):
            return row.value
    except Exception:
        # If the table doesn't exist yet (migration not applied), fail soft.
        pass
    return DEFAULT_PRICING_CONFIG


# =============================================================================
# TERM ADJUSTMENTS - Allows schools/teachers to have slight date variations
# =============================================================================

class TermAdjustmentInput(BaseModel):
    system_term_id: int
    adjusted_start_date: str  # ISO format date
    adjusted_end_date: str
    adjustment_reason: Optional[str] = None

class TermAdjustmentResponse(BaseModel):
    id: int
    system_term_id: int
    system_term_name: str
    system_term_year: int
    system_start_date: str
    system_end_date: str
    adjusted_start_date: str
    adjusted_end_date: str
    adjusted_teaching_weeks: Optional[int]
    adjustment_reason: Optional[str]
    is_active: bool
    
    class Config:
        from_attributes = True


def calculate_teaching_weeks(start_date: datetime, end_date: datetime) -> int:
    """Calculate the number of teaching weeks between two dates."""
    delta = end_date - start_date
    return max(1, delta.days // 7)


@router.get("/term-adjustments")
def get_my_term_adjustments(
    year: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get term adjustments for the current user or their school.
    Returns both system terms and any adjustments.
    """
    if year is None:
        year = datetime.now().year
    
    # Get system terms for the year
    system_terms = db.query(SystemTerm).filter(SystemTerm.year == year).order_by(SystemTerm.term_number).all()
    
    # Get adjustments for this user or their school
    adjustments = []
    if current_user.school_id:
        adjustments = db.query(UserTermAdjustment).join(SystemTerm).filter(
            UserTermAdjustment.school_id == current_user.school_id,
            SystemTerm.year == year
        ).all()
    else:
        adjustments = db.query(UserTermAdjustment).join(SystemTerm).filter(
            UserTermAdjustment.user_id == current_user.id,
            SystemTerm.year == year
        ).all()
    
    # Create a lookup for adjustments by system_term_id
    adjustment_map = {adj.system_term_id: adj for adj in adjustments}
    
    result = []
    for term in system_terms:
        adj = adjustment_map.get(term.id)
        term_data = {
            "id": term.id,
            "term_number": term.term_number,
            "term_name": term.term_name,
            "year": term.year,
            "system_start_date": term.start_date.isoformat() if term.start_date else None,
            "system_end_date": term.end_date.isoformat() if term.end_date else None,
            "teaching_weeks": term.teaching_weeks,
            "mid_term_break_start": term.mid_term_break_start.isoformat() if term.mid_term_break_start else None,
            "mid_term_break_end": term.mid_term_break_end.isoformat() if term.mid_term_break_end else None,
            "is_current": term.is_current,
            "has_adjustment": adj is not None,
        }
        
        # If there's an adjustment, include the adjusted dates
        if adj:
            term_data["adjustment"] = {
                "id": adj.id,
                "adjusted_start_date": adj.adjusted_start_date.isoformat() if adj.adjusted_start_date else None,
                "adjusted_end_date": adj.adjusted_end_date.isoformat() if adj.adjusted_end_date else None,
                "adjusted_teaching_weeks": adj.adjusted_teaching_weeks,
                "adjustment_reason": adj.adjustment_reason,
                "is_active": adj.is_active,
            }
            # Use adjusted dates as effective dates
            term_data["effective_start_date"] = adj.adjusted_start_date.isoformat() if adj.adjusted_start_date else term_data["system_start_date"]
            term_data["effective_end_date"] = adj.adjusted_end_date.isoformat() if adj.adjusted_end_date else term_data["system_end_date"]
        else:
            # No adjustment - use system dates
            term_data["effective_start_date"] = term_data["system_start_date"]
            term_data["effective_end_date"] = term_data["system_end_date"]
        
        result.append(term_data)
    
    return result


@router.post("/term-adjustments")
def create_term_adjustment(
    adjustment_data: TermAdjustmentInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or update a term date adjustment for your school or individual account.
    This allows schools/teachers to have slightly different opening/closing dates
    while still following the official academic calendar.
    
    Only School Admins can create adjustments for their school.
    Independent teachers (not in a school) can create personal adjustments.
    Teachers IN a school should contact their School Admin.
    """
    # Verify the system term exists
    system_term = db.query(SystemTerm).filter(SystemTerm.id == adjustment_data.system_term_id).first()
    if not system_term:
        raise HTTPException(status_code=404, detail="System term not found")
    
    # Parse dates
    try:
        adjusted_start = datetime.fromisoformat(adjustment_data.adjusted_start_date.replace('Z', '+00:00'))
        adjusted_end = datetime.fromisoformat(adjustment_data.adjusted_end_date.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format (YYYY-MM-DD)")
    
    # Validate the adjustment isn't too far from system dates (max 7 days difference)
    system_start = system_term.start_date
    system_end = system_term.end_date
    
    max_adjustment_days = 7
    if abs((adjusted_start - system_start).days) > max_adjustment_days:
        raise HTTPException(
            status_code=400, 
            detail=f"Start date adjustment cannot differ by more than {max_adjustment_days} days from official date ({system_start.strftime('%Y-%m-%d')})"
        )
    
    if abs((adjusted_end - system_end).days) > max_adjustment_days:
        raise HTTPException(
            status_code=400, 
            detail=f"End date adjustment cannot differ by more than {max_adjustment_days} days from official date ({system_end.strftime('%Y-%m-%d')})"
        )
    
    # Calculate teaching weeks
    teaching_weeks = calculate_teaching_weeks(adjusted_start, adjusted_end)
    
    # Determine who can create this adjustment
    school_id = None
    user_id = None
    
    if current_user.school_id:
        # User is in a school
        if current_user.role in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN]:
            # School Admin creates adjustment for the school
            school_id = current_user.school_id
        else:
            # Regular teachers in a school cannot create adjustments
            raise HTTPException(
                status_code=403,
                detail="Only School Admins can adjust term dates for the school. Contact your School Admin."
            )
    else:
        # Independent teacher - create personal adjustment
        user_id = current_user.id
    
    # Check if adjustment already exists
    existing = None
    if school_id:
        existing = db.query(UserTermAdjustment).filter(
            UserTermAdjustment.school_id == school_id,
            UserTermAdjustment.system_term_id == system_term.id
        ).first()
    else:
        existing = db.query(UserTermAdjustment).filter(
            UserTermAdjustment.user_id == user_id,
            UserTermAdjustment.system_term_id == system_term.id
        ).first()
    
    if existing:
        # Update existing adjustment
        existing.adjusted_start_date = adjusted_start
        existing.adjusted_end_date = adjusted_end
        existing.adjusted_teaching_weeks = teaching_weeks
        existing.adjustment_reason = adjustment_data.adjustment_reason
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        
        return {
            "message": "Term adjustment updated successfully",
            "adjustment": {
                "id": existing.id,
                "system_term_id": existing.system_term_id,
                "adjusted_start_date": existing.adjusted_start_date.isoformat(),
                "adjusted_end_date": existing.adjusted_end_date.isoformat(),
                "adjusted_teaching_weeks": existing.adjusted_teaching_weeks,
                "adjustment_reason": existing.adjustment_reason
            }
        }
    
    # Create new adjustment
    new_adjustment = UserTermAdjustment(
        system_term_id=system_term.id,
        school_id=school_id,
        user_id=user_id,
        adjusted_start_date=adjusted_start,
        adjusted_end_date=adjusted_end,
        adjusted_teaching_weeks=teaching_weeks,
        adjustment_reason=adjustment_data.adjustment_reason,
        is_active=True
    )
    
    db.add(new_adjustment)
    db.commit()
    db.refresh(new_adjustment)
    
    return {
        "message": "Term adjustment created successfully",
        "adjustment": {
            "id": new_adjustment.id,
            "system_term_id": new_adjustment.system_term_id,
            "adjusted_start_date": new_adjustment.adjusted_start_date.isoformat(),
            "adjusted_end_date": new_adjustment.adjusted_end_date.isoformat(),
            "adjusted_teaching_weeks": new_adjustment.adjusted_teaching_weeks,
            "adjustment_reason": new_adjustment.adjustment_reason
        }
    }


@router.delete("/term-adjustments/{adjustment_id}")
def delete_term_adjustment(
    adjustment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a term adjustment, reverting to system dates.
    """
    adjustment = db.query(UserTermAdjustment).filter(UserTermAdjustment.id == adjustment_id).first()
    
    if not adjustment:
        raise HTTPException(status_code=404, detail="Adjustment not found")
    
    # Verify ownership
    if adjustment.school_id:
        if current_user.school_id != adjustment.school_id or current_user.role not in [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN]:
            raise HTTPException(status_code=403, detail="Not authorized to delete this adjustment")
    else:
        if adjustment.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this adjustment")
    
    db.delete(adjustment)
    db.commit()
    
    return {"message": "Term adjustment deleted. Term dates reverted to system defaults."}
