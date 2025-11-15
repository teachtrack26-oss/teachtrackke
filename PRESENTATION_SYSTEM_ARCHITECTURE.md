# TeachTrack Presentation System - Complete Architecture

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [File Structure & Responsibilities](#file-structure--responsibilities)
3. [Tech Stack](#tech-stack)
4. [Request Flow](#request-flow)
5. [Current Issues](#current-issues)
6. [Component Interactions](#component-interactions)

---

## 1. System Overview

The TeachTrack presentation system handles viewing and presenting different file types (PDF, DOCX, Videos, Images) uploaded by teachers. Files are stored in Cloudflare R2 and proxied through a FastAPI backend to avoid CORS issues.

### Architecture Diagram

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Browser   │ ───▶ │   FastAPI   │ ───▶ │ Cloudflare  │
│  (Next.js)  │ ◀─── │   Backend   │ ◀─── │     R2      │
└─────────────┘      └─────────────┘      └─────────────┘
     │                      │                      │
     │                      │                      │
  Frontend              Proxy Server           Storage
  Components            /api/v1/proxy-file     (S3-compatible)
```

---

## 2. File Structure & Responsibilities

### 📁 Frontend Files (Next.js 16 + React 19 + TypeScript)

#### **Main Entry Point**

```
frontend/app/notes/page.tsx
```

**Responsibility:** Notes list page

- Fetches all notes from API
- Displays note cards in grid
- Handles click on "Present" button (FiPlay icon)
- Opens `NoteViewer` component when user clicks present

**Key Code:**

```typescript
Line 336: setShowViewer(true)  // Opens viewer
Line 649: <NoteViewer note={...} onClose={() => setShowViewer(false)} />
```

#### **Viewer Router**

```
frontend/components/NoteViewer.tsx
```

**Responsibility:** Main viewer component (routes to appropriate viewer based on file type)

- Detects file type (pdf, image, video, document, text)
- Shows fullscreen viewer with controls
- Routes to OLD viewer components (not presentation components!)

**Key Code:**

```typescript
Lines 71-96: getFileType() - Detects file type from MIME or URL
Lines 274-300: Renders viewer based on fileType:
  - pdf → PDFPresentation ✅ (correct, uses presentation)
  - image → ImageViewer ❌ (WRONG! Should use ImagePresentation)
  - video → VideoPlayer ❌ (WRONG! Should wrap in presentation context)
  - document → DocumentViewer ❌ (WRONG! Should use DOCXPresentation)
```

**🚨 PROBLEM #1:** `NoteViewer` is NOT using the new presentation components!

---

#### **Presentation Components (NEW - Enhanced)**

##### 1. **Unified Router**

```
frontend/components/PresentationMode.tsx
```

**Responsibility:** Routes to correct presentation component

- **Input:** File object with type, URL, title
- **Output:** Appropriate presentation component
- Error handling for unsupported types

**Key Code:**

```typescript
Lines 27-153: Switch statement routing:
  case 'pdf' → PDFPresentation
  case 'document' → DOCXPresentation
  case 'video' → VideoPlayer (wrapped)
  case 'image' → ImagePresentation
  default → Unsupported message
```

##### 2. **PDF Presentation**

```
frontend/components/PDFPresentation.tsx
```

**Tech:** react-pdf + pdfjs-dist
**Features:**

- Page navigation
- Zoom controls
- Annotations
- Speaker notes
- Fullscreen mode

##### 3. **DOCX Presentation** (NEW)

```
frontend/components/DOCXPresentation.tsx
```

**Tech:** mammoth.js (converts DOCX → HTML)
**Features:**

- Slide splitting on H1/H2 headings
- Navigation between slides
- Speaker notes per slide
- Fullscreen mode
- **FILE VALIDATION:** ZIP signature check, size check

**Key Code:**

```typescript
Lines 93-166: loadDocument() - Downloads and validates DOCX
Lines 44-86: splitIntoSlides() - Splits HTML by headings
Lines 108-115: ZIP signature validation (PK header check)
```

##### 4. **Image Presentation** (NEW)

```
frontend/components/ImagePresentation.tsx
```

**Tech:** Native HTML img + CSS transforms
**Features:**

- Multi-image slideshow
- Zoom (0.25x to 5x)
- Pan (drag when zoomed)
- Thumbnail navigation
- Fullscreen mode

##### 5. **Video Player**

```
frontend/components/VideoPlayer.tsx
```

**Tech:** Native HTML5 video element
**Features:**

- Play/pause, seek
- Volume control
- Skip forward/backward
- Fullscreen
- **Multiple source fallbacks** for codec compatibility

---

#### **Old Viewer Components (Should be replaced)**

##### 1. **Document Viewer** (OLD)

```
frontend/components/DocumentViewer.tsx
```

**Current Use:** Called by NoteViewer for DOCX files
**Problem:** Basic viewer, no presentation features
**Should Use:** `DOCXPresentation.tsx` instead

##### 2. **Image Viewer** (OLD)

```
frontend/components/ImageViewer.tsx
```

**Current Use:** Called by NoteViewer for images
**Problem:** Single image only, no zoom/pan
**Should Use:** `ImagePresentation.tsx` instead

---

### 📁 Backend Files (FastAPI + Python)

#### **Main API Server**

```
backend/main.py
```

**Lines 2733-2880:** `/api/v1/proxy-file` endpoint

**Responsibility:**

- Proxies file requests from R2 to avoid CORS
- Handles Range headers (for video seeking)
- Streams large files in 64KB chunks
- Returns proper Content-Type headers

**Key Features:**

```python
Lines 2753-2754: Extended timeout (600s total, 300s connect)
Lines 2761-2764: Range header forwarding for video
Lines 2768-2775: Error detection and logging
Lines 2778-2786: Content-Type detection
Lines 2788-2793: Video format warning (quicktime, avi)
Lines 2806-2813: Streaming with 64KB chunks
```

#### **Database Models**

```
backend/models.py
```

Contains:

- Note model (file metadata)
- SpeakerNote model (presentation notes)
- Annotation model (PDF annotations)

#### **API Schemas**

```
backend/schemas.py
```

Pydantic models for API requests/responses

---

## 3. Tech Stack

### Frontend Dependencies (package.json)

| Library         | Version  | Purpose                | Used By          |
| --------------- | -------- | ---------------------- | ---------------- |
| **next**        | 16.0.0   | React framework        | All pages        |
| **react**       | 19.2.0   | UI library             | All components   |
| **mammoth**     | ^1.11.0  | DOCX → HTML conversion | DOCXPresentation |
| **react-pdf**   | ^10.2.0  | PDF rendering          | PDFPresentation  |
| **pdfjs-dist**  | ^5.4.394 | PDF.js library         | PDFPresentation  |
| **axios**       | ^1.13.0  | HTTP requests          | All API calls    |
| **react-icons** | ^5.5.0   | Icon components        | All UI           |
| **pdf-lib**     | ^1.17.1  | PDF manipulation       | Annotations      |

### Backend Dependencies (requirements.txt)

| Library         | Version    | Purpose               |
| --------------- | ---------- | --------------------- |
| **fastapi**     | 0.115.0    | Web framework         |
| **uvicorn**     | 0.32.0     | ASGI server           |
| **sqlalchemy**  | 2.0.35     | Database ORM          |
| **PyPDF2**      | 3.0.1      | PDF processing        |
| **python-docx** | 1.1.2      | DOCX processing       |
| **pymupdf**     | 1.26.1     | PDF rendering         |
| **boto3**       | 1.34.23    | S3/R2 client          |
| **httpx**       | (implicit) | HTTP client for proxy |

### Storage

**Cloudflare R2** (S3-compatible object storage)

- Files uploaded via backend
- Public URLs like: `https://pub-xxxxxx.r2.dev/path/to/file.docx`
- CORS issues → solved by backend proxy

---

## 4. Request Flow

### **Scenario: User Clicks "Present" on DOCX File**

```
┌──────────────────────────────────────────────────────────────┐
│ 1. User Action                                                │
├──────────────────────────────────────────────────────────────┤
│ User clicks FiPlay icon on note card                         │
│ File: frontend/app/notes/page.tsx, Line 336                  │
│ Code: setShowViewer(true)                                    │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. Open NoteViewer                                           │
├──────────────────────────────────────────────────────────────┤
│ File: frontend/components/NoteViewer.tsx                     │
│ Props: { note, onClose, notes, currentIndex }               │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. Detect File Type                                          │
├──────────────────────────────────────────────────────────────┤
│ Function: getFileType()                                      │
│ Lines 71-96                                                  │
│ Checks: MIME type or file extension                         │
│ Result: "document" for DOCX files                           │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. Render Viewer Component                                   │
├──────────────────────────────────────────────────────────────┤
│ Lines 291-300 in NoteViewer.tsx                              │
│ fileType === "document" →                                    │
│   ❌ <DocumentViewer /> (OLD, basic viewer)                 │
│   ✅ SHOULD BE: <DOCXPresentation />                        │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. DocumentViewer Loads File                                 │
├──────────────────────────────────────────────────────────────┤
│ File: frontend/components/DocumentViewer.tsx                 │
│ Uses: mammoth.js to convert DOCX → HTML                     │
│ Problems:                                                    │
│   - No ZIP validation                                        │
│   - No slide splitting                                       │
│   - No speaker notes                                         │
│   - No presentation controls                                 │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. Fetch File from R2                                        │
├──────────────────────────────────────────────────────────────┤
│ URL: file_url from note object                              │
│ Example: https://pub-xxxxx.r2.dev/files/document.docx       │
│ Method: axios.get(proxiedUrl, { responseType: "arraybuffer" })│
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 7. Proxy Through Backend                                     │
├──────────────────────────────────────────────────────────────┤
│ Function: getProxiedUrl()                                    │
│ Converts: https://r2.dev/file.docx                          │
│ To: http://localhost:8000/api/v1/proxy-file?url=...         │
│                                                              │
│ Backend endpoint: /api/v1/proxy-file                        │
│ File: backend/main.py, Lines 2733-2880                      │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 8. Backend Fetches from R2                                   │
├──────────────────────────────────────────────────────────────┤
│ httpx.AsyncClient() makes request to R2                     │
│ Timeout: 600 seconds                                         │
│ Headers: Range (if present), Accept                         │
│ Response: File bytes in chunks (64KB each)                  │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 9. Stream to Frontend                                        │
├──────────────────────────────────────────────────────────────┤
│ StreamingResponse with proper headers:                      │
│   - Content-Type: application/vnd.openxml...               │
│   - Access-Control-Allow-Origin: *                          │
│   - Cache-Control: public, max-age=31536000                 │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 10. Frontend Receives ArrayBuffer                            │
├──────────────────────────────────────────────────────────────┤
│ axios.get() receives complete file                          │
│ Type: ArrayBuffer                                            │
│ Size: file_size_bytes                                        │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 11. Mammoth.js Converts DOCX                                 │
├──────────────────────────────────────────────────────────────┤
│ mammoth.convertToHtml({ arrayBuffer })                       │
│ Output: HTML string                                          │
│ Problem: If ZIP corrupted, throws "Corrupted zip" error     │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 12. Display HTML                                             │
├──────────────────────────────────────────────────────────────┤
│ dangerouslySetInnerHTML={{ __html: result.value }}         │
│ Problems with OLD DocumentViewer:                           │
│   - Shows entire doc as one page (no slides)                │
│   - No navigation                                            │
│   - No speaker notes                                         │
│   - No retry on error                                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Current Issues

### 🚨 **CRITICAL ISSUE #1: Wrong Components Being Used**

**Location:** `frontend/components/NoteViewer.tsx`, Lines 274-300

**Current Code:**

```typescript
{fileType === "pdf" && (
  <PDFPresentation ... />  // ✅ Correct
)}

{fileType === "image" && (
  <ImageViewer ... />      // ❌ WRONG! Should be ImagePresentation
)}

{fileType === "video" && (
  <VideoPlayer ... />      // ❌ WRONG! Should wrap in PresentationMode
)}

{(fileType === "document" || fileType === "text") && (
  <DocumentViewer ... />   // ❌ WRONG! Should be DOCXPresentation
)}
```

**What Should Happen:**

```typescript
// Option 1: Use PresentationMode router
<PresentationMode
  file={{
    id: currentNote.id,
    title: currentNote.title,
    file_url: currentNote.file_url,
    file_type: fileType
  }}
  onClose={onClose}
/>

// Option 2: Use components directly
{fileType === "pdf" && <PDFPresentation ... />}
{fileType === "document" && <DOCXPresentation noteId={...} fileUrl={...} title={...} />}
{fileType === "image" && <ImagePresentation images=[{...}] />}
{fileType === "video" && <VideoPlayer videoUrl={...} />}
```

---

### 🚨 **ISSUE #2: DOCX "Corrupted Zip" Error**

**Where It Happens:**

- `DocumentViewer.tsx` (currently used) - NO validation
- `DOCXPresentation.tsx` (should be used) - HAS validation

**Root Causes:**

1. **File not fully uploaded** to R2
2. **Network interruption** during download from R2
3. **File actually corrupted** before upload
4. **Wrong Content-Type** from R2 (returns HTML error page instead of file)

**Evidence from Screenshots:**

```
Error: "Corrupted zip: expected 12 records in central dir, got 0"
File: "for grandstart school"
Size: 0.03 MB (only 30KB - suspiciously small!)
```

**Analysis:**

- 30KB is TOO SMALL for a DOCX file with content
- Likely received error HTML page or incomplete file
- No ZIP signature validation before passing to mammoth.js

**DOCXPresentation.tsx Has Fixes:**

```typescript
// Check file size
if (arrayBuffer.byteLength < 1000) {
  throw new Error("File appears to be corrupted or incomplete");
}

// Validate ZIP signature
const bytes = new Uint8Array(arrayBuffer);
const isPKZip = bytes[0] === 0x50 && bytes[1] === 0x4b; // "PK"
if (!isPKZip) {
  throw new Error("File is not a valid DOCX document");
}
```

---

### 🚨 **ISSUE #3: Video "Format Not Supported" Error**

**Where It Happens:** `VideoPlayer.tsx`

**Root Causes:**

1. **Codec unsupported** by browser (H.265, VP9, QuickTime)
2. **Wrong MIME type** from R2
3. **Corrupted video** file

**Evidence from Screenshots:**

```
Error: "Video format not supported by browser"
Ready state: 0 (HAVE_NOTHING)
Network state: 3 (NETWORK_NO_SOURCE)
File: "grok-video-1c6c90a2-6e88-4c31-a52a-207525784ca6"
Size: 2.35 MB
```

**Analysis:**

- Network state 3 = browser couldn't load ANY of the sources
- Ready state 0 = no data loaded at all
- File downloaded successfully (size shows)
- Problem: Browser can't decode the codec

**Browser Video Support:**

- ✅ MP4 (H.264 + AAC) - Universal
- ❌ MOV (QuickTime) - Safari only
- ❌ H.265/HEVC - Limited support
- ❌ AVI, WMV - No browser support

**VideoPlayer.tsx Has Fixes:**

```typescript
// Multiple source attempts
<source src={url} type="video/mp4" />
<source src={url} type="video/webm" />
<source src={url} type="video/ogg" />
<source src={url} type="video/quicktime" />
<source src={url} /> // Browser guesses MIME

// Better error messages
case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
  userFriendlyMessage = "Your browser doesn't support this video format...";
```

---

### 🚨 **ISSUE #4: PDF Blank Page**

**Status:** NOT actually an error

**Evidence:** Page counter shows "1 / 86" - PDF loaded successfully

**Explanation:**

- Many PDFs have blank first pages (title pages, cover pages)
- User needs to navigate to page 2 with arrow buttons
- PDF viewer is working correctly

---

## 6. Component Interactions

### Component Dependency Tree

```
notes/page.tsx (Entry)
  │
  ├─▶ NoteViewer ⚠️ (Routes to wrong components)
  │     │
  │     ├─▶ PDFPresentation ✅ (Correct)
  │     ├─▶ ImageViewer ❌ (Should be ImagePresentation)
  │     ├─▶ VideoPlayer ❌ (Works but no presentation wrapper)
  │     └─▶ DocumentViewer ❌ (Should be DOCXPresentation)
  │
  └─▶ PresentationMode 🎯 (NEW, should be used instead!)
        │
        ├─▶ PDFPresentation
        ├─▶ DOCXPresentation (Enhanced with validation)
        ├─▶ ImagePresentation (Enhanced with zoom/pan)
        └─▶ VideoPlayer (Wrapped in presentation context)
```

### Data Flow

```
[User] → [notes/page] → [NoteViewer] → [Component]
                                            ↓
                                    [getProxiedUrl]
                                            ↓
                              [/api/v1/proxy-file]
                                            ↓
                                  [Cloudflare R2]
                                            ↓
                              [Backend streams file]
                                            ↓
                         [Frontend receives ArrayBuffer]
                                            ↓
                          [Library processes file]
                          (mammoth, pdfjs, native)
                                            ↓
                              [Display in browser]
```

---

## 7. THE FIX

### Solution: Update NoteViewer to Use New Components

**File to Edit:** `frontend/components/NoteViewer.tsx`

**Lines 274-300:** Replace OLD viewer logic with NEW presentation components

**Option A: Use PresentationMode Router (Recommended)**

```typescript
// Replace entire render section
<PresentationMode
  file={{
    id: currentNote.id,
    title: currentNote.title,
    file_url: currentNote.file_url,
    file_type: fileType as any,
  }}
  onClose={onClose}
/>
```

**Option B: Use Individual Components**

```typescript
{
  fileType === "pdf" && (
    <PDFPresentation
      fileUrl={currentNote.file_url}
      noteId={currentNote.id}
      showAnnotations={showAnnotations}
    />
  );
}

{
  fileType === "document" && (
    <DOCXPresentation
      noteId={currentNote.id}
      fileUrl={currentNote.file_url}
      title={currentNote.title}
    />
  );
}

{
  fileType === "image" && (
    <ImagePresentation
      images={[
        {
          id: currentNote.id,
          title: currentNote.title,
          file_url: currentNote.file_url,
        },
      ]}
      initialIndex={0}
    />
  );
}

{
  fileType === "video" && (
    <div className="h-full bg-gray-900 flex flex-col">
      <div className="bg-gray-800 text-white px-6 py-3">
        <h1 className="text-lg font-semibold">{currentNote.title}</h1>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <VideoPlayer videoUrl={currentNote.file_url} />
      </div>
    </div>
  );
}
```

---

## 8. Testing Checklist

After implementing the fix:

### DOCX Files

- [ ] Click "Present" on DOCX file
- [ ] Verify DOCXPresentation loads (not DocumentViewer)
- [ ] Check for slide splitting on headings
- [ ] Test speaker notes panel (N key)
- [ ] Verify retry button on error
- [ ] Test with corrupted file (should show friendly error)
- [ ] Test with valid file (should display slides)
- [ ] Test ZIP validation (console should show validation logs)

### Video Files

- [ ] Click "Present" on video file
- [ ] Verify VideoPlayer loads with presentation wrapper
- [ ] Check error handling for unsupported formats
- [ ] Test retry button on error
- [ ] Test download fallback
- [ ] Test with MP4 (should work)
- [ ] Test with MOV/AVI (should show format error)

### Image Files

- [ ] Click "Present" on image file
- [ ] Verify ImagePresentation loads (not ImageViewer)
- [ ] Test zoom (+/-) keys
- [ ] Test pan (drag when zoomed)
- [ ] Test fullscreen (F key)
- [ ] Test thumbnail navigation

### PDF Files

- [ ] Click "Present" on PDF
- [ ] Verify PDFPresentation loads (should already work)
- [ ] Test page navigation
- [ ] Test annotations (if enabled)

---

## 9. Summary of Responsibilities

| Component                 | Current Status          | Should Do                                          |
| ------------------------- | ----------------------- | -------------------------------------------------- |
| **notes/page.tsx**        | ✅ Working              | Entry point, opens viewer                          |
| **NoteViewer.tsx**        | ❌ Using old components | Should route to PresentationMode or new components |
| **PresentationMode.tsx**  | ✅ Ready                | Router for all file types                          |
| **DOCXPresentation.tsx**  | ✅ Ready                | Enhanced DOCX viewer with validation               |
| **ImagePresentation.tsx** | ✅ Ready                | Enhanced image viewer with zoom/pan                |
| **VideoPlayer.tsx**       | ✅ Ready                | Video player with better error handling            |
| **PDFPresentation.tsx**   | ✅ Working              | Already integrated                                 |
| **DocumentViewer.tsx**    | ⚠️ Deprecated           | Old component, should not be used                  |
| **ImageViewer.tsx**       | ⚠️ Deprecated           | Old component, should not be used                  |
| **backend/main.py**       | ✅ Working              | Proxy endpoint with good error handling            |

---

## 10. Conclusion

**The core issue:** The notes viewer (NoteViewer.tsx) is calling OLD viewer components instead of NEW presentation components.

**The solution:** Update NoteViewer.tsx to use:

- DOCXPresentation instead of DocumentViewer
- ImagePresentation instead of ImageViewer
- Wrapped VideoPlayer instead of bare VideoPlayer
- Or use PresentationMode router for all files

**Why files are failing:**

1. **DOCX:** Old DocumentViewer has no validation → crashes on corrupted files
2. **Video:** Works but shows cryptic browser errors → needs user-friendly messages
3. **Images:** Old ImageViewer is basic → missing zoom/pan features

**All the fixes are already built** - they're just not being used! The presentation components are ready and waiting in the codebase.
