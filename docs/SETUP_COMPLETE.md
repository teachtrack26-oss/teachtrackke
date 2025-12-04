# TeachTrack CBC - Complete Setup Guide

## ✅ Backend Setup Complete!

Your backend has been fully configured with:

- ✅ FastAPI application
- ✅ MySQL database schema
- ✅ Authentication system (JWT tokens)
- ✅ Complete API endpoints
- ✅ Database models and relationships

## 📁 What Was Created

### Backend Files:

```
backend/
├── main.py              # FastAPI application
├── config.py            # Configuration settings
├── database.py          # Database connection
├── models.py            # SQLAlchemy models
├── schemas.py           # Pydantic schemas
├── auth.py              # Authentication utilities
├── requirements.txt     # Python dependencies
├── Dockerfile           # Docker configuration
├── .env                 # Environment variables
├── setup.bat            # Windows setup script
├── setup.sh             # Linux/Mac setup script
└── README.md            # Documentation
```

### Database:

```
database/
└── schema.sql          # Complete database schema with sample data
```

## 🚀 How to Start the Backend

### Option 1: Quick Start (Manual)

1. **Open a NEW terminal in the backend directory:**

   ```bash
   cd c:/Users/MKT/desktop/teachtrack/backend
   ```

2. **Start the server:**

   ```bash
   python main.py
   ```

   OR:

   ```bash
   uvicorn main:app --reload
   ```

3. **The API will be available at:**
   - http://localhost:8000
   - http://localhost:8000/docs (Swagger documentation)
   - http://localhost:8000/redoc (ReDoc documentation)

### Option 2: Using the Setup Script

**Windows:**

```bash
cd backend
setup.bat
```

**Linux/Mac:**

```bash
cd backend
chmod +x setup.sh
./setup.sh
```

## 🔧 Database Configuration

Your MySQL database is configured with:

- **Host:** localhost
- **Port:** 3306
- **User:** root
- **Password:** 2078@lk//K.
- **Database:** teachtrack

The schema includes:

- Users table with authentication
- Subjects, Strands, Sub-strands, Lessons
- Progress tracking
- Notes management

**Sample user already created:**

- Email: demo@teachtrack.com
- Password: password123

## 🌐 Connecting Frontend to Backend

### 1. Update Frontend Environment Variables

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Update Register Page

The register page is already configured to use the real API. Once the backend is running, registration will work automatically!

### 3. Update Login with NextAuth

The NextAuth configuration in `frontend/app/api/auth/[...nextauth]/route.ts` needs to be updated to call your backend API instead of localStorage.

Replace the `authorize` function:

```typescript
async authorize(credentials) {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  try {
    // Call your backend API
    const response = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Get user info
    const userResponse = await fetch('http://localhost:8000/api/v1/auth/me', {
      headers: { 'Authorization': `Bearer ${data.access_token}` },
    });

    if (!userResponse.ok) {
      return null;
    }

    const user = await userResponse.json();

    return {
      id: user.id.toString(),
      email: user.email,
      name: user.full_name,
      accessToken: data.access_token,
    };
  } catch (error) {
    return null;
  }
}
```

## 📡 API Endpoints

### Authentication

```
POST /api/v1/auth/register  - Register new user
POST /api/v1/auth/login     - Login (returns JWT token)
GET  /api/v1/auth/me        - Get current user info
```

### Subjects

```
GET    /api/v1/subjects        - Get all subjects
GET    /api/v1/subjects/{id}  - Get subject by ID
POST   /api/v1/subjects        - Create new subject
DELETE /api/v1/subjects/{id}  - Delete subject
```

### Progress

```
POST /api/v1/progress/mark-complete - Mark lesson as complete
```

### Notes

```
GET  /api/v1/notes  - Get all notes
POST /api/v1/notes  - Create new note
```

## 🧪 Testing the API

### 1. Test with the Browser

Visit: http://localhost:8000/docs

This opens Swagger UI where you can test all endpoints interactively!

### 2. Test with curl

**Register a user:**

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test Teacher",
    "phone": "0712345678",
    "school": "Test School",
    "grade_level": "Grade 7"
  }'
```

**Login:**

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Get user info (replace TOKEN with the access_token from login):**

```bash
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer TOKEN"
```

## 🐛 Troubleshooting

### Backend won't start:

1. Check if MySQL is running: `mysql --version`
2. Check if port 8000 is available
3. Verify database connection in `.env` file
4. Check Python version: `python --version` (needs 3.11+)

### Database connection errors:

1. Verify MySQL password is correct
2. Ensure database 'teachtrack' exists:
   ```bash
   mysql -u root -p"2078@lk//K." -e "SHOW DATABASES;"
   ```
3. Reload schema if needed:
   ```bash
   mysql -u root -p"2078@lk//K." teachtrack < ../database/schema.sql
   ```

### Frontend can't connect to backend:

1. Check backend is running on port 8000
2. Verify NEXT_PUBLIC_API_URL in frontend/.env.local
3. Check browser console for CORS errors

## 🎉 Next Steps

1. **Start the backend** (see Quick Start above)
2. **Test the API** at http://localhost:8000/docs
3. **Start the frontend:**
   ```bash
   cd ../frontend
   npm run dev
   ```
4. **Register a new account** at http://localhost:3000/register
5. **Login** and explore the dashboard!

## 📚 Additional Resources

- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **SQLAlchemy Docs:** https://www.sqlalchemy.org/
- **Next.js Docs:** https://nextjs.org/docs
- **NextAuth Docs:** https://next-auth.js.org/

## 🔐 Security Notes

**For Production:**

- Change SECRET_KEY to a secure random string (min 32 chars)
- Use environment variables for all sensitive data
- Enable HTTPS
- Set up proper CORS origins
- Use connection pooling
- Implement rate limiting
- Add request validation
- Set up proper logging and monitoring

---

**Congratulations! Your TeachTrack CBC backend is ready to use! 🎓✨**
