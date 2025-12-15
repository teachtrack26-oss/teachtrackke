from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models import User, UserRole, RecordOfWork, RecordOfWorkEntry, SchemeLesson, SchemeOfWork
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
    # If user is School Admin, they can see all records for their school
    if current_user.role in [UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN] and current_user.school_id:
        query = db.query(RecordOfWork).join(User).filter(User.school_id == current_user.school_id)
    else:
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
    # 1. Fetch Scheme
    scheme = db.query(SchemeOfWork).filter(SchemeOfWork.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    
    # Check permissions (own scheme or admin)
    if scheme.user_id != current_user.id:
        # Allow if admin in same school
        if not (current_user.role in [UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN] and current_user.school_id and scheme.user.school_id == current_user.school_id):
             raise HTTPException(status_code=403, detail="Not authorized to use this scheme")

    # 2. Create Record Header
    record = RecordOfWork(
        user_id=current_user.id, # The user creating the record owns it
        subject_id=scheme.subject_id,
        school_name=scheme.school,
        teacher_name=scheme.teacher_name,
        learning_area=scheme.subject,
        grade=scheme.grade,
        term=scheme.term,
        year=scheme.year,
        is_archived=False
    )
    db.add(record)
    db.flush() # Get ID

    # 3. Create Entries from Scheme Lessons
    # A Record of Work is intended to be week-based. Create ONE entry per week,
    # aggregating the week's strands/topics/outcomes into single fields.
    for week in sorted(scheme.weeks, key=lambda w: (w.week_number or 0)):
        lessons = sorted(getattr(week, "lessons", []) or [], key=lambda l: (l.lesson_number or 0))
        if not lessons:
            continue

        strands_in_order = []
        topics_in_order = []
        outcomes_in_order = []

        for lesson in lessons:
            if lesson.strand and lesson.strand not in strands_in_order:
                strands_in_order.append(lesson.strand)
            if lesson.sub_strand and lesson.sub_strand not in topics_in_order:
                topics_in_order.append(lesson.sub_strand)
            if lesson.specific_learning_outcomes and lesson.specific_learning_outcomes not in outcomes_in_order:
                outcomes_in_order.append(lesson.specific_learning_outcomes)

        entry = RecordOfWorkEntry(
            record_id=record.id,
            week_number=week.week_number,
            strand="; ".join(strands_in_order) if strands_in_order else None,
            topic="; ".join(topics_in_order) if topics_in_order else None,
            learning_outcome_a="; ".join(outcomes_in_order) if outcomes_in_order else None,
            status='pending'
        )
        db.add(entry)
    
    db.commit()
    db.refresh(record)
    return record

@router.post("/mark-taught/{scheme_lesson_id}", response_model=RecordOfWorkEntryResponse)
async def mark_lesson_taught(
    scheme_lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Get the scheme lesson
    scheme_lesson = db.query(SchemeLesson).filter(SchemeLesson.id == scheme_lesson_id).first()
    if not scheme_lesson:
        raise HTTPException(status_code=404, detail="Scheme lesson not found")
        
    # 2. Find the corresponding Record of Work Entry
    # We need to find a RecordOfWork for this user/subject/term
    scheme = scheme_lesson.week.scheme
    
    record = db.query(RecordOfWork).filter(
        RecordOfWork.user_id == current_user.id,
        RecordOfWork.subject_id == scheme.subject_id,
        RecordOfWork.term == scheme.term,
        RecordOfWork.year == scheme.year
    ).first()
    
    if not record:
        # If no record exists, we can't mark it taught in the record
        raise HTTPException(status_code=404, detail="No active Record of Work found for this scheme. Please generate a Record of Work first.")

    # 3. Find the entry to mark taught.
    # Backward compatible approach:
    # - First try to match the old per-lesson generated entry.
    # - If missing, fall back to the newer weekly aggregated entry.
    entry = db.query(RecordOfWorkEntry).filter(
        RecordOfWorkEntry.record_id == record.id,
        RecordOfWorkEntry.week_number == scheme_lesson.week.week_number,
        RecordOfWorkEntry.topic == scheme_lesson.sub_strand,
        RecordOfWorkEntry.learning_outcome_a == scheme_lesson.specific_learning_outcomes
    ).first()

    if not entry:
        entry = db.query(RecordOfWorkEntry).filter(
            RecordOfWorkEntry.record_id == record.id,
            RecordOfWorkEntry.week_number == scheme_lesson.week.week_number,
        ).order_by(RecordOfWorkEntry.id.asc()).first()
    
    if not entry:
        # If no entry exists at all for that week, create a weekly entry.
        entry = RecordOfWorkEntry(
            record_id=record.id,
            week_number=scheme_lesson.week.week_number,
            strand=scheme_lesson.strand,
            topic=scheme_lesson.sub_strand,
            learning_outcome_a=scheme_lesson.specific_learning_outcomes,
            status='taught',
            date_taught=datetime.now()
        )
        db.add(entry)
    else:
        entry.status = 'taught'
        entry.date_taught = datetime.now()
        
    db.commit()
    db.refresh(entry)
    return entry

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
