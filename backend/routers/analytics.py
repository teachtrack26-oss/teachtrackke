from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Dict, Any
from datetime import datetime, timedelta

from database import get_db
from models import User, School, Subject, UserRole
from dependencies import get_current_super_admin
from config import settings

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}/admin/analytics",
    tags=["Admin Analytics"]
)

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
