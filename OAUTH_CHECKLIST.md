# ✅ Google OAuth Setup - Quick Checklist

Print this or keep it on another screen!

---

## 📋 **PRE-SETUP**

- [ ] Have Google account ready (teachtrack26@gmail.com or other)
- [ ] Know your current ngrok URL: `https://rubeolar-jaxon-unintuitively.ngrok-free.dev`
- [ ] Have a text editor ready (Notepad is fine)

---

## 🔧 **GOOGLE CLOUD CONSOLE (10 minutes)**

**URL:** https://console.cloud.google.com/apis/credentials

### Step 1: Create OAuth Client
- [ ] Click "+ CREATE CREDENTIALS"
- [ ] Select "OAuth client ID"
- [ ] Type: "Web application"
- [ ] Name: "TeachTrack Fresh OAuth Client"

### Step 2: Add JavaScript Origins
- [ ] `http://localhost:3000`
- [ ] `http://127.0.0.1:3000`
- [ ] `http://10.2.0.2:3000`
- [ ] `https://rubeolar-jaxon-unintuitively.ngrok-free.dev`

### Step 3: Add Redirect URIs
- [ ] `http://localhost:3000/auth/callback`
- [ ] `http://127.0.0.1:3000/auth/callback`
- [ ] `http://localhost:3000/api/auth/callback/google`
- [ ] `https://rubeolar-jaxon-unintuitively.ngrok-free.dev/auth/callback`

### Step 4: Save Credentials
- [ ] Click "CREATE"
- [ ] Copy Client ID
- [ ] Paste Client ID somewhere safe
- [ ] Click "OK"

### Step 5: Wait
- [ ] Wait 2 minutes ⏰

---

## 💻 **FRONTEND SETUP (2 minutes)**

### File: `frontend/.env.local`

- [ ] Open (or create) file: `c:\Users\MKT\Desktop\teachtrack\frontend\.env.local`
- [ ] Delete everything in it
- [ ] Paste this:
  ```
  NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
  NEXT_PUBLIC_API_URL=http://localhost:8000
  ```
- [ ] Replace `YOUR_CLIENT_ID_HERE` with your actual Client ID
- [ ] Save file
- [ ] Double-check: No spaces, starts with NEXT_PUBLIC_

---

## 🧹 **CLEANUP (3 minutes)**

### Stop Services
- [ ] Press Ctrl+C in terminal running services

### Delete Cache
- [ ] Run: `rmdir /s /q frontend\.next`
- [ ] Or manually delete `frontend\.next` folder

### Clear Browser
- [ ] Press Ctrl+Shift+Delete
- [ ] Select "Cookies" and "Cached images"
- [ ] Time: "All time"
- [ ] Click "Clear data"
- [ ] Close all localhost:3000 tabs

---

## 🚀 **TEST (3 minutes)**

### Restart
- [ ] Run: `python start.py`
- [ ] Wait for "✓ ALL SERVICES RUNNING!"

### Test in Incognito
- [ ] Press Ctrl+Shift+N (open incognito)
- [ ] Go to: `http://localhost:3000`
- [ ] Press F12 (open console)
- [ ] Check console: Should say "Google Client ID loaded: Yes"

### Try Sign-In
- [ ] Click "Sign in with Google" button
- [ ] Google popup appears (no 403!)
- [ ] Select account
- [ ] Logged in successfully!

---

## ✅ **SUCCESS CHECKLIST**

- [ ] Console shows: "Google Client ID loaded: Yes"
- [ ] No 403 errors in console
- [ ] No "origin not allowed" errors
- [ ] Google popup appears when clicking button
- [ ] Can select Google account
- [ ] Redirects back to app
- [ ] User is logged in
- [ ] Dashboard loads

---

## 📝 **CREDENTIALS TO SAVE**

Write these down:

```
Client ID: _________________________________
         _________________________________
         _________________________________

Client Secret: _____________________________

Created: November 25, 2025
```

---

## ⏱️ **ESTIMATED TIME**

- Google Cloud Console: **10 minutes**
- Frontend Setup: **2 minutes**
- Cleanup: **3 minutes**
- Testing: **3 minutes**
- **TOTAL: ~18 minutes**

---

## 🆘 **IF SOMETHING GOES WRONG**

**Issue: "Google Client ID loaded: No"**
→ Check frontend/.env.local file, verify Client ID

**Issue: 403 error**
→ Wait 5 more minutes, clear cache again

**Issue: Redirect mismatch**
→ Check redirect URIs in Google Cloud Console

**Full troubleshooting:** See FRESH_OAUTH_SETUP.md

---

✨ **You've got this! Take it one step at a time.** ✨
