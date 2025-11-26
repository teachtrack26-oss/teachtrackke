# ✅ NextAuth v5 Migration Fix

I detected that you are using **NextAuth v5 (beta)** but the configuration was for **NextAuth v4**. This caused the `Function.prototype.apply` error.

## 🔧 What I Fixed

### 1. Created `frontend/lib/auth.ts`
This file now holds the NextAuth v5 configuration.
- Uses `NextAuth({...})` to create handlers.
- Configured Google provider and callbacks correctly for v5.

### 2. Updated `frontend/app/api/auth/[...nextauth]/route.ts`
- Now imports handlers from `@/lib/auth`.
- Exports `GET` and `POST` correctly for App Router.

---

## 🎯 What YOU Need to Do Now

### Step 1: Stop Services
```bash
Ctrl + C
```

### Step 2: Delete Cache (Important)
```bash
cd frontend
rm -rf .next
cd ..
```

### Step 3: Restart Services
```bash
npm run dev:all
```

### Step 4: Test Google Sign-In
1. Wait for services to be ready.
2. **Clear browser cache**: Ctrl+Shift+Delete
3. **Open incognito**: Ctrl+Shift+N
4. **Go to**: `http://localhost:3000/login`
5. **Click**: "Continue with Google"
6. **Should work!** ✅

---

## 🔍 Troubleshooting

If you still see errors:
1. Check terminal for any new errors.
2. Ensure `.env.local` has `NEXTAUTH_SECRET` and Google credentials.
3. Ensure Google Cloud Console has `http://localhost:3000` as origin and `http://localhost:3000/api/auth/callback/google` as redirect URI.

**Note:** NextAuth v5 is very new, but this configuration is the standard way to use it with Next.js App Router.
