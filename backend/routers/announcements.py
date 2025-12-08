from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, SystemAnnouncement
from schemas import SystemAnnouncementCreate, SystemAnnouncementResponse
from dependencies import get_current_user, get_current_admin_user
from config import settings

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}",
    tags=["Announcements"]
)

@router.get("/announcements", response_model=List[SystemAnnouncementResponse])
def get_active_announcements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(SystemAnnouncement).filter(SystemAnnouncement.is_active == True).all()

@router.get("/admin/announcements", response_model=List[SystemAnnouncementResponse])
def get_all_announcements(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    return db.query(SystemAnnouncement).all()

@router.post("/admin/announcements", response_model=SystemAnnouncementResponse)
def create_announcement(
    announcement: SystemAnnouncementCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    db_announcement = SystemAnnouncement(**announcement.dict())
    db.add(db_announcement)
    db.commit()
    db.refresh(db_announcement)
    return db_announcement

@router.delete("/admin/announcements/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    announcement = db.query(SystemAnnouncement).filter(SystemAnnouncement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    db.delete(announcement)
    db.commit()
    return {"message": "Announcement deleted"}

@router.patch("/admin/announcements/{announcement_id}/toggle")
def toggle_announcement_status(
    announcement_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    announcement = db.query(SystemAnnouncement).filter(SystemAnnouncement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    announcement.is_active = not announcement.is_active
    db.commit()
    return {"message": "Status toggled", "is_active": announcement.is_active}
