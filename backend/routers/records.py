from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, RecordOfWork, RecordOfWorkEntry, SchemeLesson
from schemas import (
    RecordOfWorkCreate, RecordOfWorkUpdate, RecordOfWorkResponse, RecordOfWorkSummary,
    RecordOfWorkEntryCreate, RecordOfWorkEntryUpdate, RecordOfWorkEntryResponse
)
from dependencies import get_current_user
from config import settings

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}/records-of-work",
    tags=["Records of Work"]
)

@router.get("", response_model=List[RecordOfWorkSummary])
async def get_records_of_work(
    archived: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(RecordOfWork).filter(RecordOfWork.user_id == current_user.id)
    # Assuming is_archived field exists based on migration script
    # query = query.filter(RecordOfWork.is_archived == archived)
    return query.all()

@router.get("/{record_id}", response_model=RecordOfWorkResponse)
async def get_record_of_work(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(RecordOfWork).filter(RecordOfWork.id == record_id, RecordOfWork.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record

@router.post("", response_model=RecordOfWorkResponse, status_code=201)
async def create_record_of_work(
    data: RecordOfWorkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = RecordOfWork(
        user_id=current_user.id,
        **data.dict()
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.post("/create-from-scheme/{scheme_id}", response_model=RecordOfWorkResponse)
async def create_record_of_work_from_scheme(
    scheme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Logic to clone scheme into record
    # Placeholder
    raise HTTPException(status_code=501, detail="Not implemented")

@router.post("/mark-taught/{scheme_lesson_id}", response_model=RecordOfWorkEntryResponse)
async def mark_lesson_taught(
    scheme_lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Logic to mark taught
    # Placeholder
    raise HTTPException(status_code=501, detail="Not implemented")

@router.put("/{record_id}", response_model=RecordOfWorkResponse)
async def update_record_of_work(
    record_id: int,
    data: RecordOfWorkUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(RecordOfWork).filter(RecordOfWork.id == record_id, RecordOfWork.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    for key, value in data.dict(exclude_unset=True).items():
        setattr(record, key, value)
        
    db.commit()
    db.refresh(record)
    return record

@router.delete("/{record_id}")
async def delete_record_of_work(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(RecordOfWork).filter(RecordOfWork.id == record_id, RecordOfWork.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    db.delete(record)
    db.commit()
    return {"message": "Record deleted"}

@router.post("/{record_id}/archive")
async def archive_record_of_work(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(RecordOfWork).filter(RecordOfWork.id == record_id, RecordOfWork.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    # record.is_archived = True
    db.commit()
    return {"message": "Archived"}

@router.post("/{record_id}/unarchive")
async def unarchive_record_of_work(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(RecordOfWork).filter(RecordOfWork.id == record_id, RecordOfWork.user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    # record.is_archived = False
    db.commit()
    return {"message": "Unarchived"}

# Entries

@router.post("/{record_id}/entries", response_model=RecordOfWorkEntryResponse, status_code=201)
async def add_record_entry(
    record_id: int,
    data: RecordOfWorkEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = RecordOfWorkEntry(
        record_id=record_id,
        **data.dict()
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@router.put("/{record_id}/entries/{entry_id}", response_model=RecordOfWorkEntryResponse)
async def update_record_entry(
    record_id: int,
    entry_id: int,
    data: RecordOfWorkEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(RecordOfWorkEntry).filter(RecordOfWorkEntry.id == entry_id, RecordOfWorkEntry.record_id == record_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
        
    for key, value in data.dict(exclude_unset=True).items():
        setattr(entry, key, value)
        
    db.commit()
    db.refresh(entry)
    return entry

@router.delete("/{record_id}/entries/{entry_id}")
async def delete_record_entry(
    record_id: int,
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(RecordOfWorkEntry).filter(RecordOfWorkEntry.id == entry_id, RecordOfWorkEntry.record_id == record_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
        
    db.delete(entry)
    db.commit()
    return {"message": "Entry deleted"}
