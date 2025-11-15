# Timetable System Implementation Summary

## ✅ Completed Steps

### 1. Frontend - Hidden Notes Navigation

- **File**: `frontend/components/navbar.tsx`
- **Change**: Commented out the Notes link from navigation
- Notes functionality is temporarily hidden but code remains intact for future use

### 2. Database Models Created

- **File**: `backend/models.py`
- **New Models**:
  - `SchoolSchedule` - Stores school timing configuration
  - `TimeSlot` - Auto-calculated time periods based on schedule
  - `TimetableEntry` - Teacher's weekly schedule entries

### 3. SQL Migration

- **File**: `database/add_timetable_tables.sql`
- Creates all three timetable tables with proper foreign keys and indexes

### 4. Pydantic Schemas

- **File**: `backend/schemas.py`
- Added all request/response schemas for timetable system

---

## 📋 System Design Overview

### How the Timetable System Works

#### 1. **School Schedule Configuration** (One-time setup)

Teachers configure:

- **Start time**: 7:50 AM, 8:00 AM, 8:10 AM, or 8:20 AM
- **Lesson durations**:
  - Single lesson: 30, 35, or 40 minutes
  - Double lesson: 2x single lesson
- **Breaks**:
  - First break: 10-15 minutes (after 2 lessons)
  - Second break (tea/snack): 20-40 minutes (after 2 more lessons)
  - Lunch break: 40-120 minutes (after 2 more lessons)
- **Sessions structure**:
  - Session 1: 2 lessons → break
  - Session 2: 2 lessons → tea break
  - Session 3: 2 lessons → lunch
  - Session 4: 2-3 lessons → end (4-5 PM)

#### 2. **Time Slot Generation** (Automatic)

Based on the schedule configuration, the system automatically calculates all time slots:

```
Example with 40-min lessons starting at 8:00 AM:
- Period 1: 8:00 - 8:40
- Period 2: 8:40 - 9:20
- Break: 9:20 - 9:30 (10 min)
- Period 3: 9:30 - 10:10
- Period 4: 10:10 - 10:50
- Tea Break: 10:50 - 11:20 (30 min)
- Period 5: 11:20 - 12:00
- Period 6: 12:00 - 12:40
- Lunch: 12:40 - 13:40 (60 min)
- Period 7: 13:40 - 14:20
- Period 8: 14:20 - 15:00
```

#### 3. **Timetable Entry Creation** (Weekly recurring)

Teachers add lessons to their weekly timetable:

- Select day of week (Monday-Friday)
- Select time slot
- Select subject
- Optional: Room number, grade section, notes
- Optional: Link to specific curriculum content (strand/substrand/lesson)

#### 4. **Dashboard Display** (Daily view)

When teacher logs in, dashboard shows:

- **Today's lessons**: All lessons scheduled for current day
- **Next lesson**: Which class is next (with countdown)
- **Current lesson**: If in a lesson period, shows what's being taught
- **Curriculum content**: Fetched from linked lessons showing what to teach

---

## 🔄 Next Steps to Implement

### Step 1: Backend API Endpoints (main.py)

Need to create these endpoints:

```python
# School Schedule Management
POST   /api/v1/timetable/schedules          # Create schedule
GET    /api/v1/timetable/schedules          # List user's schedules
GET    /api/v1/timetable/schedules/{id}     # Get one schedule with time slots
PUT    /api/v1/timetable/schedules/{id}     # Update schedule
DELETE /api/v1/timetable/schedules/{id}     # Delete schedule

# Timetable Entry Management
POST   /api/v1/timetable/entries            # Add lesson to timetable
GET    /api/v1/timetable/entries            # Get weekly timetable
GET    /api/v1/timetable/entries/today      # Get today's lessons
GET    /api/v1/timetable/entries/next       # Get next lesson
PUT    /api/v1/timetable/entries/{id}       # Update entry
DELETE /api/v1/timetable/entries/{id}       # Remove entry

# Dashboard/Helper
GET    /api/v1/timetable/dashboard          # Today's schedule + next lesson
```

### Step 2: Frontend Pages

#### 2a. Schedule Setup Page (`/timetable/setup`)

- Form to configure school schedule
- Visual preview of calculated time slots
- Save/update schedule

#### 2b. Weekly Timetable Page (`/timetable`)

- 5x8 grid (Mon-Fri x Time Slots)
- Add lesson button for each cell
- Modal/dropdown to select subject
- Drag-and-drop to rearrange (optional enhancement)
- Color-coded by subject

#### 2c. Enhanced Dashboard

- "Today's Schedule" section showing:
  - Current time indicator
  - Completed lessons (checked)
  - Next lesson highlighted
  - Curriculum content preview
- "Up Next" card with countdown timer
- Quick links to curriculum for each lesson

---

## 🎨 User Flow Example

### First-Time Setup:

1. Teacher navigates to `/timetable/setup`
2. Selects: Start 8:00 AM, 40-min lessons, 10/30/60 min breaks
3. System generates 8 lesson slots + breaks
4. Teacher clicks "Save Schedule"

### Adding Lessons:

1. Teacher navigates to `/timetable`
2. Sees weekly grid with empty slots
3. Clicks "Monday, Period 1"
4. Modal opens: Select subject "Mathematics - Grade 9"
5. Optionally adds room "Lab 3" and section "9A"
6. Saves - lesson appears in grid

### Daily Usage:

1. Teacher logs in morning
2. Dashboard shows:

   ```
   📅 Today's Schedule - Monday

   ✓ Period 1 (8:00-8:40): Mathematics Grade 9
     Room: Lab 3 | Next: INTEGERS - perform basic operations

   ▶ Period 2 (8:40-9:20): Science Grade 8  [NEXT - 15 min]
     Room: Lab 1 | Topic: Photosynthesis

   ○ Break (9:20-9:30)

   ○ Period 3 (9:30-10:10): English Grade 9
   ```

---

## 📊 Database Relationships

```
User
  ├── SchoolSchedule (many)
  │     └── TimeSlot (many, auto-generated)
  │
  └── TimetableEntry (many)
        ├── links to → SchoolSchedule
        ├── links to → TimeSlot
        ├── links to → Subject
        └── optionally links to → Strand/SubStrand/Lesson
```

---

## 🔧 Technical Notes

### Time Slot Generation Algorithm

When a schedule is created/updated, automatically generate time slots:

```python
def generate_time_slots(schedule):
    slots = []
    current_time = schedule.school_start_time
    slot_number = 1

    # Session 1
    for i in range(schedule.lessons_before_first_break):
        slots.append(create_lesson_slot(slot_number, current_time, duration))
        slot_number += 1
        current_time = add_minutes(current_time, duration)

    # First break
    slots.append(create_break_slot("Break", current_time, first_break_duration))
    current_time = add_minutes(current_time, first_break_duration)

    # Continue for remaining sessions...
    return slots
```

### Dashboard "Next Lesson" Logic

```python
def get_next_lesson(user_id):
    now = datetime.now()
    current_day = now.weekday() + 1  # 1=Monday
    current_time = now.strftime("%H:%M")

    # Get today's entries after current time
    next_lesson = query(TimetableEntry)
        .join(TimeSlot)
        .filter(
            TimetableEntry.user_id == user_id,
            TimetableEntry.day_of_week == current_day,
            TimeSlot.start_time > current_time
        )
        .order_by(TimeSlot.start_time)
        .first()

    return next_lesson
```

---

## 💡 Future Enhancements (Post-MVP)

1. **Recurring Events**: Mark lessons that repeat weekly vs one-time
2. **Substitute Teachers**: Allow switching teachers for specific dates
3. **Room Conflicts**: Warn if same room booked twice at same time
4. **Export**: PDF/print version of weekly timetable
5. **Mobile App**: Push notifications for next lesson
6. **Admin Dashboard**: School-wide timetable view
7. **Attendance Integration**: Mark attendance per lesson
8. **Lesson Plans**: Attach detailed plans to timetable entries

---

## 🚀 Ready to Proceed

All database models, schemas, and migrations are ready.

**Next immediate action**:
Implement the backend API endpoints in `main.py` for schedule and timetable management.

Would you like me to proceed with implementing the backend API endpoints?
