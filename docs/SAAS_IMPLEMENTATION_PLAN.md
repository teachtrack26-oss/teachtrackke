# 🚀 TeachTrack SaaS Transformation Plan

## 🎯 Objective
Transform TeachTrack from a single-user tool into a scalable **SaaS Platform** supporting two distinct business models:

1.  **School Mode (B2B)**: Schools purchase licenses; teachers get full access automatically.
2.  **Individual Mode (B2C)**: Independent teachers subscribe directly.
    *   **Basic Plan**: Limited to **4 Subjects**.
    *   **Premium Plan**: Unlimited access.

---

## 🏗️ 1. Database Architecture Changes

We need to modify the database to support hierarchy and subscriptions.

### A. New Table: `schools`
Represents an institution paying for licenses.
- `id`: Primary Key
- `name`: School Name
- `admin_id`: Link to the User who manages this school
- `subscription_status`: `ACTIVE`, `INACTIVE`, `PAST_DUE`
- `max_teachers`: Number of licenses purchased (e.g., 50)
- `created_at`: Timestamp

### B. Update Table: `users`
Add fields to handle roles and limits.
- `role`: Enum (`SUPER_ADMIN`, `SCHOOL_ADMIN`, `TEACHER`)
- `school_id`: Foreign Key (Links teacher to a school. NULL for individuals)
- `subscription_type`: Enum (`SCHOOL_SPONSORED`, `INDIVIDUAL_BASIC`, `INDIVIDUAL_PREMIUM`)
- `subscription_status`: `ACTIVE`, `INACTIVE`

---

## 🛡️ 2. The "Gatekeeper" Logic (Backend)

We will implement logic in the API to enforce limits.

### A. Subject Limit (The "4 Subject" Rule)
**Logic Hook:** Before creating a new Subject (`POST /api/v1/subjects`):
1.  Check `user.subscription_type`.
2.  If `SCHOOL_SPONSORED` or `INDIVIDUAL_PREMIUM` → **ALLOW**.
3.  If `INDIVIDUAL_BASIC`:
    *   Count existing subjects for this user.
    *   If count < 4 → **ALLOW**.
    *   If count >= 4 → **DENY** (Return 403 Forbidden: "Upgrade required").

### B. Role-Based Access Control (RBAC)
- **Super Admin**: Can access `/api/admin/*` (Manage schools, view all stats).
- **School Admin**: Can access `/api/school/*` (Add/Remove teachers from their school).
- **Teachers**: Can access standard teaching tools.

---

## 💻 3. Frontend UI/UX Updates

### A. Registration Flow
- **Option 1: "I am a School"** → Creates School Admin account + School entity.
- **Option 2: "I am a Teacher"** → Creates Individual account (starts on Basic).

### B. Dashboard Variations
- **School Admin View**: Shows list of teachers, license usage, and school stats.
- **Teacher View**: The standard dashboard we have now.

### C. Upgrade Prompts
- Visual indicator of Subject Limit (e.g., "Subjects: 3/4").
- "Upgrade" button for Individual Basic users when they hit the limit.

---

## 📅 Execution Roadmap

### Phase 1: Foundation (Backend) ✅ **COMPLETE**
1.  [✅] Update `models.py` with new tables and fields.
2.  [✅] Create migration script to update database.
3.  [✅] Update `auth_routes.py` to handle roles during registration.

### Phase 2: The Logic (Backend) ✅ **COMPLETE**
4.  [✅] Implement the "Subject Limit" check in `subjects.py`.
5.  [✅] Create "School Management" endpoints (Invite teacher, remove teacher).

### Phase 3: The Interface (Frontend) ✅ **COMPLETE**
6.  [✅] Update Registration page to allow selecting "Teacher" or "School Admin".
7.  [✅] Update Dashboard to show "Subject Limit" indicator for Basic users.
8.  [✅] Add "Upgrade to Premium" button (placeholder for now).
9.  [✅] Create School Admin Dashboard (Manage School & Teachers).

### Phase 4: Super Admin Tools ✅ **COMPLETE**
9.  [✅] Create a hidden "Super Admin" dashboard for YOU to manage everyone.
10. [✅] Platform stats, user management, manual upgrades, and ban functionality.

---

## 💰 Future Payment Integration
*Once the structure is built, we can plug in Stripe or M-Pesa to automatically flip the `subscription_status` from INACTIVE to ACTIVE upon payment.*
