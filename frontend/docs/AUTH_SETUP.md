# Authentication Setup Guide

## Current Status

The app uses the FastAPI backend for authentication and relies on an HttpOnly cookie set by the backend.

## How It Works

### Email/password login

- Frontend calls `/api/v1/auth/login` (via the Next.js proxy).
- Backend sets an HttpOnly cookie (JWT) and the frontend uses `/api/v1/auth/me` to load the current user.

### Google login

- Frontend uses Google Identity Services to obtain a Google ID token.
- Frontend posts that token to `/api/v1/auth/google`.
- Backend verifies it and sets the same HttpOnly cookie used everywhere else.

## Environment Variables (Frontend)

Add to `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

## Notes

- NextAuth is not used for login in this app, and `/api/auth/*` routes are intentionally not present.

Open browser console and run:

```javascript
localStorage.removeItem("teachtrack_users");
```

## Security Notes

⚠️ **IMPORTANT**: The current implementation is for **development/demo only**!

- Passwords are stored in plain text in localStorage
- No actual email verification
- No backend validation
- Data is only stored locally in browser

**Before production:**

- Implement proper backend API
- Use bcrypt/scrypt for password hashing
- Add email verification with tokens
- Implement CSRF protection
- Use HTTPS in production
- Add rate limiting
- Implement proper session management
