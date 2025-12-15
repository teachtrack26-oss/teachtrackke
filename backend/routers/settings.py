from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Term, SchoolSettings, SystemSetting
from schemas import UserSettingsResponse, UserSettingsUpdate, TermsResponse, TermResponse, TermUpdate
from dependencies import get_current_user, ensure_user_terms
from config import settings

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

@router.get("/school-terms")
def get_school_terms_public(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Return user's terms adapted to the frontend expected format
    terms = ensure_user_terms(db, current_user)
    
    response = []
    for t in terms:
        # Handle academic_year conversion safely
        try:
            year_val = int(t.academic_year)
        except (ValueError, TypeError):
            year_val = 2025

        response.append({
            "id": t.id,
            "term_number": t.term_number,
            "term_name": t.term_name,
            "year": year_val,
            "start_date": t.start_date.isoformat() if t.start_date else None,
            "end_date": t.end_date.isoformat() if t.end_date else None,
            # mid_term_break not in Term model, returning None
            "mid_term_break_start": None,
            "mid_term_break_end": None
        })
    return response

@router.post("/school-terms")
def create_school_term_public(
    term_data: SchoolTermInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Create a new Term for the user
    try:
        start_date = datetime.fromisoformat(term_data.start_date.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(term_data.end_date.replace('Z', '+00:00'))
    except ValueError:
        # Fallback for simple date strings if isoformat fails
        start_date = datetime.strptime(term_data.start_date.split('T')[0], "%Y-%m-%d")
        end_date = datetime.strptime(term_data.end_date.split('T')[0], "%Y-%m-%d")
    
    # Calculate teaching weeks (rough approximation)
    weeks = int((end_date - start_date).days / 7)
    if weeks < 1: weeks = 1
    
    new_term = Term(
        user_id=current_user.id,
        term_number=term_data.term_number,
        term_name=term_data.term_name or f"Term {term_data.term_number}",
        academic_year=str(term_data.year),
        start_date=start_date,
        end_date=end_date,
        teaching_weeks=weeks,
        is_current=False # Default to false
    )
    db.add(new_term)
    db.commit()
    db.refresh(new_term)
    
    return {
        "id": new_term.id,
        "term_number": new_term.term_number,
        "term_name": new_term.term_name,
        "year": int(new_term.academic_year),
        "start_date": new_term.start_date.isoformat(),
        "end_date": new_term.end_date.isoformat(),
        "mid_term_break_start": None,
        "mid_term_break_end": None
    }

@router.put("/school-terms/{term_id}")
def update_school_term_public(
    term_id: int,
    term_data: SchoolTermInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    term = db.query(Term).filter(Term.id == term_id, Term.user_id == current_user.id).first()
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
        
    term.term_number = term_data.term_number
    if term_data.term_name:
        term.term_name = term_data.term_name
    term.academic_year = str(term_data.year)
    
    try:
        term.start_date = datetime.fromisoformat(term_data.start_date.replace('Z', '+00:00'))
        term.end_date = datetime.fromisoformat(term_data.end_date.replace('Z', '+00:00'))
    except ValueError:
        term.start_date = datetime.strptime(term_data.start_date.split('T')[0], "%Y-%m-%d")
        term.end_date = datetime.strptime(term_data.end_date.split('T')[0], "%Y-%m-%d")
    
    # Recalculate weeks
    weeks = int((term.end_date - term.start_date).days / 7)
    if weeks < 1: weeks = 1
    term.teaching_weeks = weeks
    
    db.commit()
    db.refresh(term)
    
    return {
        "id": term.id,
        "term_number": term.term_number,
        "term_name": term.term_name,
        "year": int(term.academic_year),
        "start_date": term.start_date.isoformat(),
        "end_date": term.end_date.isoformat(),
        "mid_term_break_start": None,
        "mid_term_break_end": None
    }

@router.delete("/school-terms/{term_id}")
def delete_school_term_public(
    term_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    term = db.query(Term).filter(Term.id == term_id, Term.user_id == current_user.id).first()
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
        
    db.delete(term)
    db.commit()
    return {"message": "Term deleted"}


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
