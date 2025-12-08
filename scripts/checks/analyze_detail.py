import pdfplumber
import re

# Analyze one curriculum in detail
pdf_path = r"c:\Users\MKT\desktop\teachtrack\curiculum\Grade-9-English.pdf"

print(f"{'='*80}")
print(f"DETAILED ANALYSIS: Grade 9 English")
print(f"{'='*80}\n")

with pdfplumber.open(pdf_path) as pdf:
    print(f"Total pages: {len(pdf.pages)}\n")
    
    # Extract first 10 pages to find structure
    for i in range(min(10, len(pdf.pages))):
        page = pdf.pages[i]
        text = page.extract_text()
        
        if text:
            # Look for strands/sub-strands patterns
            if "STRAND" in text.upper() or "TABLE OF CONTENTS" in text.upper():
                print(f"\n{'='*80}")
                print(f"PAGE {i+1} (Contains Structure Info)")
                print(f"{'='*80}\n")
                print(text[:3000])
                print("\n... (showing key structural info)\n")
