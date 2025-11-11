# 🚀 TeachTrack CBC - Quick Start Guide

## ✅ Everything is Connected!

Your frontend now uses the **real MySQL database** through the FastAPI backend. No more localStorage!

## 🎯 What Changed

### ✅ Registration Page

- Now saves users to MySQL database
- Validates email uniqueness on the backend
- Returns proper error messages from the API

### ✅ Login System

- Authenticates against MySQL database
- Uses JWT tokens from backend
- Session includes backend access token

### ✅ API Integration

- All requests go to `http://localhost:8000/api/v1`
- Automatic error handling
- Proper authentication headers

---

## 🚀 How to Start Everything

### Option 1: Start Both Servers at Once (Recommended)

**Method A - Using npm:**

```bash
cd c:/Users/MKT/desktop/teachtrack
npm run dev:all
```

**Method B - Double-click:**

```
start-all.bat
```

This will start:

- ✅ Backend on http://localhost:8000
- ✅ Frontend on http://localhost:3000

### Option 2: Start Separately

**Terminal 1 - Backend:**

```bash
cd c:/Users/MKT/desktop/teachtrack/backend
python main.py
```

**Terminal 2 - Frontend:**

```bash
cd c:/Users/MKT/desktop/teachtrack/frontend
npm run dev
```

---

## 🧪 Test the Full Stack

### 1. Check Backend is Running

Visit: http://localhost:8000/docs

You should see the Swagger API documentation.

### 2. Register a New User

1. Go to http://localhost:3000/register
2. Fill out the form:

   - Full Name: Test Teacher
   - Email: test@example.com
   - Phone: 0712345678
   - School: Test School
   - Grade Level: Grade 7
   - Password: password123

3. Click "Create account"

4. **Check the database:**

```bash
mysql -u root -p"2078@lk//K."
USE teachtrack;
SELECT * FROM users;
```

You should see your new user in the database! 🎉

### 3. Login

1. Go to http://localhost:3000/login
2. Enter your email and password
3. You'll be redirected to the dashboard

### 4. Verify Authentication

The login creates a JWT token that's stored in your session. All future API calls will use this token.

---

## 📡 Available Commands

From the root `teachtrack` folder:

```bash
# Start both servers
npm run dev:all

# Start only frontend
npm run dev:frontend

# Start only backend
npm run dev:backend

# Install all dependencies
npm run install:all

# Build frontend for production
npm run build:frontend
```

---

## 🔍 How Authentication Works Now

### Registration Flow:

1. User fills form → Frontend sends POST to `/api/v1/auth/register`
2. Backend validates data and hashes password
3. User saved to MySQL database
4. Success response → redirect to login

### Login Flow:

1. User enters credentials → Frontend sends POST to `/api/v1/auth/login`
2. Backend verifies against database
3. Backend generates JWT token
4. Frontend stores token in NextAuth session
5. Token used for all subsequent API requests

### Protected Routes:

1. Frontend checks NextAuth session
2. If logged in, includes JWT token in API requests
3. Backend validates token and returns user data
4. If invalid, redirects to login

---

## 📊 Database Schema

Your MySQL database now has:

```
users              - User accounts with authentication
subjects           - Subjects taught by users
strands            - Main curriculum sections
sub_strands        - Subsections within strands
lessons            - Individual lessons
progress_log       - Lesson completion history
notes              - Teaching materials
```

---

## 🐛 Troubleshooting

### "Registration failed" error

- Check backend is running: http://localhost:8000
- Check browser console for error details
- Verify database connection in backend/.env

### "Invalid credentials" on login

- Make sure you registered with the same email/password
- Check if user exists in database:
  ```bash
  mysql -u root -p"2078@lk//K." -e "SELECT email FROM teachtrack.users;"
  ```

### Backend won't start

- Check if MySQL is running
- Verify password in `backend/.env`
- Check port 8000 is not in use

### Frontend can't connect to backend

- Verify `NEXT_PUBLIC_API_URL=http://localhost:8000` in `frontend/.env.local`
- Check CORS settings in `backend/config.py`
- Look for network errors in browser console

### Database errors

- Reload schema:
  ```bash
  mysql -u root -p"2078@lk//K." teachtrack < database/schema.sql
  ```

---

## 🎯 Next Development Steps

Now that everything is connected, you can:

1. **Add more API endpoints** in `backend/main.py`
2. **Create dashboard pages** to display subjects
3. **Implement curriculum parsing** with AI
4. **Add file upload** for PDFs and notes
5. **Build progress tracking** features
6. **Add email verification** system

---

## 📚 Key Files

### Frontend:

- `app/(auth)/register/page.tsx` - Registration form (✅ Connected to API)
- `app/(auth)/login/page.tsx` - Login form (✅ Connected to API)
- `app/api/auth/[...nextauth]/route.ts` - NextAuth config (✅ Uses backend)
- `.env.local` - Frontend environment variables

### Backend:

- `main.py` - FastAPI app with all endpoints
- `models.py` - Database models
- `auth.py` - JWT authentication
- `config.py` - Configuration settings
- `.env` - Backend environment variables

### Database:

- `database/schema.sql` - Complete database structure

---

## 🎉 Success!

Your TeachTrack CBC application is now a **full-stack application** with:

- ✅ React/Next.js frontend
- ✅ FastAPI Python backend
- ✅ MySQL database
- ✅ JWT authentication
- ✅ Real-time data persistence

**Start building amazing features! 🚀**

---

## 📞 Quick Reference

| Service     | URL                        | Purpose                       |
| ----------- | -------------------------- | ----------------------------- |
| Frontend    | http://localhost:3000      | Main application              |
| Backend API | http://localhost:8000      | REST API                      |
| API Docs    | http://localhost:8000/docs | Interactive API documentation |
| Database    | localhost:3306             | MySQL database                |

**Default Test User:**

- Email: demo@teachtrack.com
- Password: password123
