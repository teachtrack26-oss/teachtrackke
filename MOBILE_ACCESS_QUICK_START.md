# 📱 TeachTrack Mobile Access - Quick Reference Card

## 🚀 SUPER EASY METHOD (Recommended)

### First Time Setup:
**No setup needed! Files are already created.**

### Every Time You Want Mobile Access:

1. **Double-click:** `start-everything.bat`
   - Starts dev server + ngrok
   - Shows your URL automatically
   - Opens in separate windows

2. **Wait 15 seconds** for everything to start

3. **Your URL will be displayed** - copy it to your phone!

---

## 📋 Available Scripts

| Script | What It Does | When to Use |
|--------|--------------|-------------|
| **start-everything.bat** | Starts dev server + ngrok + shows URL | **Every day when you start working** |
| **start-ngrok.bat** | Just starts ngrok and shows URL | When dev server already running |
| **get-url.bat** | Shows current URL | When ngrok is running, just need URL |
| **get-ngrok-url.py** | Python version of get-url | Alternative to .bat file |

---

## ⚡ Quick Commands

```bash
# Start everything (EASIEST)
Double-click: start-everything.bat

# Just get the URL
Double-click: get-url.bat

# Or in terminal:
python -c "import requests; print(requests.get('http://127.0.0.1:4040/api/tunnels').json()['tunnels'][0]['public_url'])"
```

---

## 🔄 Daily Workflow

### Morning (Start Working):
```
1. Double-click: start-everything.bat
2. Wait 15 seconds
3. Copy the URL shown
4. Open URL on your phone
```

### During Day (Get URL Again):
```
1. Double-click: get-url.bat
2. Copy the URL
```

### Evening (Stop Working):
```
1. Close all terminal windows
   OR
2. Press Ctrl+C in each window
```

---

## 📍 Important URLs

- **Ngrok Dashboard:** http://127.0.0.1:4040
- **Local Access:** http://localhost:3000
- **Mobile Access:** Changes every restart (use scripts to get it!)

---

## 💡 Pro Tips

1. **Create Desktop Shortcuts:**
   - Right-click `start-everything.bat` → Send to → Desktop (create shortcut)
   - Right-click `get-url.bat` → Send to → Desktop (create shortcut)

2. **Get URL Without Opening Files:**
   - Visit http://127.0.0.1:4040 in your browser
   - URL is shown at the top

3. **Share with Others:**
   - The ngrok URL can be shared with anyone
   - They can access your app (while ngrok is running)
   - Great for testing with colleagues!

---

## 🎯 Current Setup

**Your ngrok is currently running!**

**Current URL:** `https://rubeolar-jaxon-unintuitively.ngrok-free.dev`

*(This URL will change next time you restart ngrok)*

**To get new URL after restart:**
- Run any of the scripts above
- Or visit http://127.0.0.1:4040

---

## ❓ Troubleshooting

### "Cannot find URL"
→ Make sure ngrok is running (check for ngrok window)

### "Connection refused"
→ Make sure dev server is running (npm run dev:all)

### "URL not loading on phone"
→ Use the HTTPS version (https://)
→ Click "Visit Site" on ngrok warning page

---

## 📞 Need Help?

Run this in terminal for detailed guide:
```bash
type NGROK_MOBILE_ACCESS.md
```

**That's it! You're all set up! 🎉**
