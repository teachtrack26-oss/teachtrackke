import fitz  # PyMuPDF

pdf_path = r"c:\Users\MKT\desktop\teachtrack\8 Must-Know Strategies to Build Scalable Systems.pdf"
doc = fitz.open(pdf_path)

full_text = ""
for page_num in range(len(doc)):
    page = doc[page_num]
    full_text += f"\n--- Page {page_num + 1} ---\n"
    full_text += page.get_text()

print(full_text)
doc.close()
