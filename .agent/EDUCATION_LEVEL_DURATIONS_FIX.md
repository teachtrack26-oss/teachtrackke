# Different Lesson Durations Per Education Level - FIXED

## What You Wanted

Different lesson durations for different age groups:
- **Pre-Primary (PP1-PP2)**: 20 minutes
- **Lower Primary (Grade 1-3)**: 30 minutes
- **Upper Primary (Grade 4-6)**: 35 minutes
- **Junior Secondary (Grade 7-9)**: 40 minutes
- **Senior Secondary (Grade 10-12)**: 40-45 minutes

This makes perfect sense educationally - younger children need shorter lessons!

## The Problem

Even though you configured different durations in the settings for each education level, when you opened the "Add Lesson" modal and selected different levels, all time slots showed 40 minutes.

**Root Cause**: The "Add Lesson" modal was showing time slots from whatever education level was currently selected in the MAIN timetable view, NOT from the education level you selected IN THE MODAL.

## The Fix Applied

### Backend (Already Done)
✅ `backend/routers/timetable.py` - Fixed `generate_time_slots()` to use consistent single lesson duration

### Frontend (Just Fixed)
✅ Added `modalTimeSlots` state - Separate from the main timetable's `timeSlots`
✅ Modified `handleEducationLevelChange()` - Now fetches time slots when you select an education level in the modal
  ✅ Updated the Time Slot dropdown - Now uses `modalTimeSlots` instead of global `timeSlots`

## How It Works Now

1. **Main Timetable Page**:
   - Select education level at the top (e.g., "Junior Secondary")
   - Shows time slots for that level (e.g., 40-minute slots)

2. **Add Lesson Modal**:
   - Click "Add Lesson"
   - Select **Education Level** (e.g., "Upper Primary")
   - 🔄 **Time slots automatically load** for that level
   - Select **Grade** (e.g., "Grade 4")
   - Select **Time Slot** → Now shows 35-minute slots!

3. **Different Levels Show Different Durations**:
   ```
   Pre-Primary → 20-minute time slots
   08:00-08:20, 08:20-08:40, 08:40-09:00...
   
   Upper Primary → 35-minute time slots
   08:00-08:35, 08:35-09:10, 09:10-09:45...
   
   Junior Secondary → 40-minute time slots
   08:00-08:40, 08:40-09:20, 09:20-10:00...
   ```

## How to Test

1. **Make sure all schedules are saved**:
   - Go to http://localhost:3000/settings/profile
   - Click "Timetable Config" tab
   - For each level, verify the lesson duration and click "Save Schedule"

2. **Test the modal**:
   - Go to http://localhost:3000/timetable
   - Click "Add Lesson" or **"+Add Lesson"** button
   - Select "Pre-Primary" → Time slots should show 20 min durations
   - Change to "Upper Primary" → Time slots should show 35 min durations
   - Change to "Junior Secondary" → Time slots should show 40 min durations

3. **Check Console**:
   - Open browser DevTools (F12)
   - Look for console messages like:
     ```
     Loaded 8 time slots for Upper Primary: [...]
     ```
   - Each time you change education level, you should see new slots loaded

## What Changed in the Code

### Added Modal Time Slots State
```typescript
const [modalTimeSlots, setModalTimeSlots] = useState<any[]>([]);
```

### Updated handleEducationLevelChange
```typescript
const handleEducationLevelChange = async (level: string) => {
  // ... existing code ...
  
  // NEW: Fetch time slots for this education level
  if (level) {
    const slotsRes = await fetch(
      `/api/v1/timetable/time-slots?education_level=${encodeURIComponent(level)}`,
      { headers }
    );
    
    if (slotsRes.ok) {
      const slotsData = await slotsRes.json();
      const lessonSlots = slotsData
        .filter((s: any) => s.slot_type === "lesson")
        .map((s: any, index: number) => ({ ...s, label: `Lesson ${index + 1}` }));
      setModalTimeSlots(lessonSlots);
      console.log(`Loaded ${lessonSlots.length} time slots for ${level}`);
    }
  }
};
```

### Updated Time Slot Dropdown
```typescript
// BEFORE: Used global timeSlots (wrong!)
{timeSlots.map((slot) => ...)}

// AFTER: Uses modalTimeSlots (correct!)
{modalTimeSlots.map((slot) => ...)}
```

## Files Modified

1. ✅ `backend/routers/timetable.py` - Fixed time slot generation
2. ✅ `frontend/app/timetable/page.tsx` - Added modal time slots functionality

## Next Steps

**Test it now!** The changes are applied. When you:
1. Select an education level in the Add Lesson modal
2. The time slots will automatically load with the correct durations for that level
3. No more seeing all 40-minute slots!

**Note**: If you still see issues, try:
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Check that each education level has a saved schedule with different durations in Settings
