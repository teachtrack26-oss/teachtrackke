# ✅ Quick Setup Checklist

## 🎯 Your Mission: Get These 3 Things

### 1️⃣ Google OAuth Credentials
**Where:** https://console.cloud.google.com/apis/credentials

**What you need:**
- ✅ Client ID: `xxxxxxxxxxxx.apps.googleusercontent.com`
- ✅ Client Secret: `GOCSPX-xxxxxxxxxxxxx`

**Steps:**
1. Create project "TeachTrack"
2. Enable Google+ API
3. Create OAuth Client ID
4. Save both credentials

---

### 2️⃣ Gmail App Password
**Where:** https://myaccount.google.com/apppasswords

**What you need:**
- ✅ 16-character app password: `xxxx xxxx xxxx xxxx`

**Steps:**
1. Enable 2-Factor Authentication on `teachtrack26@gmail.com`
2. Create App Password for "TeachTrack Email Verification"
3. Save the 16-char password

---

### 3️⃣ Update Configuration Files

**File 1: `backend/.env`** (create this file)
```env
GOOGLE_CLIENT_ID=paste-client-id-here
GOOGLE_CLIENT_SECRET=paste-secret-here
SMTP_PASSWORD=paste-16-char-password-here
```

**File 2: `frontend/.env.local`** (create this file)
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=paste-client-id-here
```

---

## 🚀 After Setup

Once you have all 3 things configured, tell me and I'll create:

- ✅ Backend API endpoints for Google login
- ✅ Backend email verification system
- ✅ Frontend Google Sign-In button
- ✅ Frontend email verification UI
- ✅ Beautiful email templates

---

## 📋 Status Tracker

Check off as you complete:

**Google OAuth:**
- [ ] Created Google Cloud Project
- [ ] Enabled Google+ API  
- [ ] Got Client ID
- [ ] Got Client Secret
- [ ] Added redirect URIs

**Gmail SMTP:**
- [ ] Enabled 2FA on teachtrack26@gmail.com
- [ ] Created App Password
- [ ] Saved the 16-character password

**Configuration:**
- [ ] Created `backend/.env` file
- [ ] Added credentials to `.env`
- [ ] Created `frontend/.env.local` file
- [ ] Installed Python packages

**Ready?**
- [ ] All above items checked ✅
- [ ] Ready for me to implement the code!

---

## 🆘 Stuck? Here's What to Do:

1. **Can't find Google Cloud Console?**
   - Go to: https://console.cloud.google.com/
   - Sign in with `teachtrack26@gmail.com`

2. **Can't find App Passwords?**
   - First enable 2FA
   - Then: https://myaccount.google.com/apppasswords

3. **Where do I put the credentials?**
   - Create `backend/.env` file (new file)
   - Copy the template from GOOGLE_EMAIL_SETUP.md
   - Replace with your actual values

---

**Complete all checkboxes above, then tell me "Setup complete!" and I'll implement everything!** 🎉
