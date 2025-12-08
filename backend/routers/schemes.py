from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, SchemeOfWork, SchemeWeek, SchemeLesson
from schemas import (
    SchemeOfWorkCreate, SchemeOfWorkUpdate, SchemeOfWorkResponse, SchemeOfWorkSummary, 
    SchemeAutoGenerateRequest, SchemeLessonUpdate, SchemeLessonCreate
)
from dependencies import get_current_user
from config import settings
from ai_lesson_planner import generate_scheme_of_work

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}/schemes",
    tags=["Schemes of Work"]
)

@router.get("", response_model=List[SchemeOfWorkSummary])
async def list_schemes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(SchemeOfWork).filter(SchemeOfWork.user_id == current_user.id).all()

@router.get("/stats")
async def scheme_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total = db.query(SchemeOfWork).filter(SchemeOfWork.user_id == current_user.id).count()
    return {"total_schemes": total}

@router.get("/{scheme_id}", response_model=SchemeOfWorkResponse)
async def get_scheme(
    scheme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme = db.query(SchemeOfWork).filter(SchemeOfWork.id == scheme_id, SchemeOfWork.user_id == current_user.id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme

@router.post("", response_model=SchemeOfWorkResponse, status_code=201)
async def create_scheme(
    data: SchemeOfWorkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme = SchemeOfWork(
        user_id=current_user.id,
        subject_id=data.subject_id,
        teacher_name=data.teacher_name,
        school=data.school,
        term=data.term,
        year=data.year,
        subject=data.subject,
        grade=data.grade,
        total_weeks=data.total_weeks,
        total_lessons=data.total_lessons,
        status=data.status or "draft"
    )
    db.add(scheme)
    db.flush()

    for week_payload in data.weeks:
        week = SchemeWeek(
            scheme_id=scheme.id,
            week_number=week_payload.week_number,
            strand=week_payload.strand,
            sub_strand=week_payload.sub_strand
        )
        db.add(week)
        db.flush()
        
        for lesson_payload in week_payload.lessons:
            lesson = SchemeLesson(
                week_id=week.id,
                lesson_number=lesson_payload.lesson_number,
                specific_learning_outcomes=lesson_payload.specific_learning_outcomes,
                key_inquiry_questions=lesson_payload.key_inquiry_questions,
                learning_experiences=lesson_payload.learning_experiences,
                learning_resources=lesson_payload.learning_resources,
                assessment_methods=lesson_payload.assessment_methods
            )
            db.add(lesson)

    db.commit()
    db.refresh(scheme)
    return scheme

@router.post("/generate", response_model=SchemeOfWorkResponse, status_code=201)
async def generate_scheme(
    data: SchemeAutoGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # AI Generation Logic
    # This calls the AI service
    try:
        generated_scheme = await generate_scheme_of_work(data, current_user, db)
        return generated_scheme
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@router.put("/{scheme_id}", response_model=SchemeOfWorkResponse)
async def update_scheme(
    scheme_id: int,
    data: SchemeOfWorkUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme = db.query(SchemeOfWork).filter(SchemeOfWork.id == scheme_id, SchemeOfWork.user_id == current_user.id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
        
    for key, value in data.dict(exclude_unset=True).items():
        if key != "weeks":
            setattr(scheme, key, value)
            
    db.commit()
    db.refresh(scheme)
    return scheme

@router.delete("/{scheme_id}")
async def delete_scheme(
    scheme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme = db.query(SchemeOfWork).filter(SchemeOfWork.id == scheme_id, SchemeOfWork.user_id == current_user.id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
        
    db.delete(scheme)
    db.commit()
    return {"message": "Scheme deleted"}

@router.put("/{scheme_id}/lessons/{lesson_id}", response_model=SchemeLessonCreate)
async def update_scheme_lesson(
    scheme_id: int,
    lesson_id: int,
    payload: SchemeLessonUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify ownership via scheme
    scheme = db.query(SchemeOfWork).filter(SchemeOfWork.id == scheme_id, SchemeOfWork.user_id == current_user.id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
        
    lesson = db.query(SchemeLesson).filter(SchemeLesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(lesson, key, value)
        
    db.commit()
    db.refresh(lesson)
    return lesson

@router.get("/{scheme_id}/pdf")
async def scheme_pdf(
    scheme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # PDF Generation Logic
    # Placeholder
    return {"message": "PDF generated"}
