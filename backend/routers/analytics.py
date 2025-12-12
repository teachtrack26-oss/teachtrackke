from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Dict, Any
from datetime import datetime, timedelta

from database import get_db
from models import User, School, Subject, UserRole, CurriculumTemplate
from dependencies import get_current_super_admin
from config import settings

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}/admin/analytics",
    tags=["Admin Analytics"]
)

@router.get("/")
def get_full_analytics(
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Get aggregated analytics for the admin dashboard"""
    
    # 1. Overview
    total_users = db.query(User).count()
    active_teachers = db.query(User).filter(User.role == UserRole.TEACHER, User.is_active == True).count()
    total_templates = db.query(CurriculumTemplate).count()
    total_subjects = db.query(Subject).count()
    
    overview = {
        "total_users": total_users,
        "active_teachers": active_teachers,
        "total_templates": total_templates,
        "total_subjects": total_subjects
    }
    
    # 2. Most Used Curricula (Top 5)
    most_used = (
        db.query(
            Subject.subject_name.label("subject"),
            Subject.grade,
            func.count(Subject.id).label("usage_count")
        )
        .group_by(Subject.subject_name, Subject.grade)
        .order_by(func.count(Subject.id).desc())
        .limit(5)
        .all()
    )
    
    most_used_curricula = [
        {"subject": r.subject, "grade": r.grade, "usage_count": r.usage_count}
        for r in most_used
    ]
    
    # 3. Completion Rates (Top 5)
    completion = (
        db.query(
            Subject.subject_name.label("subject"),
            func.avg(Subject.progress_percentage).label("avg_completion"),
            func.count(Subject.id).label("count")
        )
        .group_by(Subject.subject_name)
        .order_by(func.avg(Subject.progress_percentage).desc())
        .limit(5)
        .all()
    )
    
    completion_rates = [
        {"subject": r.subject, "avg_completion": float(r.avg_completion or 0), "count": r.count}
        for r in completion
    ]
    
    # 4. Teacher Engagement (Top 5 by subject count)
    top_teachers = (
        db.query(
            User.id,
            User.email,
            func.count(Subject.id).label("subjects"),
            func.avg(Subject.progress_percentage).label("avg_progress")
        )
        .join(Subject, User.id == Subject.user_id)
        .filter(User.role == UserRole.TEACHER)
        .group_by(User.id, User.email)
        .order_by(func.count(Subject.id).desc())
        .limit(5)
        .all()
    )
    
    teacher_engagement = [
        {
            "user_id": r.id,
            "email": r.email,
            "subjects": r.subjects,
            "avg_progress": float(r.avg_progress or 0)
        }
        for r in top_teachers
    ]
    
    # 5. Subject Popularity (by Grade)
    popularity = (
        db.query(
            Subject.grade,
            func.count(Subject.id).label("count")
        )
        .group_by(Subject.grade)
        .order_by(Subject.grade)
        .all()
    )
    
    subject_popularity = [
        {"grade": r.grade, "count": r.count}
        for r in popularity
    ]
    
    # 6. Activity Timeline (Last 7 days)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    
    # This is a simplified timeline based on user creation
    # Ideally we would have a dedicated activity log table
    timeline_data = (
        db.query(
            func.date(User.created_at).label("date"),
            func.count(User.id).label("count")
        )
        .filter(User.created_at >= start_date)
        .group_by(func.date(User.created_at))
        .all()
    )
    
    activity_timeline = [
        {"date": str(r.date), "count": r.count}
        for r in timeline_data
    ]
    
    # 7. Progress Distribution
    # We'll fetch all progress percentages and bucket them in python
    # to avoid complex SQL case statements for cross-db compatibility
    progress_values = db.query(Subject.progress_percentage).all()
    
    distribution = {
        "0-20": 0,
        "21-40": 0,
        "41-60": 0,
        "61-80": 0,
        "81-100": 0
    }
    
    for (val,) in progress_values:
        v = float(val or 0)
        if v <= 20:
            distribution["0-20"] += 1
        elif v <= 40:
            distribution["21-40"] += 1
        elif v <= 60:
            distribution["41-60"] += 1
        elif v <= 80:
            distribution["61-80"] += 1
        else:
            distribution["81-100"] += 1
            
    return {
        "overview": overview,
        "most_used_curricula": most_used_curricula,
        "completion_rates": completion_rates,
        "teacher_engagement": teacher_engagement,
        "subject_popularity": subject_popularity,
        "activity_timeline": activity_timeline,
        "progress_distribution": distribution
    }

@router.get("/trends")
def get_growth_trends(
    weeks: int = 12,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Get weekly user growth for the last N weeks"""
    end_date = datetime.now()
    start_date = end_date - timedelta(weeks=weeks)
    
    # Group users by week
    # Note: This SQL syntax is for MySQL/PostgreSQL. Adjust if using SQLite.
    # Assuming MySQL based on previous context (JSON type usage)
    
    # Fallback for SQLite or generic SQL if specific date functions fail
    # We'll fetch data and process in python for compatibility and simplicity 
    # unless dataset is huge (which it likely isn't for this stage)
    
    users = db.query(User.created_at).filter(User.created_at >= start_date).all()
    
    weekly_data = {}
    
    # Initialize weeks
    current = start_date
    while current <= end_date:
        week_key = current.strftime("%Y-%W")
        weekly_data[week_key] = 0
        current += timedelta(days=7)
        
    for user in users:
        if user.created_at:
            week_key = user.created_at.strftime("%Y-%W")
            if week_key in weekly_data:
                weekly_data[week_key] += 1
            else:
                # Handle edge cases or just add to closest
                pass
                
    # Convert to list sorted by date
    result = [
        {"week": k, "new_users": v} 
        for k, v in sorted(weekly_data.items())
    ]
    
    return result

@router.get("/curriculum")
def get_curriculum_stats(
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Get average curriculum completion by grade"""
    
    # Aggregate progress by grade
    stats = (
        db.query(
            Subject.grade,
            func.avg(Subject.progress_percentage).label("avg_progress"),
            func.count(Subject.id).label("subject_count")
        )
        .group_by(Subject.grade)
        .all()
    )
    
    return [
        {
            "grade": s.grade,
            "avg_progress": float(s.avg_progress or 0),
            "subject_count": s.subject_count
        }
        for s in stats
    ]

@router.get("/activity")
def get_recent_activity(
    limit: int = 20,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Get combined recent activity log (New Users, New Schools)"""
    
    # Fetch recent users
    recent_users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .limit(limit)
        .all()
    )
    
    # Fetch recent schools
    recent_schools = (
        db.query(School)
        .order_by(School.created_at.desc())
        .limit(limit)
        .all()
    )
    
    activities = []
    
    for u in recent_users:
        activities.append({
            "type": "USER_JOINED",
            "description": f"New user joined: {u.full_name} ({u.role})",
            "timestamp": u.created_at,
            "entity_id": u.id
        })
        
    for s in recent_schools:
        activities.append({
            "type": "SCHOOL_CREATED",
            "description": f"New school registered: {s.name}",
            "timestamp": s.created_at,
            "entity_id": s.id
        })
        
    # Sort combined list
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return activities[:limit]

@router.get("/health")
def get_system_health(
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Check system health status"""
    health_status = {
        "status": "healthy",
        "database": "connected",
        "timestamp": datetime.now()
    }
    
    try:
        # Simple DB check
        db.execute(text("SELECT 1"))
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["database"] = "disconnected"
        health_status["error"] = str(e)
        
    return health_status
