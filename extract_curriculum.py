#!/usr/bin/env python3
"""
Extract CBC Curriculum from PDF to JSON using AI
Usage: python extract_curriculum.py <pdf_file>
"""

import pdfplumber
import json
import sys
import os
import requests
from pathlib import Path

def extract_text_from_pdf(pdf_path):
    """Extract all text from PDF using pdfplumber"""
    print(f"[INFO] Extracting text from {pdf_path}...")
    
    full_text = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)
            print(f"[INFO] Found {total_pages} pages")
            
            for i, page in enumerate(pdf.pages, 1):
                text = page.extract_text()
                if text:
                    full_text.append(f"--- Page {i} ---\n{text}")
                    if i % 10 == 0:
                        print(f"[INFO] Processed {i}/{total_pages} pages...")
            
            print(f"[SUCCESS] Extracted text from all {total_pages} pages")
            return "\n\n".join(full_text)
            
    except Exception as e:
        print(f"[ERROR] Failed to extract text: {e}")
        return None


def call_ai_extraction(pdf_text, subject, grade):
    """Call Hugging Face API to extract curriculum structure"""
    
    # Read extraction prompt
    prompt_file = Path(__file__).parent / "EXTRACTION_PROMPT.md"
    if not prompt_file.exists():
        print("[ERROR] EXTRACTION_PROMPT.md not found")
        return None
    
    with open(prompt_file, 'r', encoding='utf-8') as f:
        system_prompt = f.read()
    
    # Build user message
    user_message = f"""
Subject: {subject}
Grade: {grade}

PDF Text Content:
{pdf_text[:50000]}  # First 50k chars to avoid token limits

Please extract the curriculum structure and return valid JSON.
"""
    
    print("[INFO] Calling Hugging Face AI for extraction...")
    print("[INFO] This may take 30-60 seconds...")
    
    # Use Hugging Face Inference API (free tier)
    API_URL = "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct"
    
    # Get HF token from environment
    hf_token = os.getenv("HUGGINGFACE_TOKEN")
    if not hf_token:
        print("[WARNING] HUGGINGFACE_TOKEN not set in environment")
        print("[INFO] Visit https://huggingface.co/settings/tokens to get your token")
        print("[INFO] Then: export HUGGINGFACE_TOKEN=your_token")
        return None
    
    headers = {"Authorization": f"Bearer {hf_token}"}
    
    payload = {
        "inputs": f"{system_prompt}\n\nUser: {user_message}\n\nAssistant:",
        "parameters": {
            "max_new_tokens": 8000,
            "temperature": 0.1,
            "return_full_text": False
        }
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=120)
        
        if response.status_code == 200:
            result = response.json()
            
            if isinstance(result, list) and len(result) > 0:
                generated_text = result[0].get("generated_text", "")
                
                # Extract JSON from response
                json_start = generated_text.find('{')
                json_end = generated_text.rfind('}') + 1
                
                if json_start >= 0 and json_end > json_start:
                    json_str = generated_text[json_start:json_end]
                    curriculum_data = json.loads(json_str)
                    print("[SUCCESS] AI extraction completed")
                    return curriculum_data
                else:
                    print("[ERROR] No JSON found in AI response")
                    print(f"Response: {generated_text[:500]}")
                    return None
            else:
                print("[ERROR] Unexpected response format")
                print(f"Response: {result}")
                return None
                
        elif response.status_code == 503:
            print("[WARNING] Model is loading, please wait 20 seconds and try again")
            return None
        else:
            print(f"[ERROR] API error: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"[ERROR] Failed to call AI: {e}")
        return None


def save_json(data, output_file):
    """Save curriculum data to JSON file"""
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"[SUCCESS] Saved to {output_file}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to save JSON: {e}")
        return False


def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_curriculum.py <pdf_file>")
        print("Example: python extract_curriculum.py curiculum/Grade-9-Mathematics.pdf")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(f"[ERROR] File not found: {pdf_path}")
        sys.exit(1)
    
    # Extract subject and grade from filename
    filename = Path(pdf_path).stem  # e.g., "Grade-9-Mathematics"
    parts = filename.split('-')
    
    if len(parts) >= 3:
        grade = f"{parts[0]} {parts[1]}"  # "Grade 9"
        subject = '-'.join(parts[2:])  # "Mathematics"
    else:
        print("[WARNING] Could not parse subject/grade from filename")
        grade = input("Enter grade (e.g., Grade 9): ")
        subject = input("Enter subject (e.g., Mathematics): ")
    
    print(f"[INFO] Subject: {subject}")
    print(f"[INFO] Grade: {grade}")
    print()
    
    # Step 1: Extract text from PDF
    pdf_text = extract_text_from_pdf(pdf_path)
    if not pdf_text:
        print("[ERROR] Failed to extract text from PDF")
        sys.exit(1)
    
    print(f"[INFO] Extracted {len(pdf_text)} characters")
    print()
    
    # Step 2: Call AI for extraction
    curriculum_data = call_ai_extraction(pdf_text, subject, grade)
    if not curriculum_data:
        print("[ERROR] Failed to extract curriculum structure")
        print()
        print("[INFO] Alternative: You can manually structure the extracted text")
        
        # Save raw text for manual processing
        text_output = pdf_path.replace('.pdf', '_extracted.txt')
        with open(text_output, 'w', encoding='utf-8') as f:
            f.write(pdf_text)
        print(f"[INFO] Raw text saved to: {text_output}")
        print("[INFO] You can manually create JSON using EXTRACTION_PROMPT.md as guide")
        sys.exit(1)
    
    # Step 3: Add metadata
    curriculum_data['subject'] = subject
    curriculum_data['grade'] = grade
    curriculum_data['educationLevel'] = 'Junior Secondary'
    
    # Step 4: Save to JSON
    output_file = pdf_path.replace('.pdf', '.json')
    if save_json(curriculum_data, output_file):
        print()
        print(f"[SUCCESS] Curriculum extracted successfully!")
        print(f"[INFO] Next step: python import_curriculum_json.py {output_file}")
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
