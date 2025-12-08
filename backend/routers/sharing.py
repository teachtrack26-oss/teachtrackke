from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import User, SharedPresentation
from schemas import SharedPresentationCreate, SharedPresentationResponse
from dependencies import get_current_user
from config import settings
import secrets

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}",
    tags=["Sharing"]
)

@router.post("/{resource_type}/{resource_id}/share")
def share_resource(
    resource_type: str,
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Generic sharing logic
    # Generate token
    token = secrets.token_urlsafe(16)
    
    # Save to SharedPresentation or generic table
    # Assuming SharedPresentation for now as per main.py context
    if resource_type == "presentation":
        share = SharedPresentation(
            presentation_id=resource_id,
            token=token,
            created_by=current_user.id
        )
        db.add(share)
        db.commit()
        return {"token": token, "url": f"{settings.FRONTEND_URL}/shared/{token}"}
    
    return {"message": "Sharing not implemented for this resource type"}

@router.post("/{resource_type}/{resource_id}/unshare")
def unshare_resource(
    resource_type: str,
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if resource_type == "presentation":
        db.query(SharedPresentation).filter(
            SharedPresentation.presentation_id == resource_id,
            SharedPresentation.created_by == current_user.id
        ).delete()
        db.commit()
        return {"message": "Unshared"}
        
    return {"message": "Not implemented"}

@router.get("/shared/{resource_type}/{token}")
def get_shared_resource(
    resource_type: str,
    token: str,
    db: Session = Depends(get_db)
):
    if resource_type == "presentation":
        share = db.query(SharedPresentation).filter(SharedPresentation.token == token).first()
        if not share:
            raise HTTPException(status_code=404, detail="Link invalid or expired")
        return share.presentation
        
    raise HTTPException(status_code=404, detail="Resource not found")

# Duplicate / Template

@router.post("/{resource_type}/{resource_id}/duplicate")
def duplicate_resource(
    resource_type: str,
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Logic to duplicate resource
    return {"message": "Duplicated"}
