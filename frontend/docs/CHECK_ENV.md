# Check Your Frontend Environment Variable

Your .env.local file should contain:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1091679198456-kuap2p7jfcdskj1hle12jlqcfpjgmje9.apps.googleusercontent.com
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## To Verify:

1. Open: `frontend/.env.local`
2. Make sure the Client ID matches EXACTLY what's in Google Cloud Console
3. Make sure it starts with `NEXT_PUBLIC_` (required for Next.js client-side)

## After making changes:

1. Stop frontend (Ctrl+C)
2. Delete .next folder: `rm -rf .next` (or manually delete)
3. Restart: `npm run dev`

The console should show: "Google Client ID loaded: Yes (1091679198...)"

If it shows "No", the environment variable is not being read correctly.
