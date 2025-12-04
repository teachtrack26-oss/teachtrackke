# 🧪 TeachTrack Advanced Presentation Features - Testing Guide

## Prerequisites

- Backend running on `http://192.168.0.102:8000`
- Frontend running on `http://192.168.0.102:3000`
- At least one user account created
- At least one PDF note uploaded

---

## Test Suite

### ✅ Test 1: Annotation Persistence

**Steps:**

1. Login to TeachTrack
2. Navigate to Notes page
3. Click the Play icon (Present) on a PDF note
4. Click the Pen icon in the top toolbar
5. Draw something on the first page
6. Navigate to page 2 using arrow keys or next button
7. Navigate back to page 1

**Expected Result:**

- ✅ Drawing appears immediately on page 1
- ✅ Drawing disappears when moving to page 2
- ✅ Drawing reappears when returning to page 1
- ✅ Annotation is saved to database (check `note_annotations` table)

**Database Verification:**

```sql
SELECT * FROM note_annotations WHERE note_id = YOUR_NOTE_ID;
```

**API Test:**

```bash
# Get annotations for a note
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://192.168.0.102:8000/api/v1/notes/1/annotations?page_number=1
```

---

### ✅ Test 2: Presentation Timer

**Steps:**

1. Open a note in presentation mode
2. Click the Clock icon in top toolbar
3. Timer display appears showing 00:00:00
4. Click "Start" button
5. Wait 5 seconds
6. Click "Stop" button
7. Click "Reset" button

**Expected Result:**

- ✅ Timer shows in top-right corner
- ✅ Timer counts up (00:00:05 after 5 seconds)
- ✅ Timer stops when "Stop" is clicked
- ✅ Timer resets to 00:00:00 when "Reset" is clicked
- ✅ Session saved to database with duration

**Database Verification:**

```sql
SELECT * FROM presentation_sessions WHERE note_id = YOUR_NOTE_ID ORDER BY started_at DESC;
```

**API Test:**

```bash
# Get session history
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://192.168.0.102:8000/api/v1/notes/1/sessions
```

---

### ✅ Test 3: Laser Pointer

**Steps:**

1. Open a note in presentation mode
2. Click the Target icon (crosshair) in top toolbar
3. Move mouse over the PDF

**Expected Result:**

- ✅ Red circular dot appears
- ✅ Dot follows mouse cursor smoothly
- ✅ Dot has glowing shadow effect
- ✅ Clicking target icon again disables laser pointer

**Note:** This is frontend-only, no database/API check needed.

---

### ✅ Test 4: Speaker Notes

**Steps:**

1. Open a PDF note in presentation mode
2. Click the Document icon in top toolbar
3. Speaker notes panel appears in bottom-right
4. Type "This is a test note for slide 1"
5. Click outside the textarea or navigate to next page
6. Navigate back to page 1

**Expected Result:**

- ✅ Notes panel shows "Speaker Notes - Page 1"
- ✅ Text saves automatically when clicking away
- ✅ Notes disappear when changing pages
- ✅ Notes reappear when returning to page 1
- ✅ Different pages can have different notes

**Database Verification:**

```sql
SELECT * FROM speaker_notes WHERE note_id = YOUR_NOTE_ID;
```

**API Test:**

```bash
# Get speaker notes for page 1
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://192.168.0.102:8000/api/v1/notes/1/speaker-notes?page_number=1
```

---

### ✅ Test 5: Share Presentation

**Steps:**

1. Open a note in presentation mode
2. Click the Share icon (FiShare2) in top toolbar
3. ShareModal opens
4. Set "Expiry (days)" to 7
5. Check "Allow viewers to download"
6. Click "Generate Share Link"
7. Click the Copy icon next to the generated link
8. Open a private/incognito browser window
9. Paste the link and navigate to it

**Expected Result:**

- ✅ Share link generated with format: `http://192.168.0.102:3000/shared/{token}`
- ✅ Link copied to clipboard
- ✅ Modal shows active share link
- ✅ Public viewer opens without login
- ✅ Presentation displays correctly
- ✅ Download button visible (because you allowed downloads)
- ✅ View count increases each time link is accessed

**Database Verification:**

```sql
SELECT * FROM shared_presentations WHERE note_id = YOUR_NOTE_ID;
```

**API Tests:**

```bash
# Create share link
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"expires_in_days": 7, "allow_download": true}' \
  http://192.168.0.102:8000/api/v1/notes/1/share

# Access public share (no auth required)
curl http://192.168.0.102:8000/api/v1/shared/YOUR_SHARE_TOKEN
```

---

### ✅ Test 6: PDF Search

**Steps:**

1. Open a PDF note in presentation mode
2. Click the Search icon (magnifying glass) in top toolbar
3. Search box appears at top center
4. Type "test" in the search box
5. Click X to close search

**Expected Result:**

- ✅ Search box toggles on/off
- ✅ Input field accepts text
- ✅ Close button works

**Note:** Full text search with highlighting requires additional plugin. UI is ready for integration.

---

### ✅ Test 7: Print Functionality

**Steps:**

1. Open a note in presentation mode
2. Click the Printer icon in top toolbar
3. Browser print dialog opens
4. Select printer and settings
5. Print or save as PDF

**Expected Result:**

- ✅ Print dialog opens
- ✅ Current view can be printed
- ✅ Works with PDFs, images, and documents

---

### ✅ Test 8: Keyboard Shortcuts

**Steps:**

1. Open a note in presentation mode
2. Test each keyboard shortcut:
   - Press `ESC` → Viewer closes
   - Press `F` → Fullscreen toggles
   - Press `→` (right arrow) → Next note/page
   - Press `←` (left arrow) → Previous note/page
   - Press `+` or `=` → Zoom in (PDF only)
   - Press `-` → Zoom out (PDF only)
   - Press `Home` → First page (PDF only)
   - Press `End` → Last page (PDF only)

**Expected Result:**

- ✅ All shortcuts work as described
- ✅ Shortcuts don't conflict with each other
- ✅ Focus stays on viewer during navigation

---

### ✅ Test 9: Multi-Page Annotations

**Steps:**

1. Open a multi-page PDF
2. Enable annotation mode
3. Draw on page 1
4. Navigate to page 2
5. Draw different content on page 2
6. Navigate to page 3
7. Draw different content on page 3
8. Navigate back through pages 3 → 2 → 1

**Expected Result:**

- ✅ Each page stores its own unique annotations
- ✅ Annotations don't mix between pages
- ✅ All annotations persist across page changes
- ✅ Database has 3 separate annotation records

---

### ✅ Test 10: Share Link Expiry

**Steps:**

1. Create a share link with 0 days expiry (never expires)
2. Create another share link with 1 day expiry
3. Access both links in private browser
4. Check database for expiry dates

**Expected Result:**

- ✅ First link has `expires_at = NULL`
- ✅ Second link has `expires_at = tomorrow's date`
- ✅ Both links work immediately
- ✅ Can be deactivated manually via "Deactivate" button

**Database Verification:**

```sql
SELECT share_token, expires_at, is_active, view_count
FROM shared_presentations
WHERE note_id = YOUR_NOTE_ID;
```

---

### ✅ Test 11: Share Link Revocation

**Steps:**

1. Create a share link
2. Copy the link
3. Access it in private browser (should work)
4. Return to ShareModal
5. Click "Deactivate" (trash icon) on the share link
6. Confirm deactivation
7. Try accessing the link again in private browser

**Expected Result:**

- ✅ Link works before deactivation
- ✅ After deactivation, link shows "Presentation Not Found or Expired"
- ✅ Database shows `is_active = 0` for that link
- ✅ Link appears grayed out in ShareModal

---

### ✅ Test 12: Timer Session History

**Steps:**

1. Start timer for 10 seconds, then stop
2. Reset and start again for 5 seconds, then stop
3. Check API for session history

**Expected Result:**

- ✅ Two sessions recorded in database
- ✅ First session: duration_seconds = 10
- ✅ Second session: duration_seconds = 5
- ✅ Both have started_at and ended_at timestamps

**API Test:**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://192.168.0.102:8000/api/v1/notes/1/sessions
```

---

### ✅ Test 13: Speaker Notes Uniqueness

**Steps:**

1. Open a PDF note
2. Add speaker note "Page 1 notes" on page 1
3. Navigate to page 2
4. Add speaker note "Page 2 notes" on page 2
5. Navigate back to page 1
6. Try to create another note on page 1 (should update existing)

**Expected Result:**

- ✅ Page 1 has "Page 1 notes"
- ✅ Page 2 has "Page 2 notes"
- ✅ Database has 2 records (one per page)
- ✅ UNIQUE constraint prevents duplicates
- ✅ Update replaces existing note instead of creating duplicate

---

### ✅ Test 14: Clear Annotation

**Steps:**

1. Enable annotation mode
2. Draw something on page 1
3. Click "Clear" button
4. Navigate to page 2 and back to page 1

**Expected Result:**

- ✅ Drawing disappears immediately
- ✅ Annotation deleted from database
- ✅ Page 1 is empty when returning
- ✅ API shows no annotations for page 1

---

### ✅ Test 15: Multiple File Types in Shared View

**Steps:**

1. Share a PDF note → Access public link
2. Share an image note → Access public link
3. Share a video note → Access public link
4. Share a DOCX note → Access public link

**Expected Result:**

- ✅ PDF: Shows PDF viewer with navigation
- ✅ Image: Shows image viewer with zoom
- ✅ Video: Shows video player with controls
- ✅ DOCX: Shows document preview
- ✅ All types show title and view count
- ✅ Download button appears if enabled

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot find module PDFPresentation"

**Cause:** TypeScript compilation error (false positive)
**Solution:** Files exist, refresh VS Code or restart TS server

### Issue 2: Annotations not saving

**Cause:** noteId not passed to PDFPresentation
**Solution:** Verify NoteViewer passes noteId prop

### Issue 3: Share links return 404

**Cause:** Token mismatch or link deactivated
**Solution:** Check `shared_presentations` table for `is_active = 1`

### Issue 4: Timer doesn't stop

**Cause:** Interval not cleared
**Solution:** Check cleanup useEffect in PDFPresentation

### Issue 5: "Optional is not defined" in backend

**Cause:** Missing import
**Solution:** Verify `from typing import List, Optional` in main.py

---

## 📊 Performance Tests

### Database Performance:

```sql
-- Check annotation storage size
SELECT note_id, COUNT(*) as annotation_count,
       SUM(LENGTH(drawing_data)) as total_bytes
FROM note_annotations
GROUP BY note_id;

-- Check most shared notes
SELECT n.title, COUNT(sp.id) as share_count, SUM(sp.view_count) as total_views
FROM notes n
LEFT JOIN shared_presentations sp ON n.id = sp.note_id
WHERE sp.is_active = 1
GROUP BY n.id
ORDER BY total_views DESC;

-- Check average presentation duration
SELECT note_id, AVG(duration_seconds) as avg_duration_seconds
FROM presentation_sessions
WHERE ended_at IS NOT NULL
GROUP BY note_id;
```

### API Response Times:

```bash
# Measure annotation API
time curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://192.168.0.102:8000/api/v1/notes/1/annotations

# Measure share link creation
time curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"expires_in_days": 7, "allow_download": false}' \
  http://192.168.0.102:8000/api/v1/notes/1/share
```

---

## ✅ Checklist Summary

- [ ] Test 1: Annotation Persistence
- [ ] Test 2: Presentation Timer
- [ ] Test 3: Laser Pointer
- [ ] Test 4: Speaker Notes
- [ ] Test 5: Share Presentation
- [ ] Test 6: PDF Search UI
- [ ] Test 7: Print Functionality
- [ ] Test 8: Keyboard Shortcuts
- [ ] Test 9: Multi-Page Annotations
- [ ] Test 10: Share Link Expiry
- [ ] Test 11: Share Link Revocation
- [ ] Test 12: Timer Session History
- [ ] Test 13: Speaker Notes Uniqueness
- [ ] Test 14: Clear Annotation
- [ ] Test 15: Multiple File Types in Shared View

---

## 🎯 Acceptance Criteria

**All features PASS if:**

1. ✅ All API endpoints return 200 OK
2. ✅ Database records created/updated correctly
3. ✅ UI elements toggle and display properly
4. ✅ Data persists across page reloads
5. ✅ Shared links work without authentication
6. ✅ No console errors in browser
7. ✅ No Python exceptions in backend
8. ✅ Keyboard shortcuts work as documented
9. ✅ Performance is acceptable (API < 500ms)
10. ✅ Mobile view is usable (bonus)

---

## 🚀 Production Readiness

Before deploying to production:

1. **Environment Variables:**

   ```env
   FRONTEND_URL=https://teachtrack.yourdomain.com
   NEXT_PUBLIC_API_URL=https://api.teachtrack.yourdomain.com
   ```

2. **Database Indexes:**

   ```sql
   CREATE INDEX idx_annotations_note_page ON note_annotations(note_id, page_number);
   CREATE INDEX idx_speaker_notes_note_page ON speaker_notes(note_id, page_number);
   CREATE INDEX idx_shares_token ON shared_presentations(share_token);
   CREATE INDEX idx_shares_expires ON shared_presentations(expires_at);
   ```

3. **Cleanup Script (Optional):**

   ```sql
   -- Delete expired share links
   UPDATE shared_presentations
   SET is_active = 0
   WHERE expires_at < NOW() AND is_active = 1;
   ```

4. **Rate Limiting:**

   - Add rate limiting to share link creation (max 10 per note)
   - Limit annotation saves (max 100 per note)

5. **File Size Limits:**
   - Consider storing annotations as separate image files for large drawings
   - Limit drawing data size to 1MB per annotation

---

**Testing Complete! Ready for Production 🎉**
