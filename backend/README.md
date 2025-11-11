# TeachTrack CBC Backend

FastAPI backend for TeachTrack CBC - Curriculum tracking system for Kenyan teachers.

## Features

- ✅ User authentication (register, login, JWT tokens)
- ✅ Subject management
- ✅ Curriculum structure (strands, sub-strands, lessons)
- ✅ Progress tracking
- ✅ Notes management
- ✅ MySQL database with full schema
- ✅ RESTful API with automatic documentation

## Prerequisites

- Python 3.11 or higher
- MySQL 8.0 or higher
- pip (Python package manager)

## Quick Setup

### Windows

1. **Run the setup script:**

   ```bash
   setup.bat
   ```

2. **Start the server:**
   ```bash
   python main.py
   ```

### Linux/Mac

1. **Make setup script executable:**

   ```bash
   chmod +x setup.sh
   ```

2. **Run the setup:**

   ```bash
   ./setup.sh
   ```

3. **Start the server:**
   ```bash
   python main.py
   ```

## Manual Setup

If the automated setup doesn't work:

### 1. Create Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE teachtrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE teachtrack;
SOURCE ../database/schema.sql;
EXIT;
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Edit `.env` file with your settings:

```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/teachtrack
SECRET_KEY=your-secret-key-here
```

### 4. Start Server

```bash
uvicorn main:app --reload
```

## API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current user info

### Subjects

- `GET /api/v1/subjects` - Get all subjects
- `GET /api/v1/subjects/{id}` - Get specific subject
- `POST /api/v1/subjects` - Create new subject
- `DELETE /api/v1/subjects/{id}` - Delete subject

### Progress

- `POST /api/v1/progress/mark-complete` - Mark lesson as complete

### Notes

- `GET /api/v1/notes` - Get all notes
- `POST /api/v1/notes` - Upload new note

## Database Schema

The database includes the following tables:

- `users` - User accounts
- `subjects` - Subjects taught by users
- `strands` - Main curriculum sections
- `sub_strands` - Subsections within strands
- `lessons` - Individual lessons
- `progress_log` - Lesson completion history
- `notes` - Teaching materials and resources

## Testing the API

### 1. Register a User

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123",
    "full_name": "John Teacher",
    "phone": "0712345678",
    "school": "Test School",
    "grade_level": "Grade 7"
  }'
```

### 2. Login

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123"
  }'
```

Save the `access_token` from the response.

### 3. Get User Info

```bash
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Connecting Frontend

Update the frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

The frontend will now use the real backend API instead of localStorage mock.

## Docker Support

To run with Docker:

```bash
cd ..
docker-compose up --build
```

This will start:

- Backend API on port 8000
- Frontend on port 3000
- MySQL on port 3306

## Troubleshooting

### MySQL Connection Error

- Verify MySQL is running: `mysql --version`
- Check password in `.env` file
- Ensure database `teachtrack` exists

### Port Already in Use

- Kill process using port 8000:
  - Windows: `netstat -ano | findstr :8000` then `taskkill /PID <PID> /F`
  - Linux/Mac: `lsof -ti:8000 | xargs kill`

### Import Errors

- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Use a virtual environment:
  ```bash
  python -m venv venv
  source venv/bin/activate  # Linux/Mac
  venv\Scripts\activate  # Windows
  pip install -r requirements.txt
  ```

## Development

The API uses:

- **FastAPI** - Modern web framework
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing

## Production Deployment

Before deploying to production:

1. Change `SECRET_KEY` to a secure random string
2. Use environment variables for sensitive data
3. Enable HTTPS
4. Configure proper CORS origins
5. Set up database backups
6. Use a production-grade ASGI server (Gunicorn + Uvicorn)
7. Set up monitoring and logging

## License

MIT License - See LICENSE file for details
