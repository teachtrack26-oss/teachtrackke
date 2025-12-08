# Multi-Level Timetable View Feature

## User Request

Teachers who teach across multiple education levels (e.g., teaching in both Grade 6 and Grade 8) currently have to keep switching between "Upper Primary" and "Junior Secondary" views to see their complete schedule.

**Solution Needed**: Add an "All Levels" view that shows a unified timetable with all lessons across all education levels without having to switch.

**Requirement**: This must NOT break the existing level-specific views.

## The Challenge

Different education levels have different time slot durations:
- Pre-Primary: 20 minutes
- Lower Primary: 30 minutes
- Upper Primary: 35 minutes
- Junior Secondary: 40 minutes
- Senior Secondary: 40-45 minutes

These don't align in a traditional grid view!

**Example Problem**:
```
Upper Primary slots:    08:00-08:35, 08:35-09:10, 09:10-09:45...
Junior Secondary slots: 08:00-08:40, 08:40-09:20, 09:20-10:00...
```

You can't overlay these in a simple grid.

## Proposed Solutions

### Option 1: List/Agenda View (Recommended)
When "All Levels" is selected, show a list view instead of a grid:

```
MONDAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 08:00-08:35  Mathematics (Upper Primary - Grade 6A) - Room 12
📚 08:40-09:20  English (Junior Secondary - Grade 8B) - Room 7
🌍 09:20-10:00  Geography (Junior Secondary - Grade 9A) - Room 5
...

TUESDAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
...
```

**Advantages**:
- ✅ Clean, simple
- ✅ Shows all information clearly
- ✅ No grid alignment issues
- ✅ Easy to scan chronologically

### Option 2: Unified Time Grid with 15-Minute Intervals
Create a normalized grid with 15-minute intervals (common divisor of 20, 30, 35, 40):

```
Time    | Mon | Tue | Wed | Thu | Fri
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
08:00   | Math (UP, G6)  | ...
08:15   | ↓              | ...
08:30   | ↓              | ...
08:35   | - - -          | ...
08:40   | English (JS, G8)| ...
08:55   | ↓              | ...
09:10   | ↓              | ...
09:20   | - - -          | ...
```

**Advantages**:
- ✅ Familiar grid view
- ✅ Shows all lessons

**Disadvantages**:
- ❌ Very tall/long grid
- ❌ Complex to implement
- ❌ Hard to scan

### Option 3: Show Only Lesson Start Times
Simplified grid showing just when lessons start, with education level badges:

```
Time    | Monday | Tuesday | Wednesday | Thursday | Friday
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
08:00   | Math [UP-G6]  | ...
08:40   | English [JS-G8]| ...
09:20   | Geo [JS-G9]   | ...
```

## Recommended Implementation

### Backend Changes
**No backend changes needed!** The existing endpoints already support this:
```typescript
// Fetch ALL entries (no education_level filter)
GET /api/v1/timetable/entries
// Returns lessons from all levels
```

### Frontend Changes

1. **Add "All Levels" Option**
   - Update the education level selector to include "All Levels" as the first option
   - Make it the default selection

2. **Modify `loadData()` Function**
   ```typescript
   if (selectedViewLevel === "All Levels") {
     // Don't fetch schedule/time slots (not needed for list view)
     // Just fetch all entries
     const entriesRes = await fetch("/api/v1/timetable/entries", { headers });
     setEntries(await entriesRes.json());
   } else {
     // Existing code for level-specific view
     ...
   }
   ```

3. **Add List View Component**
   ```typescript
   {selectedViewLevel === "All Levels" ? (
     <AllLevelsListView entries={entries} subjects={subjects} />
   ) : (
     <TraditionalGridView ... />
   )}
   ```

4. **Create `AllLevelsListView` Component**
   - Group entries by day of week
   - Sort by start time within each day
   - Display as cards/list items showing:
     - Time range
     - Subject name
     - Education level + Grade
     - Room number
     - Actions (edit/delete)

### Files to Modify

1. ✅ `frontend/app/timetable/page.tsx`
   - Add "All Levels" to education level selector
   - Modify `loadData()` to handle "All Levels"
   - Add conditional rendering for list vs grid view

2. ✅ Create `frontend/components/timetable/AllLevelsListView.tsx`
   - New component for the list view

## Implementation Steps

1. **Add the selector option** (safest first step)
2. **Modify data loading** to handle "All Levels"
3. **Create list view component**
4. **Add conditional rendering**
5. **Test thoroughly** with:
   - Teacher with single level
   - Teacher with multiple levels
   - Switching between "All Levels" and specific levels

## Benefits

- ✅ Teachers see their complete schedule at a glance
- ✅ No more switching between levels
- ✅ Existing level-specific views still work
- ✅ Clean, scalable solution
- ✅ Easy to extend (e.g., filter by subject, day)

## Next Steps

**I recommend we implement Option 1 (List View)** as it s:
- Cleanest user experience
- Simplest to implement
- Most flexible for future enhancements
- No grid alignment headaches

Would you like me to proceed with this implementation?
