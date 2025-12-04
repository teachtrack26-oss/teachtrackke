# 🔍 Google Cloud Console - Complete Verification Checklist

## ⚠️ MOST COMMON ISSUE: Test Users Not Added

If you're getting "origin_mismatch" even with correct origins, check this:

**Are you trying to sign in with an email that's NOT in the test users list?**

---

## 📋 **Complete Settings Checklist**

### **1. OAuth Consent Screen Settings**

**URL:** https://console.cloud.google.com/apis/credentials/consent

**Check these:**

- [ ] **Publishing status:** Should say "Testing" (NOT "In production")
- [ ] **App name:** TeachTrack
- [ ] **User support email:** Set to your email
- [ ] **Developer contact email:** Set to your email

**Scopes configured:**
- [ ] `.../auth/userinfo.email`
- [ ] `.../auth/userinfo.profile`

**Test users:**
- [ ] `teachtrack26@gmail.com` (added)
- [ ] `kevadihxidic2015@gmail.com` (added) ← **Must add this if trying to sign in with it!**
- [ ] Any other email you want to test with

**How to add test user:**
1. Scroll to "Test users" section
2. Click "+ ADD USERS"
3. Enter email address
4. Click "ADD"

---

### **2. OAuth Client ID Settings**

**URL:** https://console.cloud.google.com/apis/credentials

Click on your OAuth client: **TeachTrack Fresh OAuth Client**

**Authorized JavaScript origins (should have ALL these):**

- [ ] `http://localhost:3000`
- [ ] `http://127.0.0.1:3000`
- [ ] `http://localhost:3001`
- [ ] `http://127.0.0.1:3001`
- [ ] `https://rubeolar-jaxon-unintuitively.ngrok-free.dev`

**Authorized redirect URIs (should have ALL these):**

- [ ] `http://localhost:3000/auth/callback`
- [ ] `http://localhost:3000/api/auth/callback/google`
- [ ] `http://localhost:3001/auth/callback`
- [ ] `http://localhost:3001/api/auth/callback/google`
- [ ] `https://rubeolar-jaxon-unintuitively.ngrok-free.dev/auth/callback`

**Client ID:**
- [ ] Copy it: Should be `907729144078-fr45nc0pp830aben4cg0v6c31a770hnj.apps.googleusercontent.com`

---

### **3. Enabled APIs**

**URL:** https://console.cloud.google.com/apis/library

Make sure these are enabled:

- [ ] Google+ API (or Google Identity)
- [ ] Google OAuth2 API

**To enable:**
1. Search for "Google+ API"
2. Click on it
3. Click "ENABLE" if not already enabled

---

### **4. Frontend Configuration**

**File:** `c:\Users\MKT\Desktop\teachtrack\frontend\.env.local`

Should contain EXACTLY:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=907729144078-fr45nc0pp830aben4cg0v6c31a770hnj.apps.googleusercontent.com
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Check:
- [ ] File exists
- [ ] Client ID matches Google Cloud Console
- [ ] Starts with `NEXT_PUBLIC_`
- [ ] No quotes around values
- [ ] No extra spaces

---

## 🎯 **Testing Procedure**

After verifying ALL settings above:

### **1. Clear Everything**

```bash
# Stop services
Ctrl + C

# Delete cache
cd /c/Users/MKT/Desktop/teachtrack/frontend
rm -rf .next
cd ..

# Close ALL browsers
# Clear browser cache: Ctrl+Shift+Delete (All time)
```

### **2. Wait**

- If you just made changes: **Wait 5 minutes**
- Let Google servers propagate

### **3. Restart & Test**

```bash
# Start services
npm run dev:all

# Open incognito (Ctrl+Shift+N)
# Go to: http://localhost:3001
# Try Google Sign-In with an email that's in TEST USERS list
```

---

## ⚠️ **Common Mistakes**

### **Mistake 1: Email Not in Test Users**

**Symptom:** "origin_mismatch" even with correct origins

**Fix:** Add the email to test users list in OAuth Consent Screen

### **Mistake 2: Using IP Address**

**Symptom:** "origin not allowed"

**Fix:** Use `http://localhost:3001` NOT `http://192.168.x.x:3001`

### **Mistake 3: Wrong Port**

**Symptom:** "origin_mismatch"

**Fix:** Check which port frontend is running on and use that port

### **Mistake 4: Cached Data**

**Symptom:** Old errors persist

**Fix:** 
- Delete `.next` folder
- Clear browser cache (All time)
- Test in incognito

### **Mistake 5: Not Waiting**

**Symptom:** Changes don't seem to work

**Fix:** Wait 5-15 minutes after making changes in Google Cloud Console

---

## 🆘 **Still Not Working?**

If you've verified EVERYTHING above and it still doesn't work:

### **Create New OAuth Client (Nuclear Option)**

1. **Delete** the current OAuth client
2. **Create** a completely new one (follow FRESH_OAUTH_SETUP.md)
3. **Use new Client ID** in `.env.local`
4. **Test**

### **Try Different Email**

1. Make sure the email is added to **Test users**
2. Try signing in with `teachtrack26@gmail.com` (your main account)
3. If that works, the issue is with test users list

---

## ✅ **Success Checklist**

When everything is configured correctly:

- [ ] OAuth Consent Screen is in "Testing" mode
- [ ] Your email is in Test users list
- [ ] OAuth Client has port 3001 in JavaScript origins
- [ ] OAuth Client has port 3001 in redirect URIs
- [ ] `.env.local` has correct Client ID
- [ ] Browser cache cleared
- [ ] `.next` folder deleted
- [ ] Accessing via `localhost:3001` (not IP)
- [ ] Waited 5+ minutes after last change
- [ ] Testing in incognito window

**If ALL boxes checked → Google Sign-In WILL work!**

---

## 📞 **Quick Diagnosis**

**If error is "origin_mismatch":**
→ Check JavaScript origins and redirect URIs

**If error is "access_denied" or "unauthorized_client":**
→ Check OAuth Consent Screen (make sure app is in Testing mode)

**If error is "Email not in test users":**
→ Add your email to test users list in OAuth Consent Screen

**If no error but button doesn't appear:**
→ Check `.env.local` has correct Client ID
