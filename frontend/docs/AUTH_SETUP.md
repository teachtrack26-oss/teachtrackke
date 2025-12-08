# Authentication Setup Guide

## Current Status

The app currently uses **mock authentication** with localStorage for demo purposes. This allows you to register and login without a backend server.

## How It Works Now

### Registration

1. Fill out the registration form
2. Data is stored in browser's localStorage
3. Success message appears
4. Redirects to login page

### Login

1. Enter the email and password you registered with
2. NextAuth validates against localStorage
3. On success, redirects to dashboard

### Email Verification

- Currently disabled for demo
- The verification page exists at `/verify-email` but auto-succeeds

## Setting Up Google OAuth (Optional)

To enable "Continue with Google" button:

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure consent screen if prompted
6. Set Application type: **Web application**
7. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://10.2.0.2:3000/api/auth/callback/google` (for network access)
8. Copy the **Client ID** and **Client Secret**

### 2. Update Environment Variables

Edit `.env.local` and add:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true
```

### 3. Restart Development Server

```bash
npm run dev
```

The "Continue with Google" button will now appear and work!

## Connecting to Real Backend

When your FastAPI backend is ready:

### 1. Update Registration (`register/page.tsx`)

Replace the localStorage code with:

```typescript
const response = await axios.post(
  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`,
  formData
);
```

### 2. Update NextAuth (`api/auth/[...nextauth]/route.ts`)

Replace the authorize function with:

```typescript
async authorize(credentials) {
  const response = await axios.post(
    `${process.env.API_BASE_URL}/auth/login`,
    {
      email: credentials?.email,
      password: credentials?.password,
    }
  );

  if (response.data.user) {
    return response.data.user;
  }
  return null;
}
```

### 3. Environment Variables for Production

Update `.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-api.com
NEXTAUTH_SECRET=generate-a-secure-random-string
NEXTAUTH_URL=https://your-frontend-domain.com
```

## Testing

### Test User Accounts (Demo Mode)

Since it's using localStorage, any account you create will work:

1. Register with any email/password (min 8 chars)
2. Login with the same credentials
3. Data persists in browser until you clear storage

### Clear Test Data

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
