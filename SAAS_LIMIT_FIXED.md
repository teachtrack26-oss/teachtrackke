# SaaS Limit Fix Applied

## Issue Summary

Two major issues were discovered and fixed:

### Issue 1: Subject Limit Not Enforced

Users on the "Individual Basic" plan were able to exceed the 4-subject limit because:

1. **Wrong Subscription Type**: The user `zlatankent8112@gmail.com` had `subscription_type = SCHOOL_SPONSORED` instead of `INDIVIDUAL_BASIC`. This happened when their role was changed earlier.
2. **Missing Validation**: The "Use Template" endpoint (`/curriculum-templates/{id}/use`) was missing the limit check.

### Issue 2: Subjects Showing 0/0 Lessons

The Grade 9 curriculum templates (CRE, Social Studies, Integrated Science, Pre-Technical Studies, Kiswahili, Agriculture, Creative Arts) were **incomplete**:

- They had strands but NO substrands
- Without substrands, no lessons could be created

## Fixes Applied

### Fix 1: Backend Validation (main.py)

Added subscription limit checks in `backend/main.py`:

1. **`POST /api/v1/curriculum-templates/{template_id}/use`**

   - If user is `INDIVIDUAL_BASIC` and has >= 4 subjects, reject with 403 Forbidden.

2. **`POST /api/v1/timetable/entries`** (line ~6900)
   - When auto-creating a subject from a template, check the limit first.

### Fix 2: User Subscription Type

Ran `fix_subscription_type.py` to change user from `SCHOOL_SPONSORED` to `INDIVIDUAL_BASIC`.

### Fix 3: Grade 9 Templates Re-imported

Ran `fix_g9_templates.py` to properly import all Grade 9 curriculum templates from JSON files:

- ✅ Integrated Science: 3 strands, 9 substrands
- ✅ Pre-Technical Studies: 5 strands, 14 substrands
- ✅ Christian Religious Education: 5 strands, 16 substrands
- ✅ Social Studies: 5 strands, 18 substrands
- ✅ Kiswahili: 15 strands, 60 substrands
- ✅ Agriculture: 4 strands, 10 substrands
- ✅ Creative Arts: 3 strands, 15 substrands

### Fix 4: Broken User Subjects Deleted

Ran `fix_user_subjects.py` to delete the 4 subjects that had 0 lessons (created from broken templates).

## Current State

- User `zlatankent8112@gmail.com`:
  - Subscription: `INDIVIDUAL_BASIC` (4-subject limit applies)
  - Current subjects: 1/4 (English - Grade 9)
- All Grade 9 templates are now complete with strands, substrands, and will generate proper lessons.

## Verification

User can now:

1. Add up to 3 more subjects (max 4 total)
2. When adding subjects, lessons will be properly created
3. Attempting to add a 5th subject will show: "Basic Plan is limited to 4 subjects"
