from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Term, SchoolSettings, SystemSetting, SystemTerm, UserRole
from schemas import UserSettingsResponse, UserSettingsUpdate, TermsResponse, TermResponse, TermUpdate
from dependencies import get_current_user, ensure_user_terms
from config import settings
from datetime import datetime

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
