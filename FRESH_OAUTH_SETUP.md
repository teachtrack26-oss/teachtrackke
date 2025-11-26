# 🔄 Google OAuth - Fresh Setup Guide (Step-by-Step)

**Starting completely fresh! Follow each step carefully.**

---

## ⏱️ **Total Time: 15 minutes**

- Steps 1-5: Google Cloud Console (10 min)
- Steps 6-8: Configure Frontend (2 min)
- Step 9: Test (3 min)

---

## 📍 **STEP 1: Create New OAuth Client**

### 1.1 Go to Google Cloud Console
- Open: **https://console.cloud.google.com/apis/credentials**
- Sign in with your Google account

### 1.2 Create Credentials
1. Click **"+ CREATE CREDENTIALS"** (blue button at top)
2. Select **"OAuth client ID"**

### 1.3 Configure Consent Screen (if prompted)
If you see "Configure Consent Screen":
1. Click **"CONFIGURE CONSENT SCREEN"**
2. Select **"External"**
3. Click **"CREATE"**

Fill in the form:
- **App name:** `TeachTrack`
- **User support email:** Your email (e.g., `teachtrack26@gmail.com`)
- **Developer contact email:** Same email
- Click **"SAVE AND CONTINUE"**

On "Scopes" page:
- Click **"ADD OR REMOVE SCOPES"**
- Select these scopes:
  - ✅ `.../auth/userinfo.email`
  - ✅ `.../auth/userinfo.profile`
- Click **"UPDATE"**
- Click **"SAVE AND CONTINUE"**

On "Test users" page:
- Click **"+ ADD USERS"**
- Add your email address
- Click **"ADD"**
- Click **"SAVE AND CONTINUE"**

Click **"BACK TO DASHBOARD"**

---

## 📍 **STEP 2: Create OAuth Client ID**

Now create the actual OAuth client:

1. Go back to: **https://console.cloud.google.com/apis/credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**

### 2.1 Application Type
- Select: **"Web application"**

### 2.2 Name
- Name: `TeachTrack Fresh OAuth Client`

### 2.3 Authorized JavaScript origins

Click **"+ ADD URI"** and add these **4 URLs** (one by one):

```
http://localhost:3000
```

Click **"+ ADD URI"** again:
```
http://127.0.0.1:3000
```

Click **"+ ADD URI"** again:
```
http://10.2.0.2:3000
```

Click **"+ ADD URI"** again (your current ngrok URL):
```
https://rubeolar-jaxon-unintuitively.ngrok-free.dev
```

### 2.4 Authorized redirect URIs

Click **"+ ADD URI"** and add these **4 URLs**:

```
http://localhost:3000/auth/callback
```

Click **"+ ADD URI"**:
```
http://127.0.0.1:3000/auth/callback
```

Click **"+ ADD URI"**:
```
http://localhost:3000/api/auth/callback/google
```

Click **"+ ADD URI"**:
```
https://rubeolar-jaxon-unintuitively.ngrok-free.dev/auth/callback
```

### 2.5 Create
- Click **"CREATE"** button at the bottom

---

## 📍 **STEP 3: Save Your Credentials**

A popup will appear with:
- **Your Client ID**
- **Your Client Secret**

### 3.1 Copy Client ID

Click the **copy icon** next to Client ID and paste it somewhere safe.

It will look like:
```
123456789012-abc123xyz456.apps.googleusercontent.com
```

### 3.2 Copy Client Secret (Optional for now)

Click the **copy icon** next to Client Secret (we'll need this later).

**IMPORTANT:** Keep this window open or save these values! You'll need the Client ID in the next step.

### 3.3 Click "OK"

Close the popup.

---

## 📍 **STEP 4: Verify OAuth Client Settings**

On the credentials page, you should now see your new OAuth client listed.

1. Click on it to verify
2. Make sure all 4 JavaScript origins are there
3. Make sure all 4 redirect URIs are there

**If anything is missing, click "Edit" and add it.**

---

## 📍 **STEP 5: Wait 2 Minutes** ⏰

Google needs time to activate the new OAuth client.

- Set a timer for **2 minutes**
- Don't skip this! Google servers need to propagate the changes.
- While waiting, continue to Step 6 below

---

## 📍 **STEP 6: Update Frontend Environment Variable**

### 6.1 Open/Create .env.local file

Open this file in a text editor:
```
c:\Users\MKT\Desktop\teachtrack\frontend\.env.local
```

If it doesn't exist, create it.

### 6.2 Update the file

**Delete everything** in the file and replace with this:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 6.3 Paste Your Client ID

Replace `YOUR_CLIENT_ID_HERE` with the Client ID you copied in Step 3.

**Example:**
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789012-abc123xyz456.apps.googleusercontent.com
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Important checks:**
- ✅ No spaces around the `=` sign
- ✅ Must start with `NEXT_PUBLIC_`
- ✅ Client ID ends with `.apps.googleusercontent.com`
- ✅ No quotes around the value

### 6.4 Save the file

Save and close the file.

---

## 📍 **STEP 7: Clean Everything**

### 7.1 Stop Running Services

In the terminal running `python start.py`:
- Press **Ctrl + C**
- Wait for services to stop

### 7.2 Delete Next.js Cache

Open a new terminal and run:
```bash
cd c:\Users\MKT\Desktop\teachtrack\frontend
rmdir /s /q .next
```

Or manually:
1. Navigate to `c:\Users\MKT\Desktop\teachtrack\frontend`
2. Delete the `.next` folder (if it exists)

### 7.3 Clear Browser Cache

In your browser:
1. Press **Ctrl + Shift + Delete**
2. Select:
   - ✅ **Cookies and other site data**
   - ✅ **Cached images and files**
3. Time range: **All time**
4. Click **"Clear data"**

### 7.4 Close All Browser Tabs

- Close ALL tabs with `localhost:3000`
- Close ALL tabs with ngrok URLs
- You can keep the Google Cloud Console tab open

---

## 📍 **STEP 8: Restart Everything**

### 8.1 Make Sure 2 Minutes Have Passed

Since Step 5, has it been at least 2 minutes? If not, wait.

### 8.2 Start Services

Open terminal and run:
```bash
cd c:\Users\MKT\Desktop\teachtrack
python start.py
```

Wait for services to start. You should see:
```
✓ ALL SERVICES RUNNING!
```

---

## 📍 **STEP 9: Test Google Sign-In**

### 9.1 Open Incognito Window

- Press **Ctrl + Shift + N** (Chrome/Edge)
- This ensures no old cache interferes

### 9.2 Navigate to Your App

In the incognito window, go to:
```
http://localhost:3000
```

### 9.3 Open Browser Console

- Press **F12**
- Click on the **"Console"** tab

### 9.4 Check Console Output

You should see:
```
✓ Google Client ID loaded: Yes (123456789...)
```

**If you see "No":** Go back to Step 6 and verify .env.local

### 9.5 Try Google Sign-In

1. Find the **"Sign in with Google"** button
2. Click it
3. A Google popup should appear (NOT a 403 error!)
4. Select your Google account
5. If prompted, click "Continue"
6. You should be redirected back and logged in!

---

## ✅ **SUCCESS INDICATORS**

When everything is working:

**In Browser Console:**
```
✓ Google Client ID loaded: Yes (123456...)
✓ No 403 errors
✓ No "origin not allowed" errors
```

**When Clicking Sign-In Button:**
```
✓ Google popup appears smoothly
✓ Can select account
✓ Redirects back to app
✓ User is logged in
✓ Redirected to dashboard
```

---

## ❌ **TROUBLESHOOTING**

### Issue: "Google Client ID loaded: No"

**Fix:**
1. Check `frontend/.env.local` exists
2. Verify Client ID is correct (copy-paste from Google Cloud Console)
3. Verify it starts with `NEXT_PUBLIC_`
4. Delete `.next` folder
5. Restart services

### Issue: Still getting 403 error

**Fix:**
1. Wait 5 more minutes (Google propagation can be slow)
2. Verify ALL 4 JavaScript origins are in Google Cloud Console
3. Clear browser cache again
4. Test in a DIFFERENT browser (Firefox, Chrome, Edge)

### Issue: "redirect_uri_mismatch"

**Fix:**
1. Check redirect URIs in Google Cloud Console
2. Make sure `http://localhost:3000/auth/callback` is listed
3. No typos, no trailing slashes

### Issue: Popup doesn't appear, immediate error

**Fix:**
1. Check browser is not blocking popups
2. Try a different browser
3. Verify Client ID matches exactly

---

## 🎓 **UNDERSTANDING WHAT WE DID**

1. **Created fresh OAuth client** - No old cached settings
2. **Added ALL possible URLs** - localhost, 127.0.0.1, IP, ngrok
3. **Configured redirect URIs** - Where Google sends users after auth
4. **Set environment variable** - Frontend knows which Client ID to use
5. **Cleared all caches** - No old broken states
6. **Tested in incognito** - Clean browser state

---

## 📞 **NEXT STEPS AFTER SUCCESS**

Once Google Sign-In works:

1. **Test email/password registration** (should also work)
2. **Test on mobile** using ngrok URL
3. **Add more test users** in Google Cloud Console if needed
4. **(Optional) Update backend** with Client Secret for token verification

---

## 💾 **SAVE YOUR CREDENTIALS**

Store these somewhere safe:

```
OAuth Client Name: TeachTrack Fresh OAuth Client
Client ID: [your-client-id].apps.googleusercontent.com
Client Secret: GOCSPX-[your-secret]
Created: November 25, 2025
```

---

## ⚡ **Quick Summary**

1. ✅ Create OAuth client in Google Cloud Console
2. ✅ Add 4 JavaScript origins
3. ✅ Add 4 redirect URIs
4. ✅ Copy Client ID
5. ✅ Paste in `frontend/.env.local`
6. ✅ Delete `.next` folder
7. ✅ Clear browser cache
8. ✅ Restart services
9. ✅ Test in incognito window

**Total time: 15 minutes**
**Success rate: 99%** (if you follow each step exactly)

---

🎉 **Ready? Let's do this! Start with STEP 1 above.** 🎉

---

**Pro Tip:** Keep this guide open in a separate window while you follow the steps. Check off each step as you complete it!
