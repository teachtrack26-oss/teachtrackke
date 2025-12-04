# 🔌 SaaS API Endpoints Reference

## Authentication Required
All endpoints require `Authorization: Bearer <token>` header.

---

## 👥 School Management Endpoints

### Create School
```http
POST /api/v1/schools
Content-Type: application/json

{
  "name": "Nairobi Primary School",
  "max_teachers": 50
}
```
*   **Access**: School Admins only
*   **Returns**: School object

### Get My School
```http
GET /api/v1/schools/me
```
*   **Access**: Any school member
*   **Returns**: School details

### Invite Teacher
```http
POST /api/v1/schools/teachers
Content-Type: application/json

{
  "email": "teacher@example.com"
}
```
*   **Access**: School Admins only
*   **Returns**: Teacher object
*   **Note**: User must exist (registered)

### List School Teachers
```http
GET /api/v1/schools/teachers
```
*   **Access**: Any school member
*   **Returns**: Array of teachers

### Remove Teacher
```http
DELETE /api/v1/schools/teachers/{teacher_id}
```
*   **Access**: School Admins only
*   **Returns**: Success message

---

## 👑 Super Admin Endpoints

### Platform Statistics
```http
GET /api/v1/admin/stats
```
*   **Access**: Super Admins only
*   **Returns**:
```json
{
  "total_users": 150,
  "total_teachers": 120,
  "total_school_admins": 25,
  "total_schools": 20,
  "total_subjects": 450,
  "subscriptions": {
    "basic": 80,
    "premium": 40,
    "school_sponsored": 30
  }
}
```

### List All Users
```http
GET /api/v1/admin/users?skip=0&limit=50&role=TEACHER&subscription_type=INDIVIDUAL_BASIC
```
*   **Access**: Super Admins only
*   **Query Params**:
    *   `skip`: Pagination offset (default: 0)
    *   `limit`: Page size (default: 50, max: 100)
    *   `role`: Filter by role (optional)
    *   `subscription_type`: Filter by subscription (optional)
*   **Returns**: Paginated user list with metadata

### List All Schools
```http
GET /api/v1/admin/schools
```
*   **Access**: Super Admins only
*   **Returns**: Array of schools with stats

### Upgrade User to Premium
```http
PUT /api/v1/admin/users/{user_id}/upgrade
```
*   **Access**: Super Admins only
*   **Returns**: Success message
*   **Note**: Only works for Individual Basic users

### Update User Role
```http
PUT /api/v1/admin/users/{user_id}/role
Content-Type: application/json

{
  "role": "SCHOOL_ADMIN"
}
```
*   **Access**: Super Admins only
*   **Returns**: Success message
*   **Note**: Cannot modify other Super Admins

### Ban User
```http
DELETE /api/v1/admin/users/{user_id}
```
*   **Access**: Super Admins only
*   **Returns**: Success message
*   **Note**: Cannot ban Super Admins

---

## 📚 Subject Limit Logic

When calling `POST /api/v1/subjects`:

*   **Individual Basic** users:
    *   Can create up to 4 subjects
    *   5th subject returns `403 Forbidden` with upgrade message

*   **Individual Premium** users:
    *   Unlimited subjects

*   **School Sponsored** users:
    *   Unlimited subjects (paid by school)

---

## 🔐 Role-Based Access Summary

| Endpoint | Teacher | School Admin | Super Admin |
|----------|---------|--------------|-------------|
| Create subject (4 limit) | ✅ | ✅ | ✅ |
| Create school | ❌ | ✅ | ✅ |
| Invite teachers | ❌ | ✅ (own school) | ✅ |
| View platform stats | ❌ | ❌ | ✅ |
| Upgrade users | ❌ | ❌ | ✅ |
| Ban users | ❌ | ❌ | ✅ |

---

## 💡 Common Use Cases

### 1. School Admin Onboards Teachers
```bash
# Step 1: School Admin creates school
POST /api/v1/schools {"name": "ABC School", "max_teachers": 30}

# Step 2: Teachers register individually
POST /api/v1/auth/register {email, password, role: "TEACHER"}

# Step 3: School Admin invites them
POST /api/v1/schools/teachers {"email": "teacher@example.com"}

# Result: Teacher now has unlimited subjects (SCHOOL_SPONSORED)
```

### 2. Super Admin Supports User
```bash
# View user details
GET /api/v1/admin/users?skip=0&limit=10

# Upgrade user manually
PUT /api/v1/admin/users/42/upgrade

# User now has unlimited subjects (INDIVIDUAL_PREMIUM)
```

### 3. Individual Teacher Hits Limit
```bash
# Teacher tries to create 5th subject
POST /api/v1/subjects {subject_data}

# Response: 403 Forbidden
{
  "detail": "Subject limit reached (4/4). Upgrade to Premium for unlimited subjects."
}

# Frontend shows "Upgrade" button
```

---

## 🛠️ Error Responses

### 403 Forbidden
*   Subject limit exceeded
*   Insufficient permissions
*   School capacity limit reached

### 404 Not Found
*   User/School doesn't exist
*   Teacher not in your school

### 400 Bad Request
*   Invalid data
*   School already exists
*   User already in a school

---

## 📝 Notes

*   All timestamps in UTC
*   Email must be unique
*   School admins can only manage their own school
*   Super admins can see/modify everything (except other super admins)
