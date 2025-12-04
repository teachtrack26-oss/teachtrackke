# Curriculum Management Feature

## Overview

A comprehensive admin interface for managing curriculum templates across all CBC education levels. Admins can view, create, edit, and deactivate learning areas for different grades.

## Features Implemented

### Backend (FastAPI)

#### New Endpoints (Admin Only)

All endpoints require admin authentication via `get_current_admin_user` dependency.

1. **GET /api/v1/admin/curriculum-templates**

   - List all curriculum templates
   - Optional filters: `education_level`, `grade`, `is_active`
   - Returns templates sorted by education level, grade, and subject name
   - Response: Array of `CurriculumTemplateResponse`

2. **POST /api/v1/admin/curriculum-templates**

   - Create a new curriculum template
   - Validates against duplicates (same education_level + grade + subject)
   - Request body: `CurriculumTemplateCreate`
   - Response: `CurriculumTemplateResponse`

3. **PUT /api/v1/admin/curriculum-templates/{template_id}**

   - Update an existing curriculum template
   - Partial updates supported (only provided fields updated)
   - Duplicate validation on updates
   - Request body: `CurriculumTemplateUpdate`
   - Response: `CurriculumTemplateResponse`

4. **DELETE /api/v1/admin/curriculum-templates/{template_id}**
   - Soft delete by setting `is_active = False`
   - Response: Success message with template ID

#### New Schemas

Located in `backend/schemas.py`:

- `CurriculumTemplateBase`: Base schema with common fields
- `CurriculumTemplateCreate`: For creating new templates
- `CurriculumTemplateUpdate`: For updating templates (all fields optional)
- `CurriculumTemplateResponse`: Response schema with timestamps

#### Authentication

- `get_current_admin_user()`: New dependency function that checks `user.is_admin`
- Returns 403 Forbidden if user is not an admin

### Frontend (Next.js/React)

#### New Admin Page

**Location**: `frontend/app/admin/curriculum/page.tsx`

**Features**:

1. **View All Templates**

   - Grouped by education level
   - Table view with Subject Name, Grade, Status, Last Updated
   - Visual summary stats (Total, Active, Education Levels, Filtered Results)

2. **Filtering**

   - Filter by Education Level (cascading)
   - Filter by Grade (dependent on education level selection)
   - Filter by Status (All/Active/Inactive)
   - Clear filters button

3. **Add New Subject**

   - Modal form with cascading dropdowns
   - Fields: Education Level, Grade, Subject Name, Active status
   - Validation: All fields required (except Active checkbox)
   - Duplicate detection via backend

4. **Edit Existing Subject**

   - Modal form pre-populated with current values
   - Same validation as Add form
   - Updates timestamp automatically

5. **Deactivate Subject**
   - Soft delete confirmation dialog
   - Sets `is_active = False` instead of hard delete

#### Navigation

Added "Curriculum Management" quick action button to admin dashboard:

- Location: `frontend/app/admin/dashboard/page.tsx`
- Purple book icon
- Routes to `/admin/curriculum`

## Education Levels Structure

The system supports the following CBC education levels:

```typescript
const EDUCATION_LEVELS = [
  "Pre-Primary", // PP1, PP2
  "Lower Primary", // Grade 1, 2, 3
  "Upper Primary", // Grade 4, 5, 6
  "Junior Secondary", // Grade 7, 8, 9
  "Senior Secondary", // Grade 10, 11, 12
];
```

## Database Schema

The `curriculum_templates` table includes:

- `id`: Primary key
- `education_level`: Education level (VARCHAR 50)
- `grade`: Grade level (VARCHAR 20)
- `subject`: Subject/learning area name (VARCHAR 100)
- `is_active`: Active status (BOOLEAN, default TRUE)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp (auto-updates on changes)

## Usage

### For Admins

1. **Access Curriculum Management**

   - Log in as admin
   - Navigate to Admin Dashboard
   - Click "Curriculum Management" card

2. **Add a New Subject**

   - Click "Add New Subject" button
   - Select Education Level
   - Select Grade (filtered by level)
   - Enter Subject Name
   - Check/uncheck Active status
   - Click "Add Subject"

3. **Edit a Subject**

   - Find the subject in the table
   - Click the edit (pencil) icon
   - Modify fields as needed
   - Click "Update Subject"

4. **Deactivate a Subject**

   - Find the subject in the table
   - Click the delete (trash) icon
   - Confirm in the dialog
   - Subject is soft-deleted (can be reactivated via edit)

5. **Filter Templates**
   - Use filter dropdowns at top of page
   - Education Level → Grade → Status
   - Click "Clear Filters" to reset

## API Testing

You can test the endpoints using curl or Postman:

```bash
# Get all templates (requires admin token)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:8000/api/v1/admin/curriculum-templates

# Filter by education level
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:8000/api/v1/admin/curriculum-templates?education_level=Junior%20Secondary"

# Create new template
curl -X POST \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"education_level":"Upper Primary","grade":"Grade 5","subject":"Environmental Activities","is_active":true}' \
  http://localhost:8000/api/v1/admin/curriculum-templates

# Update template
curl -X PUT \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Environmental Studies"}' \
  http://localhost:8000/api/v1/admin/curriculum-templates/1

# Deactivate template
curl -X DELETE \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:8000/api/v1/admin/curriculum-templates/1
```

## Security

- All endpoints require authentication
- Only users with `is_admin = True` can access
- Non-admin users receive 403 Forbidden
- Soft deletes preserve data integrity

## Future Enhancements

Potential improvements:

- Bulk import/export CSV
- Template versioning/history
- Subject categories/tags
- Curriculum strand management integration
- Audit logs for all changes
- Subject description field
- Reactivate soft-deleted templates via UI
- Search functionality within subjects
