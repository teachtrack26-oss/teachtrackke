# Time Slot Duration Issue - FIXED

## Problem

When adding lessons to your timetable, all time slots were showing the same duration (40 minutes), even though you configured both:
- Single Lesson Duration: 40 minutes
- Double Lesson Duration: 80 minutes

## Root Cause

The `generate_time_slots()` function had inconsistent logic:

1. **Session 1 (before first break)** - Used an alternating pattern:
   - Even index (0, 2, 4...) → 40 minutes
   - Odd index (1, 3, 5...) → 80 minutes

2. **Sessions 2, 3, 4** - Always used 40 minutes only

This created:
- Inconsistent behavior between sessions
- Unpredictable lesson durations
- Most lessons were 40 minutes anyway

## How School Timetables Actually Work

In real schools:
- **Time slots are uniform** - All slots are the same duration (e.g., all 40 minutes)
- **Double lessons are scheduled** - When a teacher needs 80 minutes, they book TWO consecutive 40-minute slots
- **The "is_double_lesson" flag** - Marks when a lesson spans two slots

For example, if you have Math from 8:00-9:20:
- Time Slot 1: 8:00-8:40 (Lesson 1)
- Time Slot 2: 8:40-9:20 (Lesson 2)
- You schedule ONE timetable entry marked as `is_double_lesson = true`
- It occupies BOTH slots

## Fix Applied

All time slots now use `single_lesson_duration` consistently (40 minutes in your case).

### Before (Inconsistent):
```
Session 1:
- Lesson 1: 8:00-8:40 (40 min) ← even index
- Lesson 2: 8:40-9:20 (80 min) ← odd index

Sessions 2-4:
- All lessons: 40 min only
```

### After (Consistent):
```
All Sessions:
- Lesson 1: 8:00-8:40 (40 min)
- Lesson 2: 8:40-9:20 (40 min)
- Lesson 3: 9:20-10:00 (40 min)
- ... and so on
```

## How to Use Double Lessons

When adding a lesson to your timetable:

1. **Single Lesson (40 minutes)**:
   - Select one time slot
   - Leave "Double Lesson" checkbox UNCHECKED
   - The lesson occupies ONE slot

2. **Double Lesson (80 minutes)**:
   - Select the FIRST of two consecutive slots
   - CHECK the "Double Lesson" checkbox
   - The lesson will span TWO slots (80 minutes total)

Example:
```
Time Slots:        Your Schedule:
8:00-8:40 (1) ──→  Math (Double Lesson)
8:40-9:20 (2) ──→  [occupied by Math above]
9:20-10:00 (3) ─→  English (Single Lesson)
```

## What You Need to Do

Your existing schedules need to be regenerated with the fixed logic:

1. **Go to http://localhost:3000/settings/profile**
2. **For EACH education level** (Pre-Primary, Lower Primary, Upper Primary, Junior Secondary, Senior Secondary):
   - Click the education level button
   - Make a small change (e.g., change start time and change it back)
   - Click "Save Schedule"
   - This regenerates time slots with the new consistent logic

3. **Refresh your timetable page**
4. **Add lessons** - All time slots will now show consistent durations

## Example Configuration

If you configured:
- School Start: 8:00
- Single Lesson: 40 min
- Lessons Before 1st Break: 2
- 1st Break: 15 min
- Lessons Before 2nd Break: 2
- 2nd Break: 30 min
- Lessons Before Lunch: 2
- Lunch: 60 min
- Lessons After Lunch: 2

You'll get:
```
8:00-8:40    Lesson 1 (40 min)
8:40-9:20    Lesson 2 (40 min)
9:20-9:35    First Break (15 min)
9:35-10:15   Lesson 3 (40 min)
10:15-10:55  Lesson 4 (40 min)
10:55-11:25  Second Break (30 min)
11:25-12:05  Lesson 5 (40 min)
12:05-12:45  Lesson 6 (40 min)
12:45-13:45  Lunch (60 min)
13:45-14:25  Lesson 7 (40 min)
14:25-15:05  Lesson 8 (40 min)
```

**Total: 8 lessons × 40 min = 320 minutes (5 hours 20 min of teaching)**

If you want a double lesson (80 min), you'd schedule it to occupy TWO consecutive slots.

## Files Modified

- `backend/routers/timetable.py` (line 34) - Changed to use `single_lesson_duration` consistently for all sessions
