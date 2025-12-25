from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta
import re

from database import get_db
from models import User, UserRole, LessonPlan, SchemeLesson, SystemTerm, UserTermAdjustment
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
    # Ensure we have the scheme loaded to get subject details
    scheme = scheme_lesson.week.scheme

    def _resolve_term_start_date() -> "datetime | None":
        """Resolve start date from system terms, applying user/school adjustments if present."""
        term_number = None
        if scheme.term:
            m = re.search(r"(\d+)", scheme.term)
            if m:
                term_number = int(m.group(1))

        term_q = db.query(SystemTerm).filter(SystemTerm.year == scheme.year)
        if scheme.term:
            term_exact = term_q.filter(SystemTerm.term_name == scheme.term).first()
            if term_exact:
                system_term = term_exact
            elif term_number is not None:
                system_term = term_q.filter(SystemTerm.term_number == term_number).first()
            else:
                system_term = term_q.order_by(SystemTerm.term_number.asc()).first()
        else:
            system_term = term_q.order_by(SystemTerm.term_number.asc()).first()

        if not system_term:
            return None

        adjustment = None
        if current_user.school_id:
            adjustment = db.query(UserTermAdjustment).filter(
                UserTermAdjustment.system_term_id == system_term.id,
                UserTermAdjustment.school_id == current_user.school_id,
                UserTermAdjustment.is_active == True,
            ).first()
        if not adjustment:
            adjustment = db.query(UserTermAdjustment).filter(
                UserTermAdjustment.system_term_id == system_term.id,
                UserTermAdjustment.user_id == current_user.id,
                UserTermAdjustment.is_active == True,
            ).first()

        return adjustment.adjusted_start_date if adjustment else system_term.start_date

    planned_date = None
    term_start = _resolve_term_start_date()
    if term_start:
        # Week 1 starts on term_start. We assume 5-day teaching week.
        week_start = term_start + timedelta(days=(scheme_lesson.week.week_number - 1) * 7)
        lesson_index = max((scheme_lesson.lesson_number or 1) - 1, 0)
        extra_weeks, day_index = divmod(lesson_index, 5)
        planned_dt = week_start + timedelta(weeks=extra_weeks, days=day_index)
        planned_date = planned_dt.date().isoformat()
    
    plan = LessonPlan(
        user_id=current_user.id,
        subject_id=scheme.subject_id,
        scheme_lesson_id=scheme_lesson.id,
        learning_area=scheme.subject,
        grade=scheme.grade,
        date=planned_date,
        roll=scheme.roll,
        lesson_duration_minutes=getattr(scheme, 'lesson_duration_minutes', None),
        strand_theme_topic=scheme_lesson.strand,
        sub_strand_sub_theme_sub_topic=scheme_lesson.sub_strand,
        specific_learning_outcomes=scheme_lesson.specific_learning_outcomes,
        key_inquiry_questions=scheme_lesson.key_inquiry_questions,
        learning_resources=scheme_lesson.learning_resources,
        development=scheme_lesson.learning_experiences, # Pre-fill development with experiences
        status="pending"
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
    # If user is School Admin, they can see all lesson plans for their school
    if current_user.role in [UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN] and current_user.school_id:
        return db.query(LessonPlan).join(User).filter(User.school_id == current_user.school_id).all()

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
    try:
        plan = await generate_lesson_plan(plan)
        db.commit()
        db.refresh(plan)
    except Exception as e:
        print(f"AI Generation failed: {e}")
        # We don't raise here to allow returning the partial plan, or we could raise.
        # For now, let's just log and return the plan as is.
        
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
        
    # Call AI service (same as generate for now)
    try:
        plan = await generate_lesson_plan(plan)
        db.commit()
        db.refresh(plan)
    except Exception as e:
        print(f"AI Enhancement failed: {e}")
        
    return plan
