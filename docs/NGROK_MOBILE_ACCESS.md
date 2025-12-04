# 📱 Ngrok Mobile Access Guide

## Quick Start - Get Your URL Every Time

### Option 1: Using the Batch Script (Easiest)

1. **Double-click** `start-ngrok.bat` in your TeachTrack folder
2. The script will:
   - Start ngrok automatically
   - Display your public URL in bright colors
   - Keep it open for you to copy

### Option 2: Using Python Script

```bash
# First, start ngrok (keep this terminal open)
C:\Users\MKT\Desktop\ngrok.exe http 3000

# Then in a new terminal, run:
python get-ngrok-url.py
```

This will display your current ngrok URL nicely formatted.

### Option 3: Manual Method

1. **Start ngrok:**
   ```bash
   C:\Users\MKT\Desktop\ngrok.exe http 3000
   ```

2. **Get the URL in one of these ways:**
   
   **Method A - Visit ngrok dashboard:**
   - Open browser: `http://127.0.0.1:4040`
   - Your URL is displayed at the top
   
   **Method B - Use Python one-liner:**
   ```bash
   python -c "import requests; print(requests.get('http://127.0.0.1:4040/api/tunnels').json()['tunnels'][0]['public_url'])"
   ```

---

## Complete Workflow (Recommended)

### Every Time You Want Mobile Access:

1. **Start your dev server** (if not already running):
   ```bash
   npm run dev:all
   ```

2. **Start ngrok** using one of these:
   - Double-click `start-ngrok.bat` ✨ (EASIEST)
   - Or run: `C:\Users\MKT\Desktop\ngrok.exe http 3000`

3. **Get your URL:**
   - The batch script shows it automatically
   - Or visit: `http://127.0.0.1:4040`
   - Or run: `python get-ngrok-url.py`

4. **Access on phone:**
   - Open the URL in your phone's browser
   - Click "Visit Site" on ngrok warning
   - Login to TeachTrack!

---

## 💰 Want a Permanent URL?

### Ngrok Free Tier (Current):
- ✅ Free forever
- ❌ URL changes each restart
- ❌ Shows warning page before access
- ✅ Perfect for testing

### Ngrok Paid Plan (Optional):
- ✅ Fixed URL (e.g., `https://teachtrack.ngrok.app`)
- ✅ No warning page
- ✅ More concurrent connections
- 💵 ~$8-10/month

To get a static domain:
1. Sign up at https://ngrok.com
2. Get your auth token
3. Set custom domain:
   ```bash
   ngrok http 3000 --domain=your-custom-name.ngrok.app
   ```

---

## 🔧 Troubleshooting

### "Cannot connect to ngrok"
- Make sure ngrok.exe is running
- Check if port 3000 is available
- Ensure `npm run dev:all` is running

### "URL not working on phone"
- Make sure you're using the HTTPS URL (not HTTP)
- Check if your PC firewall allows ngrok
- Try restarting ngrok

### "Session expired"
- Free tier sessions last ~8 hours
- Just restart ngrok to get a new URL

---

## 📋 Quick Reference

| Action | Command |
|--------|---------|
| Start ngrok | Double-click `start-ngrok.bat` |
| Get URL | Run `python get-ngrok-url.py` |
| View dashboard | http://127.0.0.1:4040 |
| Stop ngrok | Press Ctrl+C in ngrok window |

---

## 🎯 Pro Tips

1. **Bookmark the ngrok dashboard** (`http://127.0.0.1:4040`) on your PC for easy access

2. **Create a desktop shortcut** to `start-ngrok.bat` for one-click access

3. **Use QR codes:** Visit the ngrok dashboard and it can generate QR codes for your phone!

4. **Add to startup scripts:** Create a combined script that starts both your dev server and ngrok together

---

## 🚀 All-in-One Startup (Advanced)

Want to start everything with one command? Create `start-all.bat`:

```batch
@echo off
start "Dev Server" cmd /k "npm run dev:all"
timeout /t 5
start "Ngrok" cmd /k "C:\Users\MKT\Desktop\ngrok.exe http 3000"
timeout /t 5
python get-ngrok-url.py
```

Now you can start everything by running `start-all.bat`!

---

**Remember:** The URL changes every time you restart ngrok, so you'll need to check it each time. Use the scripts provided to make this super easy! 🎉
