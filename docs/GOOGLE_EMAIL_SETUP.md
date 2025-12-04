# 🔐 Google Sign-In & Email Verification Setup Guide

## 📋 Overview

This guide will help you set up:
1. **Google OAuth Sign-In** - Allow users to sign in with their Google account
2. **Email Verification** - Verify user email addresses using Gmail SMTP

**Your Email:** `teachtrack26@gmail.com`

---

## PART 1: Google OAuth Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project:**
   - Click "Select a Project" → "New Project"
   - Project name: `TeachTrack`
   - Click "Create"

3. **Enable Google+ API:**
   - Go to: https://console.cloud.google.com/apis/library
   - Search for "Google+ API"
   - Click on it and click "Enable"

### Step 2: Create OAuth Credentials

1. **Go to Credentials:**
   - Navigate to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "OAuth client ID"

2. **Configure OAuth Consent Screen** (if prompted):
   - User Type: **External**
   - Click "Create"
   
   **Fill in the form:**
   - App name: `TeachTrack`
   - User support email: `teachtrack26@gmail.com`
   - App logo: (skip for now, optional)
   - Application home page: Leave blank for now
   - Authorized domains: Leave blank for dev
   - Developer contact email: `teachtrack26@gmail.com`
   - Click "Save and Continue"
   
   **Scopes:**
   - Click "Add or Remove Scopes"
   - Add these scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - Click "Update" → "Save and Continue"
   
   **Test users** (for development):
   - Click "Add Users"
   - Add your email: `teachtrack26@gmail.com`
   - Add any other test emails
   - Click "Save and Continue"

3. **Create OAuth Client ID:**
   - Application type: **Web application**
   - Name: `TeachTrack Web Client`
   
   **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   http://127.0.0.1:3000
   http://10.2.0.2:3000
   ```
   
   **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   http://127.0.0.1:3000/api/auth/callback/google
   http://10.2.0.2:3000/api/auth/callback/google
   ```
   
   (Add your ngrok URL later when you test on mobile)
   
   - Click "Create"

4. **Save Your Credentials:**
   - You'll see a dialog with:
     - **Client ID**: `xxxxxxxxxxxx.apps.googleusercontent.com`
     - **Client Secret**: `GOCSPX-xxxxxxxxxxxxx`
   - **COPY THESE AND SAVE THEM!** You'll need them soon.

---

## PART 2: Gmail SMTP Setup (Email Verification)

### Step 1: Enable 2-Factor Authentication

1. **Go to Google Account Security:**
   - Visit: https://myaccount.google.com/security
   - Sign in with `teachtrack26@gmail.com`

2. **Enable 2-Step Verification:**
   - Find "2-Step Verification"
   - Click "Get Started"
   - Follow the prompts to enable it

### Step 2: Create App Password

1. **After enabling 2FA, go to:**
   - https://myaccount.google.com/apppasswords
   - Or Google Account → Security → 2-Step Verification → App passwords

2. **Create App Password:**
   - App: Select "Mail"
   - Device: Select "Other (Custom name)"
   - Name it: `TeachTrack Email Verification`
   - Click "Generate"

3. **Save the 16-character password:**
   - It looks like: `xxxx xxxx xxxx xxxx` (remove spaces when using)
   - **SAVE THIS!** You can't view it again.

---

## PART 3: Configure Backend

### Step 1: Update `backend/config.py`

Add these new configuration fields:

```python
# Add after line 15 (after ACCESS_TOKEN_EXPIRE_MINUTES)

# Google OAuth
GOOGLE_CLIENT_ID: str = ""
GOOGLE_CLIENT_SECRET: str = ""
GOOGLE_REDIRECT_URI: str = "http://localhost:3000/api/auth/callback/google"

# Email Configuration
SMTP_HOST: str = "smtp.gmail.com"
SMTP_PORT: int = 587
SMTP_USER: str = "teachtrack26@gmail.com"
SMTP_PASSWORD: str = ""  # App password from Gmail
FROM_EMAIL: str = "teachtrack26@gmail.com"
FROM_NAME: str = "TeachTrack"

# Email Verification
VERIFICATION_TOKEN_EXPIRE_HOURS: int = 24
FRONTEND_URL: str = "http://10.2.0.2:3000"  # Already exists, keep it
```

### Step 2: Create `.env` File

Create a file named `.env` in the `backend` folder with your actual credentials:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here

# Email (Gmail App Password)
SMTP_PASSWORD=your-16-char-app-password-here

# Database (already configured)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=2078@lk//K.
DB_NAME=teachtrack

# Security
SECRET_KEY=your-secret-key-change-in-production
```

**Important:** Replace the placeholder values with your actual credentials from Steps 1 & 2!

---

## PART 4: Install Required Packages

Run these commands in your backend directory:

```bash
cd backend
pip install google-auth google-auth-oauthlib google-auth-httplib2
pip install python-multipart
pip install aiosmtplib
pip install email-validator
```

---

## PART 5: Test Configuration

### Quick Test Script

Create `backend/test_email.py`:

```python
import asyncio
from email_utils import send_verification_email
from config import settings

async def test():
    # Test sending email
    result = await send_verification_email(
        to_email="your-test-email@gmail.com",  # Change this
        username="Test User",
        verification_token="test-token-123"
    )
    print("Email sent!" if result else "Email failed!")

if __name__ == "__main__":
    asyncio.run(test())
```

Run:
```bash
python test_email.py
```

If you receive an email, it's working! ✅

---

## PART 6: Frontend Configuration

### Update `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

---

## 📝 Configuration Checklist

Before proceeding to implementation, make sure you have:

- [ ] Google Cloud Project created
- [ ] OAuth Client ID and Secret obtained
- [ ] Authorized JavaScript origins added
- [ ] Authorized redirect URIs added
- [ ] 2-Factor Authentication enabled on `teachtrack26@gmail.com`
- [ ] Gmail App Password created
- [ ] `backend/config.py` updated with new fields
- [ ] `backend/.env` file created with actual credentials
- [ ] Required Python packages installed
- [ ] Test email script ran successfully

---

## 🔒 Security Notes

1. **Never commit `.env` file to Git!**
   - Already in `.gitignore`? Double-check!

2. **Keep credentials secret:**
   - Don't share Client Secret
   - Don't share App Password
   - Don't share in screenshots

3. **For production:**
   - Use environment variables
   - Rotate secrets regularly
   - Use different OAuth clients for dev/prod

---

## 🚀 Next Steps

Once you complete this setup, I'll help you implement:

1. **Backend API endpoints:**
   - `/auth/google/login` - Initiate Google OAuth
   - `/auth/google/callback` - Handle OAuth callback
   - `/auth/register` - Register with email verification
   - `/auth/verify-email` - Verify email token
   - `/auth/resend-verification` - Resend verification email

2. **Frontend components:**
   - Google Sign-In button
   - Email verification flow
   - Verification success/error pages

3. **Email templates:**
   - HTML welcome email with verification link
   - Professional styling

---

## 📞 Need Help?

**Common Issues:**

1. **"OAuth error: redirect_uri_mismatch"**
   - Check your authorized redirect URIs in Google Console
   - Make sure they match exactly (including http/https)

2. **"Email not sending"**
   - Verify App Password is correct (no spaces)
   - Check 2FA is enabled
   - Try with a different recipient email

3. **"Client ID not found"**
   - Make sure you enabled Google+ API
   - Wait 5 minutes after creating credentials

---

Let me know when you've completed the setup steps above, and I'll create all the implementation code! 🎉
