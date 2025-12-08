from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Any
from datetime import datetime, timedelta
import random

from database import get_db
from models import User, Subject, Lesson, ProgressLog, Note, Term
from dependencies import get_current_user
from config import settings

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}/dashboard",
    tags=["Dashboard"]
)

@router.get("/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Lessons Completed
    lessons_completed = db.query(ProgressLog).filter(
        ProgressLog.user_id == current_user.id,
        ProgressLog.action == "COMPLETED"
    ).count()

    # 2. Total Lessons (across all user's subjects)
    total_lessons = db.query(func.sum(Subject.total_lessons)).filter(
        Subject.user_id == current_user.id
    ).scalar() or 0

    # 3. Attendance Average (Mock for now as we don't have attendance table fully linked in context)
    # In a real app, this would query an Attendance model
    attendance_average = 0 

    # 4. Assessments Created (Mock for now)
    assessments_created = 0

    return {
        "lessonsCompleted": lessons_completed,
        "totalLessons": total_lessons,
        "attendanceAverage": attendance_average,
        "assessmentsCreated": assessments_created
    }

@router.get("/insights")
def get_teaching_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Most Taught Subjects
    # Group progress logs by subject
    subject_counts = db.query(
        Subject.subject_name, 
        func.count(ProgressLog.id).label('count')
    ).join(ProgressLog, Subject.id == ProgressLog.subject_id)\
     .filter(ProgressLog.user_id == current_user.id)\
     .group_by(Subject.subject_name)\
     .order_by(desc('count'))\
     .limit(5)\
     .all()

    most_taught = [
        {"subject": name, "count": count, "color": f"#{random.randint(0, 0xFFFFFF):06x}"} 
        for name, count in subject_counts
    ]

    # 2. Average Lesson Duration
    # Get average duration of completed lessons
    avg_duration = db.query(func.avg(Lesson.duration_minutes)).join(ProgressLog, Lesson.id == ProgressLog.lesson_id)\
        .filter(ProgressLog.user_id == current_user.id).scalar() or 40

    # 3. Peak Teaching Hours (Mock based on logs or random if empty)
    # In reality, extract hour from ProgressLog.created_at
    peak_hours = [
        {"hour": "08:00", "count": random.randint(5, 15)},
        {"hour": "09:00", "count": random.randint(5, 15)},
        {"hour": "10:00", "count": random.randint(5, 15)},
        {"hour": "11:00", "count": random.randint(5, 15)},
        {"hour": "14:00", "count": random.randint(5, 15)},
    ]

    # 4. Weekly Comparison (Last 4 weeks)
    weekly_comparison = []
    today = datetime.now()
    for i in range(3, -1, -1):
        start_date = today - timedelta(days=(i + 1) * 7)
        end_date = today - timedelta(days=i * 7)
        
        # Completed lessons (from ProgressLog)
        completed_count = db.query(ProgressLog).filter(
            ProgressLog.user_id == current_user.id,
            ProgressLog.created_at >= start_date,
            ProgressLog.created_at < end_date,
            ProgressLog.action == "COMPLETED"
        ).count()
        
        # Total lessons scheduled/planned (Mocking 'planned' as completed + some buffer for now)
        # In a real scenario, this would come from the Timetable or LessonPlan dates
        total_count = completed_count + random.randint(0, 5)
        
        label = "This Week" if i == 0 else f"Week {4-i}"
        weekly_comparison.append({
            "week": label, 
            "lessons": total_count, 
            "completed": completed_count
        })

    return {
        "mostTaughtSubjects": most_taught,
        "averageLessonDuration": round(avg_duration),
        "peakTeachingHours": peak_hours,
        "weeklyComparison": weekly_comparison
    }

@router.get("/deadlines")
def get_upcoming_deadlines(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch terms or create mock deadlines if none
    # For now, let's return some generic deadlines + any actual terms ending soon
    
    deadlines = []
    today = datetime.now()

    # Check for term end dates
    terms = db.query(Term).filter(
        Term.user_id == current_user.id,
        Term.end_date >= today
    ).order_by(Term.end_date).limit(2).all()

    for term in terms:
        days_until = (term.end_date - today).days
        deadlines.append({
            "id": f"term-{term.id}",
            "title": f"End of {term.term_name}",
            "date": term.end_date.isoformat(),
            "type": "exam",
            "daysUntil": days_until
        })

    # If no real data, provide some helpful placeholders for new users
    if not deadlines:
        deadlines.append({
            "id": "setup-1",
            "title": "Complete Profile Setup",
            "date": (today + timedelta(days=2)).isoformat(),
            "type": "task",
            "daysUntil": 2
        })
        deadlines.append({
            "id": "setup-2",
            "title": "Create First Lesson Plan",
            "date": (today + timedelta(days=5)).isoformat(),
            "type": "lesson-plan",
            "daysUntil": 5
        })

    return deadlines

@router.get("/resources")
def get_recent_resources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch recent notes/resources
    notes = db.query(Note).filter(
        Note.user_id == current_user.id
    ).order_by(Note.updated_at.desc()).limit(6).all()

    resources = []
    for note in notes:
        resources.append({
            "id": note.id,
            "title": note.title,
            "type": "material", # You might want to map note.file_type
            "lastAccessed": note.updated_at.isoformat(),
            "icon": "📄"
        })

    return resources
