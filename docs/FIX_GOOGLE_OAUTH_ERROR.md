# 🔧 Fix Google OAuth Error - "The given origin is not allowed"

## ❌ Error You're Seeing

```
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
Failed to load resource: the server responded with a status of 403
```

**What this means:** Your Google Cloud OAuth Client doesn't have your frontend URL authorized.

**Your Client ID:** `1091679198456-kuap2p7jfcdskj1hle12jlqcfpjgmje9.apps.googleusercontent.com`

---

## ✅ Quick Fix (5 Minutes)

### Step 1: Open Google Cloud Console

1. Go to: **https://console.cloud.google.com/apis/credentials**
2. Sign in with the Google account that created the OAuth client
3. Find your OAuth 2.0 Client ID: `109167919845...` (Web client)

### Step 2: Edit OAuth Client

1. Click on the **pencil icon** (Edit) next to your OAuth client
2. You'll see a form with two important sections

### Step 3: Add Authorized JavaScript Origins

In the **"Authorized JavaScript origins"** section, add these URLs:

```
http://localhost:3000
http://127.0.0.1:3000
```

**If you're testing on mobile/other devices, also add**:
```
http://10.2.0.2:3000
http://YOUR_COMPUTER_IP:3000
```

To find your computer IP:
```bash
ipconfig
# Look for IPv4 Address under your active network
```

### Step 4: Add Authorized Redirect URIs (if not already there)

In the **"Authorized redirect URIs"** section, add:

```
http://localhost:3000
http://localhost:3000/auth/callback
http://localhost:3000/api/auth/callback/google
```

### Step 5: Save Changes

1. Click **"SAVE"** at the bottom of the form
2. Wait 1-2 minutes for changes to propagate

### Step 6: Clear Browser Cache & Reload

1. In your browser (with frontend open), press: **Ctrl + Shift + Delete**
2. Clear **Cached images and files**
3. Close and reopen the browser tab
4. Navigate back to `http://localhost:3000`
5. Try Google Sign-In again

---

## 🎯 Visual Guide

Your OAuth client configuration should look like this:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Authorized JavaScript origins
  ──────────────────────────────────────────────────
  URIs  1  http://localhost:3000
  URIs  2  http://127.0.0.1:3000
  URIs  3  http://10.2.0.2:3000         ← Your computer IP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Authorized redirect URIs
  ──────────────────────────────────────────────────
  URIs  1  http://localhost:3000/auth/callback
  URIs  2  http://localhost:3000/api/auth/callback/google
  URIs  3  http://127.0.0.1:3000/auth/callback
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🧪 Testing After Fix

### Test 1: Check Console Logs

1. Open browser DevTools (F12)
2. Go to Console tab
3. Reload page
4. You should see: 
   ```
   Google Client ID loaded: Yes (1091679198...)
   ```
5. The 403 error should be GONE ✅

### Test 2: Try Google Sign-In

1. Click "Sign in with Google" button
2. Google popup should appear (no 403 error)
3. Select your account
4. Authorize the app
5. You should be redirected back and logged in ✅

---

## 🔍 Still Not Working? Alternative Solutions

### Solution A: Create New OAuth Client

If editing doesn't work, create a fresh OAuth client:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Application type: **Web application**
4. Name: `TeachTrack Frontend`
5. Add Authorized JavaScript origins:
   ```
   http://localhost:3000
   http://127.0.0.1:3000
   ```
6. Add Authorized redirect URIs:
   ```
   http://localhost:3000/auth/callback
   ```
7. Click **CREATE**
8. Copy the new **Client ID**
9. Update your frontend `.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=<new-client-id-here>
   ```
10. Restart frontend: `npm run dev`

### Solution B: Check OAuth Consent Screen

1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Make sure:
   - **Publishing status**: Testing (for development)
   - **Test users**: Add your email address
3. If not in "Testing" mode, app won't work for non-test users

### Solution C: Verify Frontend Environment Variable

Check your frontend `.env.local` or `.env` file has:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1091679198456-kuap2p7jfcdskj1hle12jlqcfpjgmje9.apps.googleusercontent.com
```

**Important**: 
- Must start with `NEXT_PUBLIC_` for Next.js
- Must match EXACTLY with Google Cloud Console
- Restart frontend after changing

---

## 📱 For Mobile Testing (After fixing desktop)

If you want to test on your phone:

### Step 1: Find Your Computer's IP

```bash
ipconfig
# Look for: IPv4 Address . . . : 192.168.X.X
```

### Step 2: Add to Google OAuth

In Google Cloud Console, add:
```
http://192.168.X.X:3000
```
(Replace with your actual IP)

### Step 3: Access Frontend from Phone

On your phone browser:
```
http://192.168.X.X:3000
```

---

## 🚨 Common Mistakes

### ❌ Wrong: Adding HTTPS when using HTTP
```
https://localhost:3000  ← Don't add this
```

### ✅ Correct: Match your actual URL
```
http://localhost:3000   ← Use this
```

### ❌ Wrong: Forgetting to save changes
After editing OAuth client, you MUST click **SAVE**

### ❌ Wrong: Not waiting for propagation
Changes can take 1-2 minutes to take effect. Be patient!

---

## 🎓 Understanding the Error

**What's happening:**
1. Your frontend loads from: `http://localhost:3000`
2. Google Sign-In button tries to connect to Google
3. Google checks: "Is localhost:3000 allowed for this Client ID?"
4. Google says: "NO" → 403 error
5. Sign-in fails

**After fix:**
1. Frontend loads from: `http://localhost:3000`
2. Google checks authorization
3. Google finds: "localhost:3000 is in the allowed list" ✅
4. Sign-in works!

---

## ✅ Success Checklist

After completing the fix, you should:

- [ ] No 403 errors in browser console
- [ ] Google Sign-In button loads properly
- [ ] Clicking button opens Google popup (not an error)
- [ ] Can select Google account
- [ ] Gets redirected back to your app
- [ ] User is logged in successfully

---

## 📞 Need More Help?

If still having issues, collect this info:

1. **Screenshot of Google Cloud Console** OAuth client settings
   (cover up sensitive parts of Client ID/Secret)

2. **Browser console errors** (copy full error messages)

3. **Frontend URL** you're accessing (from browser address bar)

4. **Environment variable** value (just verify it exists, don't share)

---

## 🎯 Quick Action Plan

**Right now, do this:**

1. ✅ Go to https://console.cloud.google.com/apis/credentials
2. ✅ Edit your OAuth client (the one with ID: 1091679198456...)
3. ✅ Add `http://localhost:3000` to Authorized JavaScript origins
4. ✅ Click SAVE
5. ✅ Wait 2 minutes
6. ✅ Clear browser cache (Ctrl+Shift+Delete)
7. ✅ Reload page
8. ✅ Try Google Sign-In again

**Total time: 5 minutes** ⏱️

---

Good luck! The fix is simple - just need to authorize your frontend URL in Google Cloud Console. 🚀
