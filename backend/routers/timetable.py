from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from database import get_db
from models import User, UserRole, SchoolSchedule, TimetableEntry, TimeSlot
from schemas import (
    SchoolScheduleCreate, SchoolScheduleUpdate, SchoolScheduleResponse,
    TimetableEntryCreate, TimetableEntryUpdate, TimetableEntryResponse,
    TimeSlotResponse
)
from dependencies import get_current_user, get_active_schedule_or_fallback
from config import settings

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}/timetable",
    tags=["Timetable"]
)

def generate_time_slots(schedule: SchoolSchedule, db: Session):
    """Generate time slots based on schedule configuration"""
    
    # Parse times
    def parse_time(time_str: str) -> datetime:
        return datetime.strptime(time_str, "%H:%M")
    
    current_time = parse_time(schedule.school_start_time)
    slot_number = 1
    sequence = 1
    
    # Session 1 (Before first break)
    for i in range(schedule.lessons_before_first_break):
        duration = schedule.single_lesson_duration
        
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=slot_number,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=duration)).strftime("%H:%M"),
            slot_type="lesson",
            label=f"Lesson {slot_number}",
            sequence_order=sequence
        )
        db.add(time_slot)
        
        current_time += timedelta(minutes=duration)
        slot_number += 1
        sequence += 1
    
    # First Break
    if schedule.first_break_duration > 0:
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=0,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=schedule.first_break_duration)).strftime("%H:%M"),
            slot_type="break",
            label="First Break",
            sequence_order=sequence
        )
        db.add(time_slot)
        current_time += timedelta(minutes=schedule.first_break_duration)
        sequence += 1
    
    # Session 2 (Before second break)
    for i in range(schedule.lessons_before_second_break):
        duration = schedule.single_lesson_duration
        
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=slot_number,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=duration)).strftime("%H:%M"),
            slot_type="lesson",
            label=f"Lesson {slot_number}",
            sequence_order=sequence
        )
        db.add(time_slot)
        
        current_time += timedelta(minutes=duration)
        slot_number += 1
        sequence += 1
    
    # Second Break (Tea Break)
    if schedule.second_break_duration > 0:
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=0,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=schedule.second_break_duration)).strftime("%H:%M"),
            slot_type="break",
            label="Second Break",
            sequence_order=sequence
        )
        db.add(time_slot)
        current_time += timedelta(minutes=schedule.second_break_duration)
        sequence += 1
    
    # Session 3 (Before lunch)
    for i in range(schedule.lessons_before_lunch):
        duration = schedule.single_lesson_duration
        
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=slot_number,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=duration)).strftime("%H:%M"),
            slot_type="lesson",
            label=f"Lesson {slot_number}",
            sequence_order=sequence
        )
        db.add(time_slot)
        
        current_time += timedelta(minutes=duration)
        slot_number += 1
        sequence += 1
    
    # Lunch Break
    if schedule.lunch_break_duration > 0:
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=0,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=schedule.lunch_break_duration)).strftime("%H:%M"),
            slot_type="lunch",
            label="Lunch Break",
            sequence_order=sequence
        )
        db.add(time_slot)
        current_time += timedelta(minutes=schedule.lunch_break_duration)
        sequence += 1
    
    # Session 4 (After lunch)
    for i in range(schedule.lessons_after_lunch):
        duration = schedule.single_lesson_duration
        
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            slot_number=slot_number,
            start_time=current_time.strftime("%H:%M"),
            end_time=(current_time + timedelta(minutes=duration)).strftime("%H:%M"),
            slot_type="lesson",
            label=f"Lesson {slot_number}",
            sequence_order=sequence
        )
        db.add(time_slot)
        
        current_time += timedelta(minutes=duration)
        slot_number += 1
        sequence += 1
    
    db.commit() 

@router.post("/schedules", response_model=SchoolScheduleResponse)
async def create_school_schedule(
    schedule: SchoolScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # If user is a school admin, link to school
    school_id = None
    if current_user.role in [UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN] and current_user.school_id:
        school_id = current_user.school_id
        
    db_schedule = SchoolSchedule(
        user_id=current_user.id,
        school_id=school_id,
        **schedule.dict()
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    
    # Generate slots
    generate_time_slots(db_schedule, db)
    
    return db_schedule

@router.get("/schedules", response_model=List[SchoolScheduleResponse])
async def get_school_schedules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(SchoolSchedule).filter(SchoolSchedule.user_id == current_user.id).all()

@router.get("/schedules/active", response_model=SchoolScheduleResponse)
async def get_active_schedule(
    education_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. If user is linked to a school, try to find a school-wide schedule first
    if current_user.school_id:
        query = db.query(SchoolSchedule).filter(
            SchoolSchedule.school_id == current_user.school_id,
            SchoolSchedule.is_active == True
        )
        if education_level:
            query = query.filter(SchoolSchedule.education_level == education_level)
            
        school_schedule = query.first()
        if school_schedule:
            return school_schedule

    # 2. Fallback to user-specific schedule (legacy or independent teacher)
    schedule = get_active_schedule_or_fallback(db, current_user, education_level)
    if not schedule:
        raise HTTPException(status_code=404, detail="No active schedule found")
    return schedule

@router.put("/schedules/{schedule_id}", response_model=SchoolScheduleResponse)
async def update_school_schedule(
    schedule_id: int,
    schedule_update: SchoolScheduleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = db.query(SchoolSchedule).filter(SchoolSchedule.id == schedule_id, SchoolSchedule.user_id == current_user.id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    for key, value in schedule_update.dict(exclude_unset=True).items():
        setattr(schedule, key, value)
        
    db.commit()
    db.refresh(schedule)
    return schedule

@router.delete("/schedules/{schedule_id}")
async def delete_school_schedule(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = db.query(SchoolSchedule).filter(SchoolSchedule.id == schedule_id, SchoolSchedule.user_id == current_user.id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    db.delete(schedule)
    db.commit()
    return {"message": "Schedule deleted"}

@router.get("/time-slots", response_model=List[TimeSlotResponse])
async def get_time_slots(
    education_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = get_active_schedule_or_fallback(db, current_user, education_level)
    if not schedule:
        return []
    return db.query(TimeSlot).filter(TimeSlot.schedule_id == schedule.id).all()

@router.post("/entries", response_model=TimetableEntryResponse)
async def create_timetable_entry(
    entry: TimetableEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Look up the time slot to get the schedule_id
    time_slot = db.query(TimeSlot).filter(TimeSlot.id == entry.time_slot_id).first()
    if not time_slot:
        raise HTTPException(status_code=404, detail="Time slot not found")

    db_entry = TimetableEntry(
        user_id=current_user.id,
        schedule_id=time_slot.schedule_id,
        **entry.dict()
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.get("/entries", response_model=List[TimetableEntryResponse])
async def get_timetable_entries(
    day_of_week: Optional[int] = None,
    education_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # If user is School Admin, they can see all entries for their school
    if current_user.role in [UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN] and current_user.school_id:
        # Find all schedules for this school
        schedules = db.query(SchoolSchedule).filter(SchoolSchedule.school_id == current_user.school_id).all()
        schedule_ids = [s.id for s in schedules]
        
        query = db.query(TimetableEntry).filter(TimetableEntry.schedule_id.in_(schedule_ids))
    else:
        query = db.query(TimetableEntry).filter(TimetableEntry.user_id == current_user.id)

    if day_of_week:
        query = query.filter(TimetableEntry.day_of_week == day_of_week)
    return query.all()

@router.get("/entries/today")
async def get_today_entries(
    education_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = datetime.now().weekday() + 1 # 1=Monday
    return await get_timetable_entries(day_of_week=today, education_level=education_level, current_user=current_user, db=db)

@router.get("/entries/next")
async def get_next_lesson(
    education_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Logic to find next lesson based on current time
    return None # Placeholder

@router.put("/entries/{entry_id}", response_model=TimetableEntryResponse)
async def update_timetable_entry(
    entry_id: int,
    entry_update: TimetableEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(TimetableEntry).filter(TimetableEntry.id == entry_id, TimetableEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
        
    for key, value in entry_update.dict(exclude_unset=True).items():
        setattr(entry, key, value)
        
    db.commit()
    db.refresh(entry)
    return entry

@router.delete("/entries/{entry_id}")
async def delete_timetable_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(TimetableEntry).filter(TimetableEntry.id == entry_id, TimetableEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
        
    db.delete(entry)
    db.commit()
    return {"message": "Entry deleted"}

@router.get("/dashboard")
async def get_timetable_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Aggregate data for dashboard
    return {"message": "Dashboard data"}
