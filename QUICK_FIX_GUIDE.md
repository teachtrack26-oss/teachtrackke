# Quick Fix Guide - Common File Errors

## 🔴 Error 1: "Corrupted zip: expected 12 records in central dir, got 0"

**File Type:** DOCX (Word documents)

### What Happened

The DOCX file is corrupted or incomplete. DOCX files are actually ZIP archives - this error means the ZIP structure is broken.

### Quick Fixes (in order)

1. **Retry Loading**

   - Click the "🔄 Retry Loading" button
   - May be a temporary network glitch

2. **Download & Check**

   - Click "Download Document Instead"
   - Try opening in Microsoft Word
   - If Word can open it, the file is OK (problem is in the web viewer)
   - If Word can't open it, the file is truly corrupted

3. **Re-Upload**
   - If file is corrupted, re-upload the original
   - Make sure upload completes 100%
   - Don't close browser during upload

### Root Causes

- ❌ Upload interrupted before completion
- ❌ Network timeout during download from storage
- ❌ File corrupted in storage (R2/Cloudflare)
- ❌ User uploaded non-DOCX file renamed to .docx

### Prevention

- ✅ Wait for upload progress to reach 100%
- ✅ Use stable internet connection for large files
- ✅ Don't upload files > 50MB via browser
- ✅ Verify file opens in Word before uploading

---

## 🔴 Error 2: "Video format not supported by browser"

**File Type:** Video files

### What Happened

Your browser can't decode the video codec. The file might be in MOV, AVI, H.265, or another unsupported format.

### Quick Fixes (in order)

1. **Retry Loading**

   - Click "🔄 Retry Loading"
   - Sometimes browser needs a second attempt

2. **Download & Play Locally**

   - Click "Download Video Instead"
   - Open with VLC Media Player (supports all formats)
   - Or use Windows Media Player, QuickTime, etc.

3. **Convert Video Format**
   - Convert to MP4 (H.264) for universal browser support
   - Use online converter or FFmpeg (see below)
   - Re-upload converted file

### Supported Video Formats

✅ **Works in ALL browsers:**

- MP4 with H.264 video codec
- MP4 with AAC audio codec

⚠️ **Works in SOME browsers:**

- WebM (Chrome, Firefox, Edge only)
- Ogg (Chrome, Firefox only)
- MOV (Safari only)

❌ **Doesn't work in browsers:**

- AVI files
- H.265/HEVC (needs special hardware)
- WMV files
- FLV files

### Root Causes

- ❌ Video encoded with unsupported codec (H.265, VP9, etc.)
- ❌ Wrong file format (MOV, AVI, WMV instead of MP4)
- ❌ Corrupted video file
- ❌ Missing audio/video streams

### Convert Video to Compatible Format

**Option 1: Online Converter (Easy)**

- Use CloudConvert.com
- Upload your video
- Choose "MP4" as output
- Select "H.264" codec
- Download and re-upload

**Option 2: FFmpeg (Advanced)**

```bash
# Install FFmpeg first
# Windows: Download from ffmpeg.org
# Mac: brew install ffmpeg
# Linux: apt install ffmpeg

# Convert any video to browser-compatible MP4
ffmpeg -i input.mov -c:v libx264 -preset slow -crf 22 -c:a aac -b:a 128k output.mp4

# Explanation:
# -c:v libx264   = Use H.264 video codec (universal)
# -preset slow   = Better quality (faster = lower quality)
# -crf 22        = Quality level (18-28, lower = better)
# -c:a aac       = Use AAC audio codec (universal)
# -b:a 128k      = Audio bitrate 128kbps
```

**Option 3: Handbrake (GUI)**

- Download Handbrake (handbrake.fr)
- Open your video
- Select "Web" preset
- Click "Start"
- Upload converted file

### Prevention

- ✅ Always upload MP4 files with H.264 codec
- ✅ Test video plays in browser before uploading
- ✅ Convert MOV/AVI videos to MP4 first
- ✅ Keep file size under 500MB for browser playback

---

## 🔴 Error 3: PDF Shows Blank White Page

**File Type:** PDF

### What Happened

PDF is loading but appears blank. Common with single-color PDFs or rendering issues.

### Quick Fixes

1. **Check Page Number**

   - Look at "1 / 86" indicator
   - First page might actually be blank
   - Navigate to page 2 with arrow →

2. **Wait for Full Load**

   - Large PDFs take time to render
   - Watch for loading spinner
   - Wait 10-30 seconds for complex PDFs

3. **Download & Check**
   - Download the PDF
   - Open in Adobe Reader
   - Verify content exists

### Root Causes

- ✅ First page is actually blank (title page)
- ❌ PDF rendering issue (complex graphics)
- ❌ Corrupted PDF
- ❌ Password-protected PDF

---

## 📊 Error Summary Table

| Error Message                     | File Type | Quick Fix                             | Common Cause      |
| --------------------------------- | --------- | ------------------------------------- | ----------------- |
| Corrupted zip: expected X records | DOCX      | Click Retry → Download → Re-upload    | Incomplete upload |
| Video format not supported        | Video     | Download → Convert to MP4 → Re-upload | Wrong codec       |
| Failed to load document           | DOCX      | Check file size > 1KB                 | Corrupted file    |
| Network Error                     | Any       | Check internet → Retry                | Connection issue  |
| Request timeout                   | Any       | Wait → Retry                          | File too large    |
| Video error: decode               | Video     | File corrupted                        | Corrupt upload    |

---

## 🛠️ General Troubleshooting Steps

### For Any File That Won't Load:

1. **First: Retry**

   - Click the retry button
   - Refresh the page (F5)
   - Close and reopen the file

2. **Second: Check Connection**

   - Verify internet is working
   - Check browser console for errors (F12)
   - Try different browser

3. **Third: Download Test**

   - Download the file
   - Try opening locally
   - If opens locally, it's a viewer issue
   - If doesn't open, file is corrupted

4. **Last Resort: Re-Upload**
   - Delete the note/file
   - Upload fresh copy
   - Wait for 100% completion
   - Test immediately after upload

---

## 🔍 How to Check Console for Details

1. Press **F12** to open Developer Tools
2. Click **Console** tab
3. Look for red error messages
4. Look for these keywords:
   - `[ERROR]` - Something failed
   - `[PROXY ERROR]` - Backend can't fetch file
   - `Network Error` - Connection problem
   - `Corrupted` - File is damaged
   - `timeout` - Taking too long

### Common Console Messages:

```
[ERROR] Video error: "Video format not supported by browser"
→ Video codec not supported, convert to MP4

[DOCX PRES] Load error: Corrupted zip: expected 12 records
→ DOCX file corrupted, re-upload needed

[PROXY ERROR] Status 404 for URL: ...
→ File doesn't exist in storage

[ERROR] Ready state: 0, Network state: 3
→ Video source not compatible with any browser codec

[PROXY] Request timeout
→ File too large or connection too slow
```

---

## 📞 When to Contact Support

Contact developer/admin if:

- ✅ File opens locally but not in browser (after retry)
- ✅ Multiple files failing with same error
- ✅ Error persists across different browsers
- ✅ Fresh uploads immediately fail
- ✅ Console shows server errors (500, 502, 504)

DO NOT contact support if:

- ❌ Only one file failing (likely that file is corrupt)
- ❌ Haven't tried downloading file first
- ❌ Haven't tried re-uploading
- ❌ Video is in MOV/AVI format (needs conversion)

---

## ✅ File Upload Best Practices

### For DOCX Files:

- ✅ Save in Word as .docx (not .doc)
- ✅ Keep file size under 10MB
- ✅ Test opening before upload
- ✅ Use stable internet connection

### For Video Files:

- ✅ Convert to MP4 (H.264) format first
- ✅ Keep under 500MB for browser playback
- ✅ Use 1080p max resolution
- ✅ Test in browser before uploading

### For PDF Files:

- ✅ Save as PDF 1.7 or earlier
- ✅ Don't use password protection
- ✅ Keep under 50MB
- ✅ Avoid complex vector graphics

### For Images:

- ✅ Use JPEG, PNG, or WebP
- ✅ Max 10MB per image
- ✅ Reasonable resolution (4K max)
- ✅ Avoid TIFF or RAW formats

---

## 🎓 Understanding File Types

### DOCX = ZIP Archive

- Word documents are compressed ZIP files
- Contains XML files + images
- Can be opened as ZIP to inspect
- "Corrupted zip" = broken compression

### Video = Container + Codecs

- MP4 is a container (like a folder)
- H.264 is video codec (compression method)
- AAC is audio codec
- Browser needs to support BOTH

### Why Format Matters:

```
File Extension ≠ Actual Format

example.mp4 → Could contain H.264 ✅
example.mp4 → Could contain H.265 ❌
example.mp4 → Could contain VP9 ❌

Always check actual codec, not just extension!
```

---

## Summary

**Most common issue:** Wrong video format
**Easiest fix:** Convert to MP4 (H.264)

**Second most common:** Incomplete DOCX upload
**Easiest fix:** Re-upload with stable connection

**Remember:**

1. Always retry first
2. Download to verify file integrity
3. Convert videos to MP4 before upload
4. Use stable internet for large files
5. Check console (F12) for detailed errors

All errors now have retry buttons and download fallbacks! 🎉
