# Cloudinary Setup Fix

## ❌ Current Issue

Your Cloudinary API Key appears to be **incorrect or incomplete** (only 10 characters, should be ~15 digits).

The error "unknown api_key" means Cloudinary doesn't recognize this key.

## ✅ How to Fix

### Step 1: Get Your REAL Credentials

1. **Go to Cloudinary Console**: https://console.cloudinary.com/
2. **Sign in** to your account
3. **Click "Settings"** (gear icon) in the top right
4. **Click "Security"** or go directly to: https://console.cloudinary.com/settings/security
5. **Scroll to "Access Keys"** section

You'll see something like this:

```
Cloud name: my-cloud-name
API Key: 123456789012345        ← This should be ~15 DIGITS
API Secret: AbCdEfGhIjKlMnOp    ← This is alphanumeric
API Environment variable: cloudinary://123456789012345:AbCdEfGhIjKlMnOp@my-cloud-name
```

### Step 2: Update Your .env File

Open `backend/.env` and replace with your REAL credentials (NO quotes):

```env
CLOUDINARY_CLOUD_NAME=my-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=AbCdEfGhIjKlMnOp
```

**OR use the single URL format:**

```env
CLOUDINARY_URL=cloudinary://123456789012345:AbCdEfGhIjKlMnOp@my-cloud-name
```

### Step 3: Verify the Fix

Run the test script from the `backend` directory:

```bash
cd backend
python test_cloudinary.py
```

You should see:

```
✅ SUCCESS! Credentials are valid.
```

### Step 4: Start the App

Once the test passes, restart your development servers:

```bash
npm run dev:all
```

## 🔍 Common Mistakes

1. ❌ **Using placeholder values** - Make sure you copied from YOUR actual Cloudinary account
2. ❌ **Adding quotes** - Don't wrap values in quotes in the .env file
3. ❌ **Wrong account** - Make sure all three values are from the SAME Cloudinary account
4. ❌ **Trailing spaces** - Our code now trims these, but best to avoid
5. ❌ **Copy-paste errors** - Double-check you copied the full API key

## 📝 What These Credentials Do

- **Cloud Name**: Identifies your Cloudinary account (like a username)
- **API Key**: Like a username for API access (15-digit number)
- **API Secret**: Like a password for API access (keep this secret!)

## 🆘 Still Having Issues?

If the test script still fails after updating:

1. **Generate new API credentials** in Cloudinary Console → Settings → Security → "Generate New API Key"
2. **Copy the NEW credentials** immediately (API Secret only shows once!)
3. **Update .env** with the new values
4. **Re-run the test**

---

**Need Help?**

- Cloudinary Docs: https://cloudinary.com/documentation/how_to_integrate_cloudinary
- Support: https://support.cloudinary.com
