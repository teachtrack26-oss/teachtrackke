# Better Solutions for Presenting Uploaded Files

## Current Issues

- mammoth.js struggles with complex/corrupted DOCX files
- No PowerPoint (PPTX) support despite backend accepting them
- Client-side conversion is unreliable

## Recommended Solutions (Pick One)

---

## ⭐ **SOLUTION 1: Backend PDF Conversion** (BEST - Most Reliable)

### Overview

Convert DOCX/PPTX files to PDF on the backend during upload. Store both original + PDF version.

### Benefits

✅ Most reliable - server-side conversion with LibreOffice/unoconv
✅ Works with ALL document types (DOCX, PPTX, DOC, PPT)
✅ No client-side parsing issues
✅ PDF.js is rock-solid and already working
✅ Users can still download original files

### Implementation

#### Backend Changes:

**1. Install LibreOffice on server:**

```bash
# Ubuntu/Debian
sudo apt-get install libreoffice

# Windows
choco install libreoffice

# Docker
RUN apt-get update && apt-get install -y libreoffice
```

**2. Add conversion endpoint** (`backend/main.py`):

```python
import subprocess
import tempfile

def convert_to_pdf(input_file: bytes, filename: str) -> bytes:
    """Convert DOCX/PPTX to PDF using LibreOffice"""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Save input file
        input_path = os.path.join(tmpdir, filename)
        with open(input_path, 'wb') as f:
            f.write(input_file)

        # Convert using LibreOffice
        subprocess.run([
            'libreoffice',
            '--headless',
            '--convert-to', 'pdf',
            '--outdir', tmpdir,
            input_path
        ], check=True, timeout=30)

        # Read PDF output
        pdf_filename = os.path.splitext(filename)[0] + '.pdf'
        pdf_path = os.path.join(tmpdir, pdf_filename)
        with open(pdf_path, 'rb') as f:
            return f.read()

# Modify upload endpoint
@app.post(f"{settings.API_V1_PREFIX}/notes/upload")
async def upload_note_file(...):
    # ... existing code ...

    # Auto-convert DOCX/PPTX to PDF
    pdf_url = None
    if file_extension in ['docx', 'doc', 'pptx', 'ppt']:
        try:
            pdf_content = convert_to_pdf(file_content, file.filename)
            pdf_filename = os.path.splitext(file.filename)[0] + '.pdf'

            pdf_result = r2_storage.upload_file(
                file_content=pdf_content,
                filename=pdf_filename,
                content_type='application/pdf',
                folder="notes/converted",
                metadata={'original_file': file.filename}
            )

            if pdf_result['success']:
                pdf_url = pdf_result['file_url']
        except Exception as e:
            print(f"PDF conversion failed: {e}")
            # Continue with original file

    # Save to database with PDF URL
    new_note = Note(
        # ... existing fields ...
        file_url=upload_result['file_url'],  # Original file
        pdf_url=pdf_url,  # Converted PDF (optional)
    )
```

**3. Add pdf_url column to database:**

```sql
ALTER TABLE notes ADD COLUMN pdf_url TEXT;
```

#### Frontend Changes:

**Update NoteViewer.tsx:**

```typescript
const fileType = getFileType(currentNote.file_type, currentNote.file_url);

// Prefer PDF version if available
const displayUrl = currentNote.pdf_url || currentNote.file_url;
const displayType = currentNote.pdf_url ? "pdf" : fileType;

// Then use displayType and displayUrl for rendering
{
  displayType === "pdf" && (
    <PDFPresentation fileUrl={displayUrl} noteId={currentNote.id} />
  );
}

{
  displayType === "document" && (
    <div className="flex flex-col items-center justify-center h-full text-white">
      <p className="mb-4">PDF conversion in progress...</p>
      <DOCXPresentation {...props} />
    </div>
  );
}
```

---

## ⭐ **SOLUTION 2: Add PowerPoint Support** (QUICK WIN)

### Overview

Add PPTX viewer using existing libraries (already works for some users!)

### Benefits

✅ Quick to implement
✅ PowerPoint is designed for presentations
✅ Better than DOCX for slide-based content

### Implementation

**Install package:**

```bash
cd frontend
npm install pptxgenjs
```

**Create PPTXPresentation.tsx:**

```typescript
"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export default function PPTXPresentation({ fileUrl, noteId, title }) {
  const [slides, setSlides] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPPTX();
  }, [fileUrl]);

  const loadPPTX = async () => {
    try {
      setLoading(true);

      // For now, show fallback to download
      // Full implementation requires pptx parsing library
      setError("PowerPoint preview coming soon. Please download to view.");
      setLoading(false);
    } catch (err) {
      setError("Failed to load PowerPoint file");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white">
        <p className="text-xl mb-4">{error}</p>
        <button
          onClick={() => window.open(fileUrl, "_blank")}
          className="px-6 py-3 bg-indigo-600 rounded-lg"
        >
          Download PowerPoint
        </button>
      </div>
    );
  }

  return <div>PowerPoint viewer</div>;
}
```

**Update NoteViewer.tsx:**

```typescript
import PPTXPresentation from "./PPTXPresentation";

// In getFileType function:
if (
  fileType.includes("presentation") ||
  fileUrl.endsWith(".pptx") ||
  fileUrl.endsWith(".ppt")
)
  return "presentation";

// In render:
{
  fileType === "presentation" && (
    <PPTXPresentation
      noteId={currentNote.id}
      fileUrl={currentNote.file_url}
      title={currentNote.title}
    />
  );
}
```

---

## ⭐ **SOLUTION 3: Google Docs Viewer** (EASIEST - No Backend)

### Overview

Use Google Docs Viewer to render DOCX/PPTX files in iframe

### Benefits

✅ Zero server-side code
✅ Works with DOCX, PPTX, XLS, etc.
✅ Instant implementation
✅ Google handles all parsing

### Limitations

⚠️ Requires public file URLs
⚠️ External dependency (Google)
⚠️ Limited customization

### Implementation

**Create GoogleDocsViewer.tsx:**

```typescript
"use client";

interface GoogleDocsViewerProps {
  fileUrl: string;
  title: string;
}

export default function GoogleDocsViewer({
  fileUrl,
  title,
}: GoogleDocsViewerProps) {
  const encodedUrl = encodeURIComponent(fileUrl);
  const viewerUrl = `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;

  return (
    <div className="w-full h-full bg-white">
      <iframe
        src={viewerUrl}
        className="w-full h-full border-0"
        title={title}
        allow="fullscreen"
      />
    </div>
  );
}
```

**Update NoteViewer.tsx:**

```typescript
import GoogleDocsViewer from "./GoogleDocsViewer";

{
  fileType === "document" && (
    <GoogleDocsViewer
      fileUrl={currentNote.file_url}
      title={currentNote.title}
    />
  );
}
```

---

## ⭐ **SOLUTION 4: Microsoft Office Online** (IF USING MICROSOFT)

### Overview

Use Office 365 Online viewer (requires subscription)

### Benefits

✅ Native Microsoft rendering
✅ Best DOCX/PPTX support
✅ Full feature support

### Implementation

```typescript
const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
  fileUrl
)}`;

<iframe src={officeViewerUrl} width="100%" height="100%" />;
```

---

## 🎯 **RECOMMENDED APPROACH**

### For Production (Best Quality):

1. ✅ **SOLUTION 1** - Backend PDF conversion
   - Most reliable
   - Works with all document types
   - One-time conversion cost
   - Best user experience

### For Quick Fix (Fastest):

1. ✅ **SOLUTION 3** - Google Docs Viewer
   - Implement in 5 minutes
   - Zero backend changes
   - Works immediately

### Hybrid Approach (Best of Both):

1. Use **Google Docs Viewer** for immediate display
2. Convert to PDF in background (Solution 1)
3. Once PDF ready, prefer PDF viewer
4. Keep Google viewer as fallback

---

## Implementation Priority

### Phase 1: Immediate (Today)

- ✅ Implement Google Docs Viewer for DOCX/PPTX
- ✅ Keep existing DOCXPresentation as fallback
- ✅ Add file type detection for PPTX

### Phase 2: Backend (This Week)

- ✅ Add LibreOffice to backend
- ✅ Implement PDF conversion on upload
- ✅ Add pdf_url to database
- ✅ Update frontend to prefer PDF version

### Phase 3: Polish (Next Week)

- ✅ Add conversion status indicator
- ✅ Retry failed conversions
- ✅ Add download original file option
- ✅ Optimize conversion performance

---

## Quick Test: Google Docs Viewer (5 Minutes)

Want to test immediately? I can implement the Google Docs Viewer right now!

**Pros:**

- Works in 5 minutes
- No backend changes
- Supports DOCX, PPTX, XLS
- Reliable (Google infrastructure)

**Cons:**

- Requires public file URLs (your R2 files already are)
- External dependency
- Less customization

Would you like me to:

1. ✅ Implement Google Docs Viewer now (fastest fix)
2. ✅ Set up backend PDF conversion (best long-term)
3. ✅ Both (Google now, PDF conversion later)

Let me know which solution you prefer!
