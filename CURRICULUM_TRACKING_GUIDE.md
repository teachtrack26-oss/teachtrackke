# Curriculum Tracking System - User Guide

## Overview
The Curriculum Tracking System helps teachers monitor their teaching progress across all CBC subjects, strands, and lessons. Track completion, visualize progress, and stay on top of curriculum coverage.

## Features Implemented

### 1. **Curriculum Tracking Dashboard** (`/curriculum/tracking`)
A comprehensive overview of all your curriculum progress:

- **Overview Statistics**:
  - Total subjects being taught
  - Total lessons across all subjects
  - Completed lessons count
  - Average progress percentage

- **Subject-Level Progress**:
  - Individual progress bars for each subject
  - Lessons completed vs total lessons
  - Click "View Details" to see full curriculum

- **Strand-Level Progress**:
  - Progress breakdown by strand within each subject
  - Visual progress bars for each strand
  - Lesson counts per strand

- **Recent Completions Timeline**:
  - List of recently completed lessons
  - Shows subject, grade, and completion date
  - Helps track teaching momentum

### 2. **API Endpoints for Tracking**

#### Mark Lesson as Complete
```
POST /api/v1/lessons/{lesson_id}/complete
```
- Marks a lesson as completed
- Updates `completed_at` timestamp
- Automatically recalculates subject progress percentage
- Returns updated progress

#### Mark Lesson as Incomplete
```
POST /api/v1/lessons/{lesson_id}/uncomplete
```
- Unmarks a lesson (undo completion)
- Clears `completed_at` timestamp
- Recalculates progress

#### Get Subject Lessons
```
GET /api/v1/subjects/{subject_id}/lessons
```
Returns all lessons for a subject with:
- Lesson details (title, number)
- Completion status
- Completed date
- Strand and sub-strand information

#### Get Dashboard Data
```
GET /api/v1/dashboard/curriculum-progress
```
Returns comprehensive tracking data:
- Overall statistics
- Subject-wise progress with strand breakdowns
- Recent completions (last 10)

### 3. **Automatic Progress Calculation**

The system automatically calculates:
- **Subject Progress** = (Completed Lessons / Total Lessons) × 100
- **Strand Progress** = (Completed Lessons in Strand / Total Lessons in Strand) × 100
- **Overall Average** = Sum of all subject progress / Number of subjects

## How to Use

### Step 1: Access the Tracking Dashboard

1. Go to http://localhost:3000/curriculum
2. Click the **"Track Progress"** button (green button)
3. View your comprehensive tracking dashboard

### Step 2: Mark Lessons as Complete (via API)

**Using cURL:**
```bash
# Get your access token from localStorage after login
TOKEN="your_access_token_here"

# Mark lesson as complete
curl -X POST http://localhost:8000/api/v1/lessons/1/complete \
  -H "Authorization: Bearer $TOKEN"

# Mark lesson as incomplete (undo)
curl -X POST http://localhost:8000/api/v1/lessons/1/uncomplete \
  -H "Authorization: Bearer $TOKEN"
```

**Using Python Script:**
```python
import requests

TOKEN = "your_token_here"
BASE_URL = "http://localhost:8000/api/v1"

headers = {"Authorization": f"Bearer {TOKEN}"}

# Mark lesson 1 as complete
response = requests.post(
    f"{BASE_URL}/lessons/1/complete",
    headers=headers
)
print(response.json())
```

### Step 3: View Progress

The dashboard automatically shows:
- ✅ Green progress bars (≥75% complete)
- 🟡 Yellow progress bars (50-74% complete)
- 🟠 Orange progress bars (25-49% complete)
- 🔴 Red progress bars (<25% complete)

### Step 4: Monitor Recent Activity

The right sidebar shows your 10 most recently completed lessons with dates.

## Future Enhancements (To Be Implemented)

### Phase 2: Lesson Management UI
- [ ] Add checkboxes in curriculum detail page to mark lessons complete
- [ ] One-click marking from subject cards
- [ ] Bulk lesson completion
- [ ] Lesson notes and resources

### Phase 3: Advanced Analytics
- [ ] Weekly/monthly completion charts
- [ ] Teaching pace analysis (lessons per week)
- [ ] Curriculum coverage heatmap
- [ ] Predicted completion dates
- [ ] Comparison with recommended pace

### Phase 4: Timetable Integration
- [ ] Link lessons to timetable slots
- [ ] Auto-mark lessons after scheduled class
- [ ] Sync with calendar
- [ ] Lesson reminders

### Phase 5: Reporting
- [ ] Generate progress reports (PDF)
- [ ] Export to Excel/CSV
- [ ] Share progress with administrators
- [ ] Print-friendly summaries

## Testing the System

### Test Scenario 1: Complete a Few Lessons

1. Get lesson IDs from subject:
```bash
curl http://localhost:8000/api/v1/subjects/24/lessons \
  -H "Authorization: Bearer YOUR_TOKEN"
```

2. Mark first 5 lessons as complete:
```bash
for i in {1..5}; do
  curl -X POST http://localhost:8000/api/v1/lessons/$i/complete \
    -H "Authorization: Bearer YOUR_TOKEN"
done
```

3. Refresh the tracking dashboard to see updated progress

### Test Scenario 2: Verify Progress Calculation

1. Add Mathematics Grade 9 (155 lessons total)
2. Mark 77 lessons as complete (should show ~49.7% progress)
3. Check dashboard shows correct percentage
4. Verify strand-level progress matches

### Test Scenario 3: Recent Completions

1. Mark several lessons as complete
2. Check that recent completions sidebar shows them
3. Verify dates are correct
4. Confirm newest completions appear first

## Database Schema

### Lessons Table
```sql
lessons
├── id (PRIMARY KEY)
├── substrand_id (FOREIGN KEY → sub_strands)
├── lesson_number
├── lesson_title
├── description
├── duration_minutes
├── learning_outcomes
├── is_completed (BOOLEAN) ← Tracking field
├── completed_at (TIMESTAMP) ← Tracking field
├── sequence_order
└── created_at
```

### Progress Calculation
- Stored in `subjects` table:
  - `lessons_completed` (INTEGER)
  - `progress_percentage` (DECIMAL)
- Updated automatically when lessons are marked complete/incomplete

## API Response Examples

### Dashboard Progress Response
```json
{
  "overview": {
    "total_subjects": 1,
    "total_lessons": 155,
    "completed_lessons": 15,
    "average_progress": 9.68
  },
  "subjects": [
    {
      "id": 24,
      "subject_name": "Mathematics",
      "grade": "Grade 9",
      "total_lessons": 155,
      "completed_lessons": 15,
      "progress_percentage": 9.68,
      "strands": [
        {
          "strand_code": "1.0",
          "strand_name": "NUMBERS",
          "total_lessons": 28,
          "completed_lessons": 5,
          "progress": 17.86
        }
      ]
    }
  ],
  "recent_completions": [
    {
      "lesson_id": 5,
      "lesson_title": "INTEGERS - Lesson 5",
      "completed_at": "2025-11-12T10:30:00",
      "subject_name": "Mathematics",
      "grade": "Grade 9"
    }
  ]
}
```

## Troubleshooting

### Progress not updating?
- Check that lesson IDs are correct
- Verify token is valid (not expired)
- Check browser console for errors
- Refresh the dashboard page

### Lessons showing as null?
- Re-add the subject from template (old subjects don't have lessons)
- Use `reset_template_subjects.py` to delete and re-import

### Can't access tracking dashboard?
- Ensure you're logged in
- Check token in localStorage
- Verify backend is running on port 8000

## Next Steps

1. **Test the system** - Add a subject and mark some lessons complete
2. **Provide feedback** - What additional features would help?
3. **Plan lesson UI** - Should we add checkboxes to curriculum detail page?
4. **Analytics needs** - What reports would be most useful?

The tracking system is now live and functional! Access it at:
- **Dashboard**: http://localhost:3000/curriculum/tracking
- **API Docs**: http://localhost:8000/docs (FastAPI Swagger UI)
