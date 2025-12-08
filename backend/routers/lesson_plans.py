from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, LessonPlan, SchemeLesson
from schemas import LessonPlanCreate, LessonPlanUpdate, LessonPlanResponse, LessonPlanSummary
from dependencies import get_current_user
from config import settings
from ai_lesson_planner import generate_lesson_plan

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}/lesson-plans",
    tags=["Lesson Plans"]
)

@router.post("", response_model=LessonPlanResponse)
async def create_lesson_plan(
    lesson_plan: LessonPlanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_plan = LessonPlan(
        user_id=current_user.id,
        **lesson_plan.dict()
    )
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.post("/from-scheme/{scheme_lesson_id}", response_model=LessonPlanResponse)
async def create_lesson_plan_from_scheme(
    scheme_lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme_lesson = db.query(SchemeLesson).filter(SchemeLesson.id == scheme_lesson_id).first()
    if not scheme_lesson:
        raise HTTPException(status_code=404, detail="Scheme lesson not found")
        
    # Create plan from scheme lesson data
    plan = LessonPlan(
        user_id=current_user.id,
        topic=scheme_lesson.week.sub_strand, # Approximation
        sub_topic=scheme_lesson.specific_learning_outcomes,
        objectives=scheme_lesson.specific_learning_outcomes,
        learning_activities=scheme_lesson.learning_experiences,
        resources=scheme_lesson.learning_resources,
        assessment=scheme_lesson.assessment_methods
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

@router.get("", response_model=List[LessonPlanSummary])
async def get_lesson_plans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(LessonPlan).filter(LessonPlan.user_id == current_user.id).all()

@router.get("/{lesson_plan_id}", response_model=LessonPlanResponse)
async def get_lesson_plan(
    lesson_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(LessonPlan).filter(LessonPlan.id == lesson_plan_id, LessonPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    return plan

@router.put("/{lesson_plan_id}", response_model=LessonPlanResponse)
async def update_lesson_plan(
    lesson_plan_id: int,
    lesson_plan_update: LessonPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(LessonPlan).filter(LessonPlan.id == lesson_plan_id, LessonPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
        
    for key, value in lesson_plan_update.dict(exclude_unset=True).items():
        setattr(plan, key, value)
        
    db.commit()
    db.refresh(plan)
    return plan

@router.delete("/{lesson_plan_id}")
async def delete_lesson_plan(
    lesson_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(LessonPlan).filter(LessonPlan.id == lesson_plan_id, LessonPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
        
    db.delete(plan)
    db.commit()
    return {"message": "Lesson plan deleted"}

@router.post("/bulk-delete")
async def bulk_delete_lesson_plans(
    ids: List[int],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(LessonPlan).filter(LessonPlan.id.in_(ids), LessonPlan.user_id == current_user.id).delete(synchronize_session=False)
    db.commit()
    return {"message": "Plans deleted"}

@router.post("/{lesson_plan_id}/auto-generate", response_model=LessonPlanResponse)
async def auto_generate_lesson_plan(
    lesson_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # AI Generation
    plan = db.query(LessonPlan).filter(LessonPlan.id == lesson_plan_id, LessonPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
        
    # Call AI service
    # generated = await generate_lesson_plan(plan)
    # Update plan
    return plan

@router.post("/{lesson_plan_id}/enhance", response_model=LessonPlanResponse)
async def enhance_lesson_plan_with_ai(
    lesson_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # AI Enhancement
    plan = db.query(LessonPlan).filter(LessonPlan.id == lesson_plan_id, LessonPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    return plan
