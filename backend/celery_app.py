"""
Celery Application for Background Task Processing
Handles heavy operations like AI lesson generation, bulk operations, etc.
"""
import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

# Initialize Celery
celery_app = Celery(
    'teachtrack',
    broker=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('REDIS_URL', 'redis://localhost:6379/0')
)

# Configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Africa/Nairobi',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes max per task
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
)

# Auto-discover tasks from main module
celery_app.autodiscover_tasks(['backend'])


@celery_app.task(name='generate_lesson_plans_background')
def generate_lesson_plans_background(scheme_id: int, user_id: int):
    """
    Background task to generate lesson plans from a scheme of work
    This prevents blocking the API when 500 teachers click "Generate" at once
    """
    from database import SessionLocal
    from models import SchemeOfWork, LessonPlan, SchemeWeek, SchemeLesson
    from sqlalchemy.orm import joinedload
    
    db = SessionLocal()
    try:
        # Fetch the scheme with all related data
        scheme = db.query(SchemeOfWork).options(
            joinedload(SchemeOfWork.weeks).joinedload(SchemeWeek.lessons),
            joinedload(SchemeOfWork.subject_rel)
        ).filter(
            SchemeOfWork.id == scheme_id,
            SchemeOfWork.user_id == user_id
        ).first()
        
        if not scheme:
            return {"error": "Scheme not found", "status": "failed"}
        
        # Check if plans already exist
        existing_plans = db.query(LessonPlan).join(SchemeLesson).join(SchemeWeek).filter(
            SchemeWeek.scheme_id == scheme_id
        ).count()
        
        if existing_plans > 0:
            return {
                "error": f"Lesson plans already exist ({existing_plans} plans found)",
                "status": "failed"
            }
        
        created_count = 0
        
        # Generate lesson plans for each lesson
        for week in scheme.weeks:
            for lesson in week.lessons:
                lesson_plan = LessonPlan(
                    user_id=user_id,
                    subject_id=scheme.subject_id,
                    scheme_lesson_id=lesson.id,
                    learning_area=scheme.subject,
                    grade=scheme.grade,
                    strand_theme_topic=lesson.strand,
                    sub_strand_sub_theme_sub_topic=lesson.sub_strand,
                    specific_learning_outcomes=lesson.specific_learning_outcomes,
                    key_inquiry_questions=lesson.key_inquiry_questions or "",
                    learning_resources=lesson.learning_resources or "",
                    introduction=f"Introduce: {lesson.strand} - {lesson.sub_strand}",
                    development=lesson.learning_experiences or "Learning activities",
                    conclusion="Summarize key learning points",
                    summary=f"Week {week.week_number}: {lesson.sub_strand}",
                    status="pending"
                )
                db.add(lesson_plan)
                created_count += 1
        
        db.commit()
        
        return {
            "status": "success",
            "created": created_count,
            "scheme_id": scheme_id
        }
        
    except Exception as e:
        db.rollback()
        return {"error": str(e), "status": "failed"}
    finally:
        db.close()


@celery_app.task(name='generate_ai_lesson_content')
def generate_ai_lesson_content(lesson_plan_id: int, user_id: int):
    """
    Background task to enhance lesson plan with AI-generated content
    Only runs if AI features are enabled
    """
    from database import SessionLocal
    from models import LessonPlan, SubStrand, Strand
    
    db = SessionLocal()
    try:
        lesson_plan = db.query(LessonPlan).filter(
            LessonPlan.id == lesson_plan_id,
            LessonPlan.user_id == user_id
        ).first()
        
        if not lesson_plan:
            return {"error": "Lesson plan not found", "status": "failed"}
        
        # Check if AI is configured
        try:
            from ai_lesson_planner import AILessonPlanner
            ai_planner = AILessonPlanner()
            
            if not ai_planner.client:
                return {"status": "skipped", "reason": "AI not configured"}
            
            # Prepare data for AI
            lesson_data = {
                "grade": lesson_plan.grade,
                "learning_area": lesson_plan.learning_area,
                "strand": lesson_plan.strand_theme_topic,
                "sub_strand": lesson_plan.sub_strand_sub_theme_sub_topic,
                "outcomes": lesson_plan.specific_learning_outcomes,
                "competencies": lesson_plan.core_competences or "",
                "values": lesson_plan.values_to_be_developed or "",
                "learning_experiences": lesson_plan.development or ""
            }
            
            # Generate enhanced content
            ai_result = ai_planner.generate_detailed_plan(lesson_data)
            
            if "error" not in ai_result:
                # Update lesson plan with AI content
                lesson_plan.introduction = ai_result.get("introduction", lesson_plan.introduction)
                lesson_plan.development = ai_result.get("development", lesson_plan.development)
                lesson_plan.conclusion = ai_result.get("conclusion", lesson_plan.conclusion)
                lesson_plan.summary = ai_result.get("summary", lesson_plan.summary)
                lesson_plan.reflection_self_evaluation = ai_result.get("reflection_prompt", "")
                
                db.commit()
                return {"status": "success", "lesson_plan_id": lesson_plan_id}
            else:
                return {"status": "failed", "error": ai_result.get("error")}
                
        except ImportError:
            return {"status": "skipped", "reason": "AI module not available"}
            
    except Exception as e:
        db.rollback()
        return {"error": str(e), "status": "failed"}
    finally:
        db.close()


# Health check task
@celery_app.task(name='health_check')
def health_check():
    """Simple task to verify Celery is working"""
    return {"status": "healthy", "message": "Celery worker is running"}
