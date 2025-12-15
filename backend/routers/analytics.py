from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Dict, Any
from datetime import datetime, timedelta

from database import get_db
from models import User, School, Subject, UserRole, CurriculumTemplate, Department, SubscriptionType, ProgressLog
from dependencies import get_current_super_admin, get_current_admin_user
from config import settings

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}/admin/analytics",
    tags=["Admin Analytics"]
)

@router.get("/")
def get_full_analytics(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get aggregated analytics for the admin dashboard"""
    
    # Filter by school if not super admin
    school_filter = None
    if current_user.role == UserRole.SCHOOL_ADMIN:
        school_filter = current_user.school_id

    # 1. Overview
    user_query = db.query(User)
    teacher_query = db.query(User).filter(User.role.in_([UserRole.TEACHER, UserRole.HOD]), User.is_active == True)
    subject_query = db.query(Subject)
    
    if school_filter:
        user_query = user_query.filter(User.school_id == school_filter)
        teacher_query = teacher_query.filter(User.school_id == school_filter)
        subject_query = subject_query.join(User).filter(User.school_id == school_filter)

    total_users = user_query.count()
    active_teachers = teacher_query.count()
    total_templates = db.query(CurriculumTemplate).count() # Templates are global
    total_subjects = subject_query.count()
    
    overview = {
        "total_users": total_users,
        "active_teachers": active_teachers,
        "total_templates": total_templates,
        "total_subjects": total_subjects
    }
    
    # 2. Most Used Curricula (Top 5)
    most_used_query = (
        db.query(
            Subject.subject_name.label("subject"),
            Subject.grade,
            func.count(Subject.id).label("usage_count")
        )
    )
    
    if school_filter:
        most_used_query = most_used_query.join(User).filter(User.school_id == school_filter)
        
    most_used = (
        most_used_query
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
    completion_query = (
        db.query(
            Subject.subject_name.label("subject"),
            func.avg(Subject.progress_percentage).label("avg_completion"),
            func.count(Subject.id).label("count")
        )
    )
    
    if school_filter:
        completion_query = completion_query.join(User).filter(User.school_id == school_filter)

    completion = (
        completion_query
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
    teacher_eng_query = (
        db.query(
            User.id,
            User.email,
            func.count(Subject.id).label("subjects"),
            func.avg(Subject.progress_percentage).label("avg_progress")
        )
        .join(Subject, User.id == Subject.user_id)
        .filter(User.role.in_([UserRole.TEACHER, UserRole.HOD]))
    )
    
    if school_filter:
        teacher_eng_query = teacher_eng_query.filter(User.school_id == school_filter)

    top_teachers = (
        teacher_eng_query
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
    popularity_query = (
        db.query(
            Subject.grade,
            func.count(Subject.id).label("count")
        )
    )
    
    if school_filter:
        popularity_query = popularity_query.join(User).filter(User.school_id == school_filter)

    popularity = (
        popularity_query
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
    timeline_query = (
        db.query(
            func.date(User.created_at).label("date"),
            func.count(User.id).label("count")
        )
        .filter(User.created_at >= start_date)
    )
    
    if school_filter:
        timeline_query = timeline_query.filter(User.school_id == school_filter)

    timeline_data = (
        timeline_query
        .group_by(func.date(User.created_at))
        .all()
    )
    
    activity_timeline = [
        {"date": str(r.date), "count": r.count}
        for r in timeline_data
    ]
    
    # 7. Progress Distribution
    progress_query = db.query(Subject.progress_percentage)
    if school_filter:
        progress_query = progress_query.join(User).filter(User.school_id == school_filter)
        
    progress_values = progress_query.all()
    
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

    # 8. Department Analytics (New)
    dept_stats = []
    if school_filter:
        departments = db.query(Department).filter(Department.school_id == school_filter).all()
        for d in departments:
            dept_stats.append({
                "name": d.name,
                "hod": d.hod.full_name if d.hod else "Unassigned",
                "teacher_count": 0 # Placeholder until we link teachers to departments
            })

    # 9. Financial/Subscription Stats (New)
    sub_query = db.query(User.subscription_type, func.count(User.id).label("count"))
    if school_filter:
        sub_query = sub_query.filter(User.school_id == school_filter)
    
    sub_stats = sub_query.group_by(User.subscription_type).all()
    subscription_stats = {
        "paid": 0,
        "free": 0,
        "school_sponsored": 0
    }
    
    for s_type, count in sub_stats:
        if s_type == SubscriptionType.FREE:
            subscription_stats["free"] += count
        elif s_type == SubscriptionType.SCHOOL_SPONSORED:
            subscription_stats["school_sponsored"] += count
        else:
            subscription_stats["paid"] += count

    # 10. User Retention (Daily Active Users - Last 30 Days) (New)
    # Using ProgressLog as a proxy for activity
    retention_end_date = datetime.now()
    retention_start_date = retention_end_date - timedelta(days=30)
    
    dau_query = (
        db.query(
            func.date(ProgressLog.created_at).label("date"),
            func.count(func.distinct(ProgressLog.user_id)).label("active_users")
        )
        .filter(ProgressLog.created_at >= retention_start_date)
    )
    
    if school_filter:
        dau_query = dau_query.join(User).filter(User.school_id == school_filter)
        
    dau_data = (
        dau_query
        .group_by(func.date(ProgressLog.created_at))
        .all()
    )
    
    retention_stats = [
        {"date": str(r.date), "active_users": r.active_users}
        for r in dau_data
    ]

    # 11. Lesson Plan Adherence (New)
    # Comparing total_lessons vs lessons_completed
    adherence_query = db.query(
        func.sum(Subject.total_lessons).label("total_planned"),
        func.sum(Subject.lessons_completed).label("total_completed")
    )
    
    if school_filter:
        adherence_query = adherence_query.join(User).filter(User.school_id == school_filter)
        
    adherence_result = adherence_query.first()
    
    lesson_adherence = {
        "planned": int(adherence_result.total_planned or 0),
        "completed": int(adherence_result.total_completed or 0),
        "rate": 0
    }
    
    if lesson_adherence["planned"] > 0:
        lesson_adherence["rate"] = round((lesson_adherence["completed"] / lesson_adherence["planned"]) * 100, 1)

    return {
        "overview": overview,
        "most_used_curricula": most_used_curricula,
        "completion_rates": completion_rates,
        "teacher_engagement": teacher_engagement,
        "subject_popularity": subject_popularity,
        "activity_timeline": activity_timeline,
        "progress_distribution": distribution,
        "department_stats": dept_stats,
        "subscription_stats": subscription_stats,
        "retention_stats": retention_stats,
        "lesson_adherence": lesson_adherence
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
