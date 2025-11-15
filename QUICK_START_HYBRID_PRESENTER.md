# Quick Start Guide - TeachTrack Hybrid Presenter

## 🚀 Your "Hello world" DOCX is Fixed!

### How to Use (3 Simple Steps):

```
Step 1: Open your "Hello world" DOCX file
   └─→ Opens in Native mode automatically

Step 2: See an error? Click the "Google" button (top-left)
   └─→ Instantly switches to Google Docs Viewer

Step 3: File displays perfectly! ✅
```

---

## Visual Layout

```
┌────────────────────────────────────────────────────────────┐
│  [Native] [Google] [Download]    Your File.docx    [X]     │  ← Top bar
├────────────────────────────────────────────────────────────┤
│                                                             │
│                                                             │
│                                                             │
│                  YOUR FILE CONTENT                          │
│                  DISPLAYS HERE                              │
│                                                             │
│                                                             │
│                                                             │
└────────────────────────────────────────────────────────────┘
  ESC Close • 1 Native • 2 Google • 3 Download  ← Keyboard hints
```

---

## Mode Comparison

### 🔵 Native Mode (Default)

```
✅ Best for: PDF, Images, Videos
✅ Works offline
✅ Fastest performance
❌ May fail on complex/corrupted DOCX
❌ No PPTX support yet
```

### 🟢 Google Mode (RECOMMENDED for Office files)

```
✅ Best for: DOCX, PPTX, XLSX
✅ Handles corrupted files better
✅ PowerPoint support
✅ Excel support
❌ Requires internet
❌ External dependency
```

### ⚪ Download Mode (Fallback)

```
✅ Always works
✅ For any file type
✅ View in native app (Word, PowerPoint, etc.)
❌ Must download first
```

---

## Quick Fixes

### Problem: "Hello world" DOCX shows error

**Solution:** Press `2` key or click "Google" button

### Problem: PowerPoint won't open

**Solution:** Press `2` key → Google Viewer handles PPTX

### Problem: Excel file not supported

**Solution:** Press `2` key → Google Viewer shows spreadsheets

### Problem: File loads but looks wrong

**Solution:** Try switching modes (1, 2, 3) to compare

---

## Keyboard Shortcuts

```
1 ────→ Native Mode (TeachTrack viewer)
2 ────→ Google Mode (Google Docs Viewer)
3 ────→ Download Mode (Download file)
ESC ───→ Close viewer
F ─────→ Fullscreen toggle (from NoteViewer)
```

---

## What Changed?

### Before:

```
Open DOCX → Error → No options → Frustrated 😞
```

### After:

```
Open DOCX → Error → Click Google → Works! 😊
              ↓
         Or press 2
```

---

## File Type Support Matrix

| File Extension | Native   | Google   | Recommended |
| -------------- | -------- | -------- | ----------- |
| .pdf           | ✅ ✅ ✅ | ✅       | **Native**  |
| .docx          | ⚠️       | ✅ ✅ ✅ | **Google**  |
| .pptx          | ❌       | ✅ ✅ ✅ | **Google**  |
| .xlsx          | ❌       | ✅ ✅ ✅ | **Google**  |
| .jpg/.png      | ✅ ✅ ✅ | ✅       | **Native**  |
| .mp4           | ✅ ✅ ✅ | ❌       | **Native**  |

✅ ✅ ✅ = Best support
✅ = Supported
⚠️ = May have issues
❌ = Not supported

---

## Testing Your Files

### Test 1: Your "Hello world" DOCX

1. ✅ Open file
2. ✅ Press `2` for Google mode
3. ✅ Should display "Hello world"

### Test 2: A PowerPoint File

1. ✅ Upload .pptx file
2. ✅ Native shows "PowerPoint coming soon"
3. ✅ Click "Try Google Viewer"
4. ✅ Slides display perfectly

### Test 3: Mode Switching

1. ✅ Open any file
2. ✅ Press `1` → Native view
3. ✅ Press `2` → Google view
4. ✅ Press `3` → Download option
5. ✅ All work instantly

---

## Auto-Fallback Feature

```
User opens file
      ↓
Native mode tries to load
      ↓
   Error?
   /    \
 NO     YES
 /        \
Show      Show yellow banner
file      "Native viewer failed"
            ↓
         Wait 1 second
            ↓
    Auto-switch to Google mode
            ↓
         Works! ✅
```

---

## Tips

### 💡 Tip 1: Remember Your Preference

If a file works better in Google mode, just click "Google" when you open it next time.

### 💡 Tip 2: Try All Modes

Some files render better in different modes. Switch between them to find the best view.

### 💡 Tip 3: Download for Editing

If you need to edit the file, use Download mode to get the original file.

### 💡 Tip 4: Keyboard is Faster

Instead of clicking buttons, use `1`, `2`, `3` keys to switch modes quickly.

---

## FAQ

### Q: Why does my file open in Native mode first?

**A:** Native mode is fastest and works offline. But you can instantly switch to Google if needed.

### Q: Will Google Viewer work without internet?

**A:** No, Google Viewer requires internet. Use Native mode or Download for offline access.

### Q: Can I edit files in the viewer?

**A:** No, both viewers are read-only. Download the file to edit it.

### Q: Why can't I see PowerPoint in Native mode?

**A:** Native PPTX viewer is coming soon. Use Google Viewer for now.

### Q: Is my file uploaded to Google?

**A:** No! Google Viewer fetches your file from your R2 storage. Google doesn't store it.

### Q: What if all modes fail?

**A:** File might be corrupted. Try re-saving it in Microsoft Office and re-uploading.

---

## Summary

✅ **Implementation Complete**
✅ **Zero Backend Changes**
✅ **Works Immediately**
✅ **Solves DOCX Issues**
✅ **Adds PPTX Support**
✅ **Adds Excel Support**
✅ **User Has Control**

### Your "Hello world" DOCX file will work perfectly now! Just press `2` 🎉
