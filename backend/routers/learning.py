from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models import User, Lesson, ProgressLog, Subject, Strand, SubStrand
from schemas import ProgressLogCreate, ProgressLogResponse
from dependencies import get_current_user
from config import settings

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}",
    tags=["Learning"]
)

@router.post("/progress/mark-complete", response_model=ProgressLogResponse)
def mark_lesson_complete_legacy(
    progress_data: ProgressLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Legacy endpoint support
    log = ProgressLog(
        user_id=current_user.id,
        **progress_data.dict()
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

@router.post("/lessons/{lesson_id}/complete")
def mark_lesson_complete(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    # Check if already completed
    existing = db.query(ProgressLog).filter(
        ProgressLog.user_id == current_user.id,
        ProgressLog.lesson_id == lesson_id
    ).first()
    
    if not existing:
        # Use correct relationship name: substrand (not sub_strand)
        log = ProgressLog(
            user_id=current_user.id,
            lesson_id=lesson_id,
            subject_id=lesson.substrand.strand.subject_id, 
            action="COMPLETED", # Add required action field
            created_at=datetime.utcnow() # Use created_at instead of completed_at if model differs
        )
        
        # Also update the lesson itself if that's how we track it
        lesson.is_completed = True
        lesson.completed_at = datetime.utcnow()
        
        db.add(log)
        db.commit()
        
    return {"message": "Lesson marked as complete"}

@router.post("/lessons/{lesson_id}/uncomplete")
def mark_lesson_incomplete(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Remove progress log
    db.query(ProgressLog).filter(
        ProgressLog.user_id == current_user.id,
        ProgressLog.lesson_id == lesson_id
    ).delete()
    
    # Update lesson status
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if lesson:
        lesson.is_completed = False
        lesson.completed_at = None
        
    db.commit()
    return {"message": "Lesson marked as incomplete"}

@router.get("/dashboard/curriculum-progress")
def get_curriculum_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from sqlalchemy.orm import joinedload
    
    # Get user's subjects with strands and substrands
    subjects = db.query(Subject).filter(
        Subject.user_id == current_user.id
    ).options(
        joinedload(Subject.strands).joinedload(Strand.sub_strands)
    ).all()
    
    total_subjects = len(subjects)
    total_lessons_all = 0
    completed_lessons_all = 0
    subjects_data = []
    
    for subject in subjects:
        subject_total_lessons = 0
        subject_completed_lessons = 0
        strands_data = []
        
        for strand in sorted(subject.strands, key=lambda s: s.sequence_order):
            strand_total_lessons = 0
            strand_completed_lessons = 0
            substrands_data = []
            
            for substrand in sorted(strand.sub_strands, key=lambda s: s.sequence_order):
                # Get lessons for this substrand
                lessons = db.query(Lesson).filter(Lesson.substrand_id == substrand.id).all()
                substrand_total = len(lessons)
                substrand_completed = sum(1 for l in lessons if l.is_completed)
                
                strand_total_lessons += substrand_total
                strand_completed_lessons += substrand_completed
                
                substrand_progress = (substrand_completed / substrand_total * 100) if substrand_total > 0 else 0
                substrands_data.append({
                    "substrand_code": substrand.substrand_code,
                    "substrand_name": substrand.substrand_name,
                    "total_lessons": substrand_total,
                    "completed_lessons": substrand_completed,
                    "progress": round(substrand_progress, 1)
                })
            
            subject_total_lessons += strand_total_lessons
            subject_completed_lessons += strand_completed_lessons
            
            strand_progress = (strand_completed_lessons / strand_total_lessons * 100) if strand_total_lessons > 0 else 0
            strands_data.append({
                "strand_code": strand.strand_code,
                "strand_name": strand.strand_name,
                "total_lessons": strand_total_lessons,
                "completed_lessons": strand_completed_lessons,
                "progress": round(strand_progress, 1),
                "substrands": substrands_data
            })
        
        total_lessons_all += subject_total_lessons
        completed_lessons_all += subject_completed_lessons
        
        subject_progress = (subject_completed_lessons / subject_total_lessons * 100) if subject_total_lessons > 0 else 0
        subjects_data.append({
            "id": subject.id,
            "subject_name": subject.subject_name,
            "grade": subject.grade,
            "total_lessons": subject_total_lessons,
            "completed_lessons": subject_completed_lessons,
            "progress_percentage": round(subject_progress, 1),
            "strands": strands_data
        })
    
    # Get recent completions
    recent_completions = db.query(ProgressLog).filter(
        ProgressLog.user_id == current_user.id,
        ProgressLog.action == "completed"
    ).order_by(ProgressLog.created_at.desc()).limit(10).all()
    
    recent_data = []
    for log in recent_completions:
        lesson = db.query(Lesson).filter(Lesson.id == log.lesson_id).first()
        if lesson:
            subject = db.query(Subject).filter(Subject.id == log.subject_id).first()
            recent_data.append({
                "lesson_id": lesson.id,
                "lesson_title": lesson.lesson_title or f"Lesson {lesson.lesson_number}",
                "completed_at": log.created_at.isoformat() if log.created_at else None,
                "subject_name": subject.subject_name if subject else "Unknown",
                "grade": subject.grade if subject else "Unknown"
            })
    
    average_progress = (completed_lessons_all / total_lessons_all * 100) if total_lessons_all > 0 else 0
    
    return {
        "overview": {
            "total_subjects": total_subjects,
            "total_lessons": total_lessons_all,
            "completed_lessons": completed_lessons_all,
            "average_progress": round(average_progress, 1)
        },
        "subjects": subjects_data,
        "recent_completions": recent_data
    }
