# Admin User Management System

## Overview

Complete user management system for TeachTrack administrators to monitor teachers, manage roles, and reset progress.

## Features Implemented

### 1. Database Schema

- **New Column**: `is_admin` (BOOLEAN, default FALSE) added to `users` table
- **Migration**: `database/add_admin_role.sql` contains ALTER TABLE and admin user setup
- **Admin Users**:
  - kevinmugo359@gmail.com (admin)
  - demo@teachtrack.com (admin)

### 2. Backend API Endpoints

#### GET `/api/v1/admin/users`

Lists all users with their subjects and progress details.

**Response:**

```json
{
  "users": [
    {
      "id": 1,
      "email": "teacher@example.com",
      "full_name": "John Doe",
      "school": "ABC School",
      "grade_level": "9",
      "is_admin": false,
      "auth_provider": "local",
      "created_at": "2024-01-01T00:00:00",
      "subjects_count": 3,
      "subjects": [
        {
          "id": 1,
          "subject_name": "Mathematics",
          "grade": "Grade 9",
          "total_lessons": 120,
          "lessons_completed": 45,
          "progress_percentage": 37.5
        }
      ]
    }
  ],
  "total": 2
}
```

#### PATCH `/api/v1/admin/users/{user_id}/role`

Toggle user's admin role.

**Request Body:**

```json
{
  "is_admin": true
}
```

**Features:**

- Prevents removing admin role from yourself
- Returns success message with new role status

#### DELETE `/api/v1/admin/users/{user_id}`

Delete a user account and all associated data.

**Features:**

- CASCADE deletes subjects, strands, substrands, lessons, notes
- Prevents deleting your own account
- Returns confirmation message

#### POST `/api/v1/admin/users/{user_id}/reset-progress`

Reset user's lesson completion progress.

**Request Body (optional):**

```json
{
  "subject_id": 5
}
```

**Features:**

- If `subject_id` provided: resets that subject only
- If omitted: resets ALL subjects for the user
- Clears `is_completed` and `completed_at` for all lessons
- Resets subject's `lessons_completed` and `progress_percentage`

### 3. Frontend User Management Page

**Location:** `/app/admin/users/page.tsx`

#### Features:

1. **Stats Dashboard**

   - Total Users count
   - Admin Users count
   - Total Subjects across all users

2. **Users Table**

   - User details: name, email, school, grade level
   - Subject count with expand/collapse
   - Role badge (Admin/Teacher)
   - Action buttons: toggle role, reset progress, delete

3. **Expanded User View**

   - Shows all subjects with progress bars
   - Individual subject reset buttons
   - Visual progress indicators (percentage and lesson counts)

4. **User Actions**

   - **Toggle Role**: Promote to admin or demote to teacher
   - **Reset Progress**: Reset all progress or per-subject
   - **Delete User**: Remove account with confirmation

5. **Confirmations**
   - Delete user: Shows warning about data loss
   - Reset progress: Confirms action before execution
   - Cannot delete yourself
   - Cannot remove your own admin role

### 4. Admin Dashboard Integration

**Updated:** `/app/admin/dashboard/page.tsx`

Added "User Management" quick action button:

- Icon: FiUsers (blue)
- Links to `/admin/users`
- Positioned alongside "Import Curriculum" button

## Access Control

All admin endpoints require:

1. Valid JWT authentication token
2. `is_admin` column set to `true` in database

Non-admin users receive `403 Forbidden` response.

## Usage Guide

### For Administrators:

1. **View All Users**

   - Navigate to Admin Dashboard → User Management
   - See list of all registered teachers
   - Click expand icon to view subjects and progress

2. **Promote User to Admin**

   - Click shield icon next to user
   - Confirm role change
   - User gains admin privileges immediately

3. **Reset User Progress**

   - Option 1: Click sync icon to reset all progress
   - Option 2: Expand user, click reset on specific subject
   - Useful for testing or new school terms

4. **Delete User Account**
   - Click trash icon next to user
   - Confirm deletion (cannot be undone)
   - All user data (subjects, progress, notes) removed

### For Developers:

**Testing Admin Features:**

```bash
# Login as admin user
POST http://192.168.0.102:8000/api/v1/auth/login
{
  "email": "kevinmugo359@gmail.com",
  "password": "your_password"
}

# Use returned token for all admin requests
Authorization: Bearer <token>
```

**Making Users Admin via SQL:**

```sql
UPDATE users
SET is_admin = TRUE
WHERE email = 'user@example.com';
```

## Security Considerations

1. **Self-Protection**: Admins cannot delete themselves or remove their own admin role
2. **Authorization**: All endpoints verify admin status before execution
3. **Confirmation**: Destructive actions require user confirmation
4. **Cascade Deletes**: Properly configured to maintain database integrity

## Files Modified/Created

### Backend:

- `backend/models.py` - Added `is_admin` column to User model
- `backend/main.py` - Added 4 admin API endpoints (lines 1300-1500)
- `database/add_admin_role.sql` - Database migration script

### Frontend:

- `frontend/app/admin/users/page.tsx` - New user management page (400+ lines)
- `frontend/app/admin/dashboard/page.tsx` - Added user management button

## Testing Checklist

- [x] List all users API works
- [x] User details show correct subject counts
- [x] Toggle admin role succeeds
- [x] Cannot remove own admin role
- [x] Delete user removes all data
- [x] Cannot delete own account
- [x] Reset progress clears lesson completions
- [x] Reset specific subject works
- [x] Non-admin users blocked (403)
- [x] Frontend displays all data correctly
- [x] Confirmations appear for destructive actions

## Next Steps

Potential future enhancements:

1. Bulk user operations (delete multiple, reset multiple)
2. User activity logs and audit trail
3. Email notifications to users (role changes, resets)
4. User search and filtering
5. Export user data to CSV/Excel
6. User statistics dashboard (most active, progress leaders)
7. Temporary admin role assignment (time-limited)
8. User groups/departments management

## Support

For issues or questions, contact the system administrator or check the API documentation at:
http://192.168.0.102:8000/docs
