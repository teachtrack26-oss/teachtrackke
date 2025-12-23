# Auth Performance & Navigation Fix

## Issues Fixed

### 1. ❌ Admin API called for Teachers → 403 Error
**File:** `frontend/app/timetable/page.tsx`

**Before (broken):**
```typescript
// Try admin endpoint first (works if user has admin access)
const adminRes = await axios.get(
  "/api/v1/admin/curriculum-templates?is_active=true",
  config
);
// Falls back to public endpoint on error...
```

**After (fixed):**
```typescript
// Only call admin endpoint if user is admin; otherwise use public endpoint directly
const isAdmin = user?.is_admin || user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_ADMIN";
const endpoint = isAdmin
  ? "/api/v1/admin/curriculum-templates?is_active=true"
  : "/api/v1/curriculum-templates";

const templatesRes = await axios.get(endpoint, config);
```

**Impact:** Eliminates 403 errors in the console for teacher accounts.

---

### 2. ❌ Auth Refetching on Every Navigation
**File:** `frontend/hooks/useCustomAuth.ts`

**Before (broken):**
- Called `/api/v1/auth/me` on every navigation
- No caching of auth state
- Treated all errors as "not authenticated"

**After (fixed):**
- Added **5-minute global cache** for auth state
- Auth state persists across hook instances (module-level cache)
- Differentiates **401 (session expired)** from **403 (forbidden)**
- Uses `useRef` to prevent duplicate checks

**Impact:** Navigation becomes nearly instant. Auth is only rechecked when:
1. Cache expires (5 min)
2. User explicitly logs out
3. `refreshAuth()` is called (e.g., after login)

---

## How It Works Now

### Navigation Flow (After Fix)
```
1. User clicks NavLink
2. useCustomAuth() runs
3. Checks globalAuthCache
4. If cache valid (< 5 min old):
   → Returns cached user immediately
   → No API call
   → Page renders instantly
5. If cache expired/missing:
   → Calls /api/v1/auth/me
   → Updates cache
   → Page renders
```

### Error Handling (After Fix)
```
401 = Not authenticated → Redirect to /login
403 = Authenticated but forbidden → Log warning, do NOT logout
Other = Network/server error → Log and continue
```

---

## Testing Checklist

1. ✅ Login as **Teacher** → Navigate between pages → Should be instant
2. ✅ Login as **Admin** → Navigate between pages → Should be instant
3. ✅ Teacher visits `/timetable` → No 403 errors in console
4. ✅ Admin visits `/timetable` → Uses admin endpoint correctly
5. ✅ Wait 5+ minutes → Next navigation refetches auth
6. ✅ Logout → Auth cache is cleared

---

## Files Changed

| File | Change |
|------|--------|
| `frontend/hooks/useCustomAuth.ts` | Added global cache, 401/403 differentiation |
| `frontend/app/timetable/page.tsx` | Role-based API endpoint selection |
