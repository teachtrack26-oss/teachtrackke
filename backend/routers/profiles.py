from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import User, TeacherProfile
from schemas import TeacherProfileCreate, TeacherProfileResponse, TeacherProfileLogoResponse
from dependencies import get_current_user, get_user_school_context, get_default_lesson_config
from config import settings
from cloudinary_storage import upload_file_to_cloudinary

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}/profile",
    tags=["Teacher Profile"]
)

@router.get("/settings", response_model=TeacherProfileResponse)
def get_teacher_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(TeacherProfile).filter(TeacherProfile.user_id == current_user.id).first()
    if not profile:
        # Create default profile if none exists
        profile = TeacherProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
    return profile

@router.post("/settings", response_model=TeacherProfileResponse)
def create_or_update_teacher_profile(
    profile_data: TeacherProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(TeacherProfile).filter(TeacherProfile.user_id == current_user.id).first()
    
    if profile:
        # Prevent School Name changes to avoid misuse (generating for multiple schools)
        if profile.school_name and profile_data.school_name and profile.school_name != profile_data.school_name:
             raise HTTPException(
                status_code=403, 
                detail="School Name cannot be changed once set. This is to prevent account sharing. Please contact support if you have moved schools."
            )

        # Update existing
        for key, value in profile_data.dict(exclude_unset=True).items():
            setattr(profile, key, value)
    else:
        # Create new
        profile = TeacherProfile(
            user_id=current_user.id,
            **profile_data.dict()
        )
        db.add(profile)
    
    db.commit()
    db.refresh(profile)
    return profile

@router.post("/upload-logo", response_model=TeacherProfileLogoResponse)
async def upload_profile_logo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Upload to Cloudinary
    try:
        result = await upload_file_to_cloudinary(file, folder="profile_logos")
        logo_url = result.get("secure_url")
        
        # Update profile
        profile = db.query(TeacherProfile).filter(TeacherProfile.user_id == current_user.id).first()
        if not profile:
            profile = TeacherProfile(user_id=current_user.id)
            db.add(profile)
        
        profile.logo_url = logo_url
        db.commit()
        
        return TeacherProfileLogoResponse(logo_url=logo_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.delete("/logo")
def delete_profile_logo(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(TeacherProfile).filter(TeacherProfile.user_id == current_user.id).first()
    if profile and profile.logo_url:
        profile.logo_url = None
        db.commit()
    return {"message": "Logo removed"}

@router.get("/school-context")
def get_school_context(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    context = get_user_school_context(current_user, db)
    if not context:
        return {"type": "none"}
    return context

@router.get("/lesson-defaults")
def get_lesson_defaults(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_default_lesson_config(current_user, db)

@router.get("/lessons-config")
def get_teacher_lessons_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(TeacherProfile).filter(TeacherProfile.user_id == current_user.id).first()
    if not profile:
        return {
            "lessons_per_week": 5,
            "lesson_duration": 40
        }
    return {
        "lessons_per_week": profile.lessons_per_week or 5,
        "lesson_duration": profile.lesson_duration or 40
    }

@router.post("/lessons-config")
def save_teacher_lesson_config(
    config_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(TeacherProfile).filter(TeacherProfile.user_id == current_user.id).first()
    if not profile:
        profile = TeacherProfile(user_id=current_user.id)
        db.add(profile)
    
    if "lessons_per_week" in config_data:
        profile.lessons_per_week = config_data["lessons_per_week"]
    if "lesson_duration" in config_data:
        profile.lesson_duration = config_data["lesson_duration"]
        
    db.commit()
    return {"message": "Configuration saved"}
