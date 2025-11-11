# AI-Powered Curriculum Parsing Setup

## ✅ What's Been Added

Your curriculum parser now has **AI vision capabilities** to extract curriculum structure from scanned/image-based PDFs using OpenRouter's **FREE** AI models!

## 🚀 Quick Setup (2 minutes)

### Step 1: Get Your Free API Key

1. Go to: **https://openrouter.ai/keys**
2. Sign in with Google/GitHub
3. Click **"Create Key"**
4. Copy the API key (starts with `sk-or-...`)

### Step 2: Add API Key to Your Project

Open `backend/.env` and paste your API key:

```env
# OpenRouter AI for intelligent curriculum parsing (FREE)
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
```

### Step 3: Install Dependencies

```bash
pip install -r backend/requirements.txt
```

### Step 4: Restart Your Server

```bash
npm run dev:all
```

## ✨ How It Works

The parser now uses a **4-tier fallback system**:

1. **pdfplumber** (fast text extraction) ✓
2. **PyPDF2** (alternative text extraction) ✓
3. **OCR** (Tesseract - optional, for scanned PDFs) ✓
4. **🆕 AI Vision** (OpenRouter - analyzes PDF images with AI) ✓
5. Default structure (only if all methods fail)

## 🎯 What AI Does

When your PDF is scanned or unreadable:

- Converts PDF pages to images
- Sends to **Gemini 2.0 Flash (FREE model)**
- AI reads and extracts:
  - Strands (e.g., "STRAND 1.0 CONSERVATION")
  - Sub-strands (e.g., "1.1 Kitchen gardening (9 lessons)")
  - Learning outcomes
  - Key inquiry questions
  - Competencies and values
- Returns structured JSON matching your database schema

## 💰 Cost

**100% FREE!**

- Using `google/gemini-2.0-flash-exp:free`
- No credit card required
- Reasonable rate limits for normal use

If you hit limits (unlikely):

- Gemini Flash paid: $0.075/1M tokens (~$0.01 per 20-page PDF)
- Or switch to: `meta-llama/llama-3.2-11b-vision-instruct:free` (also free)

## 🧪 Test It

1. Add your API key to `.env`
2. Restart server: `npm run dev:all`
3. Upload a scanned PDF
4. Watch the logs - you should see: `"AI extracted X strands successfully"`
5. Check the subject detail page - real curriculum structure instead of defaults!

## 🔧 Configuration Options

You can change models in `backend/.env`:

```env
# Fast and free (recommended)
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free

# Alternative free model
OPENROUTER_MODEL=meta-llama/llama-3.2-11b-vision-instruct:free

# Paid but more accurate (if needed)
OPENROUTER_MODEL=openai/gpt-4o-mini
```

## 📊 What You'll See

**Before AI (scanned PDFs):**

- ⚠️ "Default Structure Applied"
- Generic "1.0 Main Content" with 20 lessons

**After AI (same PDFs):**

- ✅ Real strands: "1.0 CONSERVATION OF RESOURCES"
- ✅ Real sub-strands: "1.1 Kitchen gardening (9 lessons)"
- ✅ Actual learning outcomes and questions
- ✅ Accurate lesson counts

## 🐛 Troubleshooting

**If AI extraction doesn't work:**

1. Check API key is set: `echo $OPENROUTER_API_KEY` (bash) or check `.env`
2. Check logs for: `"Warning: OPENROUTER_API_KEY not set"`
3. Verify internet connection
4. Check OpenRouter status: https://status.openrouter.ai/

**If you see "pdf2image not installed":**

```bash
pip install pdf2image Pillow
```

## 🎓 Need Help?

- OpenRouter Docs: https://openrouter.ai/docs
- Model List: https://openrouter.ai/models
- Discord Support: https://discord.gg/fVyRaUDgxW

---

**That's it!** Your curriculum parser is now AI-powered and can handle any PDF format! 🎉
