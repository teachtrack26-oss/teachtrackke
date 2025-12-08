import pdfplumber
import os

curriculum_folder = r"c:\Users\MKT\desktop\teachtrack\curiculum"
pdf_files = [f for f in os.listdir(curriculum_folder) if f.endswith('.pdf')]

print(f"Found {len(pdf_files)} curriculum PDFs")
print("=" * 80)

for pdf_file in pdf_files:
    pdf_path = os.path.join(curriculum_folder, pdf_file)
    print(f"\n\n{'='*80}")
    print(f"FILE: {pdf_file}")
    print(f"{'='*80}\n")
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"Total pages: {len(pdf.pages)}")
            print(f"\n--- First 3 pages content ---\n")
            
            # Extract text from first 3 pages to understand structure
            for i in range(min(3, len(pdf.pages))):
                page = pdf.pages[i]
                text = page.extract_text()
                print(f"\n{'*'*40}")
                print(f"PAGE {i+1}")
                print(f"{'*'*40}\n")
                
                # Print first 2000 characters of each page
                if text:
                    print(text[:2000])
                    if len(text) > 2000:
                        print("\n... (truncated)")
                else:
                    print("(No text extracted)")
                    
    except Exception as e:
        print(f"Error reading {pdf_file}: {e}")

print(f"\n\n{'='*80}")
print("Analysis complete!")
