from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import mimetypes
import requests

from database import get_db
from models import User, Note
from schemas import NoteCreate, NoteResponse
from dependencies import get_current_user
from config import settings
from cloudinary_storage import upload_file_to_cloudinary

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}/notes",
    tags=["Notes"]
)

@router.get("", response_model=List[NoteResponse])
def get_notes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Note).filter(Note.user_id == current_user.id).all()

@router.post("", response_model=NoteResponse)
def create_note(
    note_data: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = Note(
        user_id=current_user.id,
        **note_data.dict()
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

@router.post("/upload")
async def upload_note_file(
    file: UploadFile = File(...),
    title: str = Form(...),
    subject_id: int = Form(None),
    strand_id: int = Form(None),
    substrand_id: int = Form(None),
    lesson_id: int = Form(None),
    description: str = Form(None),
    tags: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Upload to Cloudinary
    try:
        result = await upload_file_to_cloudinary(file, folder="notes")
        file_url = result.get("secure_url")
        
        note = Note(
            user_id=current_user.id,
            title=title,
            content=description, # Using description as content/notes
            file_url=file_url,
            file_type=file.content_type,
            subject_id=subject_id,
            strand_id=strand_id,
            substrand_id=substrand_id,
            lesson_id=lesson_id,
            tags=tags
        )
        db.add(note)
        db.commit()
        db.refresh(note)
        
        return note
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.delete("/{note_id}")
def delete_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    db.delete(note)
    db.commit()
    return {"message": "Note deleted"}

@router.get("/{note_id}")
def get_note_detail(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.patch("/{note_id}/favorite")
def toggle_note_favorite(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    note.is_favorite = not note.is_favorite
    db.commit()
    return {"is_favorite": note.is_favorite}

@router.get("/{note_id}/download")
async def download_note_file(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note or not note.file_url:
        raise HTTPException(status_code=404, detail="File not found")
        
    # Proxy download or redirect
    # Redirect is simpler
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=note.file_url)
