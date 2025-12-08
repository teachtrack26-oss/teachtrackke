#!/usr/bin/env python3
"""
Simple PDF text extractor for manual curriculum structuring
Usage: python extract_text_only.py curiculum/Grade-9-Mathematics.pdf
"""

import pdfplumber
import sys
import os
from pathlib import Path

def extract_text_from_pdf(pdf_path):
    """Extract all text from PDF"""
    print(f"Extracting text from: {pdf_path}")
    
    full_text = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)
            print(f"Total pages: {total_pages}")
            
            for i, page in enumerate(pdf.pages, 1):
                text = page.extract_text()
                if text:
                    full_text.append(f"========== PAGE {i} ==========\n{text}")
                    
                    if i % 10 == 0:
                        print(f"Processed {i}/{total_pages} pages...")
            
            print(f"Extracted text from all {total_pages} pages")
            return "\n\n".join(full_text)
            
    except Exception as e:
        print(f"ERROR: {e}")
        return None


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_text_only.py <pdf_file>")
        print("Example: python extract_text_only.py curiculum/Grade-9-Mathematics.pdf")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        sys.exit(1)
    
    # Extract text
    text = extract_text_from_pdf(pdf_path)
    
    if text:
        # Save to .txt file
        output_file = pdf_path.replace('.pdf', '_extracted.txt')
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(text)
        
        print(f"\nSaved to: {output_file}")
        print(f"Total characters: {len(text)}")
        print("\nYou can now manually create JSON structure from this text")
        print("Use EXTRACTION_PROMPT.md as a guide for the required structure")
    else:
        print("Failed to extract text")
        sys.exit(1)
