# 📝 How to Create Your .env Files

## Step-by-Step Instructions

### Backend .env File

1. **Open:** `backend/ENV_TEMPLATE.txt`

2. **Copy** all the content

3. **Create a new file** in the `backend` folder named exactly:
   ```
   .env
   ```
   (Note: It starts with a dot `.env`)

4. **Paste** the content into the new `.env` file

5. **Replace these 3 values:**
   - `GOOGLE_CLIENT_ID=PASTE_YOUR_CLIENT_ID_HERE`
   - `GOOGLE_CLIENT_SECRET=PASTE_YOUR_CLIENT_SECRET_HERE`
   - `SMTP_PASSWORD=PASTE_YOUR_16_CHAR_APP_PASSWORD_HERE`

6. **Save** the file

---

### Frontend .env.local File

1. **Open:** `frontend/ENV_TEMPLATE.txt`

2. **Copy** all the content

3. **Create a new file** in the `frontend` folder named exactly:
   ```
   .env.local
   ```

4. **Paste** the content into the new `.env.local` file

5. **Replace this 1 value:**
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID=PASTE_YOUR_CLIENT_ID_HERE`

6. **Save** the file

---

## 📋 What You Need

Before you can fill in the .env files, you need to get these credentials:

### 1. Google OAuth Credentials
- **Where:** https://console.cloud.google.com/apis/credentials
- **What:** Client ID and Client Secret
- **Details:** See `GOOGLE_EMAIL_SETUP.md` Part 1

### 2. Gmail App Password
- **Where:** https://myaccount.google.com/apppasswords
- **What:** 16-character app password
- **Details:** See `GOOGLE_EMAIL_SETUP.md` Part 2

---

## ✅ Verification

After creating both files, you should have:

```
backend/.env          ← Your actual credentials (NOT in git)
backend/ENV_TEMPLATE.txt   ← Template (safe to commit)

frontend/.env.local   ← Your actual credentials (NOT in git)
frontend/ENV_TEMPLATE.txt  ← Template (safe to commit)
```

---

## 🔐 Security Note

The `.env` and `.env.local` files are automatically ignored by Git (they're in `.gitignore`). This means your credentials won't be accidentally committed to GitHub. ✅

The template files (`ENV_TEMPLATE.txt`) don't contain real credentials, so they're safe to commit.

---

## 🆘 Trouble Creating the Files?

### On Windows:

**Method 1 - Using VS Code:**
1. Right-click in `backend` folder → New File
2. Name it exactly: `.env`
3. Paste the content from ENV_TEMPLATE.txt
4. Fill in your credentials
5. Save

**Method 2 - Using Command Prompt:**
```bash
cd backend
copy ENV_TEMPLATE.txt .env
notepad .env
```
Then fill in your credentials and save.

**Method 3 - Using File Explorer:**
1. Open backend folder
2. File → New → Text Document
3. Save as `.env` (make sure "All Files" is selected, not "Text Documents")
4. Open with notepad
5. Paste template content
6. Fill in credentials
7. Save

---

## 🚀 Next Steps

Once you've created both .env files:

1. ✅ Get your Google OAuth credentials
2. ✅ Get your Gmail app password
3. ✅ Fill them into the .env files
4. ✅ Tell me "Credentials filled in!"
5. ✅ I'll help you implement the Google Sign-In & Email Verification code!

---

Need help getting the credentials? Refer to `GOOGLE_EMAIL_SETUP.md` for detailed instructions!
