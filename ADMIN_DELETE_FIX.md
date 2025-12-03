# Admin Delete User Fix

## Issue
The user reported that deleting a user from the Super Admin panel showed a success message but the user remained in the list.

## Diagnosis
The issue was caused by a duplicate route definition in `backend/main.py`.
- A function `ban_user` was defined with `@app.delete(f"{settings.API_V1_PREFIX}/admin/users/{{user_id}}")`.
- A function `delete_user_account` was defined later with the same path and method.
- FastAPI uses the first matching route, so `ban_user` was being executed.
- `ban_user` only set `subscription_status = CANCELLED` (Soft Ban), it did not delete the user record.

## Fix
- Renamed the `ban_user` endpoint to `ban_user_account`.
- Changed the HTTP method to `POST`.
- Changed the path to `/admin/users/{user_id}/ban`.

## Result
- The `DELETE /admin/users/{user_id}` request will now correctly route to `delete_user_account`.
- This function performs `db.delete(user)`, which permanently removes the user and their data, as expected by the frontend "Delete" button.

## Verification
- Checked `frontend/app/admin/users/page.tsx` to confirm it expects a hard delete (confirmation message says "This will delete all their subjects and progress").
- Verified `delete_user_account` implementation performs a hard delete.
