"""
AI-Powered CBC Curriculum Parser
Uses OpenRouter LLMs for intelligent curriculum extraction
"""

import os
import json
import base64
import time
from typing import Dict, List, Optional
from pathlib import Path

import pymupdf  # PyMuPDF for PDF reading
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


class EnhancedCurriculumParser:
    """
    AI-powered parser for CBC curriculum documents
    Uses OpenRouter with multiple free models for robust extraction
    """

    # Free models in priority order (best to fallback)
    # Using text-only models as vision models are mostly unavailable
    FREE_MODELS = [
        "meta-llama/llama-3.3-70b-instruct:free",     # Llama 3.3 (proven working)
        "google/gemini-2.0-flash-exp:free",           # Fast general model
        "qwen/qwen-2.5-72b-instruct:free"             # Qwen 2.5
    ]

    def __init__(self, debug: bool = True):
        """
        Initialize parser
        
        Args:
            debug: Enable detailed logging
        """
        self.debug = debug
        
        # Get API key
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError(
                "OPENROUTER_API_KEY not found in environment variables. "
                "Get your free key at https://openrouter.ai/keys"
            )
        
        # Log API key status (first/last 4 chars only for security)
        if self.debug and len(self.api_key) > 8:
            key_preview = f"{self.api_key[:4]}...{self.api_key[-4:]}"
            self.log(f"API key loaded: {key_preview}", "DEBUG")
        
        # Initialize OpenRouter client
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=self.api_key,
        )
        
        # Default model
        self.default_model = os.getenv("OPENROUTER_MODEL", self.FREE_MODELS[0])
        
        self.log(f"Parser initialized with OpenRouter", "SUCCESS")
        self.log(f"Default model: {self.default_model}", "INFO")

    def log(self, message: str, level: str = "INFO"):
        """Enhanced logging without emojis for Windows compatibility"""
        if self.debug:
            prefixes = {
                "INFO": "[INFO]",
                "SUCCESS": "[SUCCESS]",
                "WARNING": "[WARNING]",
                "ERROR": "[ERROR]",
                "DEBUG": "[DEBUG]"
            }
            print(f"{prefixes.get(level, '[INFO]')} {message}")

    def parse_pdf(self, file_path: str, grade: str, learning_area: str) -> Dict:
        """
        Parse PDF curriculum using AI
        
        Args:
            file_path: Path to PDF file
            grade: Grade level (e.g., "Grade 8")
            learning_area: Subject name (e.g., "Mathematics")
            
        Returns:
            Dictionary with curriculum structure
        """
        start_time = time.time()
        filename = Path(file_path).name
        
        self.log(f"Parsing: {filename}", "INFO")
        self.log(f"Subject: {learning_area}, Grade: {grade}", "INFO")
        
        # Initialize result structure
        curriculum_data = {
            "learningArea": learning_area,
            "grade": grade,
            "educationLevel": self._determine_education_level(grade),
            "totalPages": 0,
            "strands": [],
            "metadata": {},
            "parseWarnings": [],
            "extractionMethod": "ai",
            "modelUsed": "unknown",
            "processingTime": 0
        }

        try:
            # Step 1: Extract PDF content
            self.log("Extracting PDF content...", "INFO")
            content = self._extract_pdf_content(file_path)
            curriculum_data["totalPages"] = content["total_pages"]
            curriculum_data["metadata"] = content.get("metadata", {})

            # Step 2: AI Extraction - Try text first, even if minimal
            # For corrupted PDFs, use filename + metadata as hints
            context_text = f"Grade {grade} {learning_area} curriculum document\n"
            context_text += f"Filename: {os.path.basename(file_path)}\n"
            if content["text"]:
                context_text += content["text"]
            
            if len(context_text) > 100:  # At least some context
                self.log(f"Using AI with {len(context_text)} characters of context", "INFO")
                strands, model_used = self._extract_with_text(
                    context_text, 
                    grade, 
                    learning_area
                )
                curriculum_data["extractionMethod"] = "ai_text"
                
                if content["text"] == "":
                    curriculum_data["parseWarnings"].append(
                        "PDF text corrupted - used filename/metadata for context"
                    )
            else:
                # Last resort: Ask AI to generate standard CBC structure
                self.log("Generating standard CBC structure from grade/subject", "WARNING")
                strands, model_used = self._generate_standard_structure(
                    grade, 
                    learning_area
                )
                curriculum_data["extractionMethod"] = "ai_generated"
                curriculum_data["parseWarnings"].append(
                    "PDF unreadable - generated standard CBC structure"
                )

            curriculum_data["modelUsed"] = model_used

            # Step 3: Validate results
            if not strands or len(strands) == 0:
                self.log("No strands extracted, using fallback structure", "WARNING")
                strands = self._create_default_strand()
                curriculum_data["parseWarnings"].append(
                    "AI could not extract curriculum structure - using default"
                )
                curriculum_data["extractionMethod"] = "fallback"

            curriculum_data["strands"] = strands

            # Calculate processing time
            processing_time = time.time() - start_time
            curriculum_data["processingTime"] = round(processing_time, 2)

            # Success summary
            total_lessons = self.count_total_lessons(curriculum_data)
            self.log(
                f"Extracted {len(strands)} strands, {total_lessons} lessons "
                f"in {processing_time:.2f}s using {model_used}",
                "SUCCESS"
            )

        except Exception as e:
            # Error handling
            processing_time = time.time() - start_time
            error_msg = f"Parsing error: {type(e).__name__}: {e}"
            
            self.log(error_msg, "ERROR")
            
            curriculum_data["strands"] = self._create_default_strand()
            curriculum_data["parseWarnings"].append(error_msg)
            curriculum_data["extractionMethod"] = "error_fallback"
            curriculum_data["processingTime"] = round(processing_time, 2)

        return curriculum_data

    def parse_docx(self, file_path: str, grade: str, learning_area: str) -> Dict:
        """
        Parse DOCX curriculum using AI
        
        Note: For DOCX, we extract text then use AI text extraction
        """
        start_time = time.time()
        filename = Path(file_path).name
        
        self.log(f"Parsing DOCX: {filename}", "INFO")
        
        curriculum_data = {
            "learningArea": learning_area,
            "grade": grade,
            "educationLevel": self._determine_education_level(grade),
            "totalPages": 0,
            "strands": [],
            "metadata": {},
            "parseWarnings": [],
            "extractionMethod": "ai_text",
            "modelUsed": "unknown",
            "processingTime": 0
        }

        try:
            from docx import Document
            
            # Extract text from DOCX
            doc = Document(file_path)
            full_text = " ".join([
                para.text for para in doc.paragraphs 
                if para.text.strip()
            ])

            if not full_text.strip():
                raise ValueError("No text extracted from DOCX")

            self.log(f"Extracted {len(full_text)} characters from DOCX", "DEBUG")

            # Use AI text extraction
            self.log("Using AI text-based extraction", "INFO")
            strands, model_used = self._extract_with_text(
                full_text, 
                grade, 
                learning_area
            )
            curriculum_data["modelUsed"] = model_used

            if not strands:
                strands = self._create_default_strand()
                curriculum_data["parseWarnings"].append(
                    "AI could not extract curriculum structure - using default"
                )

            curriculum_data["strands"] = strands
            processing_time = time.time() - start_time
            curriculum_data["processingTime"] = round(processing_time, 2)

            self.log(
                f"Extracted {len(strands)} strands in {processing_time:.2f}s",
                "SUCCESS"
            )

        except ImportError:
            curriculum_data["parseWarnings"].append(
                "python-docx not installed. Install with: pip install python-docx"
            )
            curriculum_data["strands"] = self._create_default_strand()
        except Exception as e:
            error_msg = f"DOCX parsing error: {e}"
            self.log(error_msg, "ERROR")
            curriculum_data["parseWarnings"].append(error_msg)
            curriculum_data["strands"] = self._create_default_strand()

        return curriculum_data

    def _extract_pdf_content(self, file_path: str) -> Dict:
        """
        Extract text and images from PDF using PyMuPDF
        
        Returns:
            Dict with text, images, and metadata
        """
        content = {
            "text": "",
            "images": [],
            "has_text": False,
            "has_images": False,
            "metadata": {},
            "total_pages": 0
        }

        try:
            doc = pymupdf.open(file_path)
            content["total_pages"] = len(doc)
            
            self.log(f"PDF has {len(doc)} pages", "INFO")

            # Extract text from all pages
            full_text = []
            for page in doc:
                text = page.get_text()
                if text and len(text.strip()) > 50:
                    full_text.append(text)

            content["text"] = "\n\n".join(full_text)
            content["has_text"] = len(content["text"].strip()) > 200

            self.log(f"Extracted {len(content['text'])} characters of text", "DEBUG")

            # If minimal text, extract as images (scanned PDF)
            if not content["has_text"]:
                self.log("Little text found, extracting pages as images", "WARNING")
                
                # Extract up to 8 pages as images
                for page_num in range(min(8, len(doc))):
                    try:
                        page = doc[page_num]
                        pix = page.get_pixmap(dpi=150)
                        img_bytes = pix.tobytes("png")
                        content["images"].append(img_bytes)
                    except Exception as e:
                        self.log(f"Failed to render page {page_num}: {e}", "WARNING")
                        continue
                
                content["has_images"] = len(content["images"]) > 0
                self.log(f"Extracted {len(content['images'])} images", "INFO")

            # Extract metadata
            metadata = doc.metadata
            if metadata:
                content["metadata"] = {
                    "title": metadata.get("title", ""),
                    "author": metadata.get("author", ""),
                    "subject": metadata.get("subject", ""),
                    "pages": len(doc)
                }

            doc.close()
            return content

        except Exception as e:
            self.log(f"PDF content extraction failed: {e}", "ERROR")
            return content

    def _extract_with_text(
        self, 
        text: str, 
        grade: str, 
        learning_area: str
    ) -> tuple[List[Dict], str]:
        """
        Extract curriculum using AI text analysis
        Tries multiple models until successful
        
        Returns:
            (strands_list, model_name)
        """
        # Truncate if too long
        max_chars = 25000
        if len(text) > max_chars:
            self.log(f"Text too long ({len(text)} chars), truncating to {max_chars}", "WARNING")
            text = text[:max_chars]

        # Try models in order
        for model in self.FREE_MODELS:
            try:
                self.log(f"Trying model: {model}", "DEBUG")
                
                strands = self._call_ai_text(text, grade, learning_area, model)
                
                if strands and len(strands) > 0:
                    self.log(f"Model {model} succeeded with {len(strands)} strands", "SUCCESS")
                    return strands, model
                else:
                    self.log(f"Model {model} returned empty result", "WARNING")
                    
            except Exception as e:
                self.log(f"Model {model} failed: {type(e).__name__}: {str(e)[:200]}", "WARNING")
                continue
        
        self.log("All models failed", "ERROR")
        return [], "none"

    def _generate_standard_structure(
        self, 
        grade: str, 
        learning_area: str
    ) -> tuple[List[Dict], str]:
        """
        Generate a standard CBC structure when PDF is unreadable
        Asks AI to create typical strands for the grade/subject
        """
        prompt = f"""Generate a realistic Kenya CBC curriculum structure for:
Grade: {grade}
Learning Area: {learning_area}

Create 3-5 typical strands with realistic sub-strands and learning outcomes.
Use standard CBC naming conventions.

Return ONLY valid JSON with this EXACT structure (wrapped in {{"strands": [...]}}):

{{
  "strands": [
    {{
      "strandNumber": "1.0",
      "strandName": "Numbers",
      "theme": null,
      "subStrands": [
        {{
          "subStrandNumber": "1.1",
          "subStrandName": "Whole Numbers",
          "numberOfLessons": 8,
          "specificLearningOutcomes": [
            "Count numbers up to 1000",
            "Compare and order whole numbers"
          ],
          "suggestedLearningExperiences": [],
          "keyInquiryQuestions": [],
          "coreCompetencies": [],
          "values": [],
          "pertinentAndContemporaryIssues": [],
          "linkToOtherSubjects": []
        }}
      ]
    }}
  ]
}}

Generate appropriate strands for {grade} {learning_area} based on CBC guidelines."""

        # Try models
        for model in self.FREE_MODELS:
            try:
                self.log(f"Generating structure with {model}", "DEBUG")
                
                # Direct API call for generation (different from extraction)
                response = self.client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=3000,
                )
                
                result_text = response.choices[0].message.content
                strands = self._parse_ai_response(result_text)
                
                if strands and len(strands) > 0:
                    self.log(f"Generated {len(strands)} strands with {model}", "SUCCESS")
                    return strands, model
                    
            except Exception as e:
                self.log(f"Generation failed with {model}: {str(e)[:100]}", "WARNING")
                continue
        
        return [], "none"

    def _extract_with_vision(
        self, 
        images: List[bytes], 
        grade: str, 
        learning_area: str
    ) -> tuple[List[Dict], str]:
        """
        Extract curriculum using AI vision analysis
        For scanned PDFs
        
        Returns:
            (strands_list, model_name)
        """
        if not images:
            self.log("No images to process", "ERROR")
            return [], "none"

        # Try models in order
        for model in self.FREE_MODELS:
            try:
                self.log(f"Trying vision model: {model}", "DEBUG")
                
                strands = self._call_ai_vision(images, grade, learning_area, model)
                
                if strands and len(strands) > 0:
                    self.log(f"Model {model} succeeded with {len(strands)} strands", "SUCCESS")
                    return strands, model
                else:
                    self.log(f"Model {model} returned empty result", "WARNING")
                    
            except Exception as e:
                self.log(f"Model {model} failed: {type(e).__name__}: {str(e)[:200]}", "WARNING")
                continue
        
        self.log("All vision models failed", "ERROR")
        return [], "none"

    def _call_ai_text(
        self, 
        text: str, 
        grade: str, 
        learning_area: str, 
        model: str
    ) -> List[Dict]:
        """Call OpenRouter API with text"""
        
        prompt = self._build_extraction_prompt(grade, learning_area)
        
        response = self.client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": f"{prompt}\n\nCURRICULUM DOCUMENT TEXT:\n\n{text}"
                }
            ],
            temperature=0.1,
            max_tokens=4000,
        )

        result_text = response.choices[0].message.content
        return self._parse_ai_response(result_text)

    def _call_ai_vision(
        self, 
        images: List[bytes], 
        grade: str, 
        learning_area: str, 
        model: str
    ) -> List[Dict]:
        """Call OpenRouter API with vision (images)"""
        
        prompt = self._build_extraction_prompt(grade, learning_area)
        
        # Prepare content with images
        content = [{"type": "text", "text": prompt}]
        
        # Add up to 6 images
        for img_bytes in images[:6]:
            img_base64 = base64.b64encode(img_bytes).decode('utf-8')
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/png;base64,{img_base64}"
                }
            })

        response = self.client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": content}],
            temperature=0.1,
            max_tokens=4000,
        )

        result_text = response.choices[0].message.content
        return self._parse_ai_response(result_text)

    def _build_extraction_prompt(self, grade: str, learning_area: str) -> str:
        """Build the AI extraction prompt"""
        return f"""You are extracting curriculum data from a Kenya CBC {learning_area} document for {grade}.

**CRITICAL**: Return ONLY valid JSON. No markdown code blocks, no explanations, no extra text.

Extract this EXACT structure:

{{
  "strands": [
    {{
      "strandNumber": "1.0",
      "strandName": "STRAND NAME",
      "theme": null,
      "subStrands": [
        {{
          "subStrandNumber": "1.1",
          "subStrandName": "Sub-strand name",
          "numberOfLessons": 10,
          "specificLearningOutcomes": ["outcome 1", "outcome 2"],
          "suggestedLearningExperiences": ["experience 1", "experience 2"],
          "keyInquiryQuestions": ["question 1?", "question 2?"],
          "coreCompetencies": ["competency 1"],
          "values": ["value 1"],
          "pertinentAndContemporaryIssues": ["issue 1"],
          "linkToOtherSubjects": ["subject 1"]
        }}
      ]
    }}
  ]
}}

**Extraction Guidelines**:

1. **Strands**: Look for "STRAND 1.0:", "STRAND 1:", or numbered headings like "1.0 NUMBERS"
2. **Sub-strands**: Format is usually "1.1 Topic Name (X lessons)" - extract the number X
3. **Learning Outcomes**: Listed as a), b), c) or bullet points under "By the end of sub-strand, learner should be able to:"
4. **Learning Experiences**: Under "Learners are guided to:" or "Suggested learning experiences"
5. **Inquiry Questions**: Look for questions with "?" - usually under "Key inquiry questions"
6. **Competencies**: Under "Core competencies to be developed"
7. **Values**: Under "Values"
8. **PCIs**: Under "Pertinent and Contemporary Issues"
9. **Links**: Under "Link to other subjects" or "Link to other learning areas"

**IMPORTANT**:
- Extract ALL strands and sub-strands you find
- If a field has no data, use empty array []
- Keep exact lesson counts from "(X lessons)"
- Preserve original wording for outcomes and experiences
- Return ONLY the JSON object, no ```json``` wrapper

If you cannot find clear curriculum structure, return: {{"strands": []}}"""

    def _parse_ai_response(self, response_text: str) -> List[Dict]:
        """Parse AI JSON response into strand list"""
        
        if not response_text:
            return []

        # Clean markdown code blocks if present
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.replace("```json", "").replace("```", "").strip()

        # Parse JSON
        try:
            result = json.loads(cleaned)
            
            if isinstance(result, dict) and "strands" in result:
                strands = result["strands"]
                if strands and len(strands) > 0:
                    return strands
            
            return []
            
        except json.JSONDecodeError as e:
            self.log(f"JSON parsing error: {e}", "ERROR")
            self.log(f"Response preview: {cleaned[:200]}...", "DEBUG")
            return []

    def _determine_education_level(self, grade: str) -> str:
        """Determine CBC education level from grade"""
        grade_upper = grade.upper()
        
        if "PP1" in grade_upper or "PP2" in grade_upper:
            return "Pre-Primary"
        elif any(g in grade_upper for g in ["GRADE 1", "GRADE 2", "GRADE 3"]):
            return "Lower Primary"
        elif any(g in grade_upper for g in ["GRADE 4", "GRADE 5", "GRADE 6"]):
            return "Upper Primary"
        elif any(g in grade_upper for g in ["GRADE 7", "GRADE 8", "GRADE 9"]):
            return "Junior Secondary"
        elif any(g in grade_upper for g in ["GRADE 10", "GRADE 11", "GRADE 12"]):
            return "Senior Secondary"
        
        return "Unknown"

    def _create_default_strand(self) -> List[Dict]:
        """Create default fallback structure"""
        return [{
            "strandNumber": "1.0",
            "strandName": "Main Content",
            "theme": None,
            "subStrands": [{
                "subStrandNumber": "1.1",
                "subStrandName": "General Content",
                "numberOfLessons": 20,
                "specificLearningOutcomes": [],
                "suggestedLearningExperiences": [],
                "keyInquiryQuestions": [],
                "coreCompetencies": [],
                "values": [],
                "pertinentAndContemporaryIssues": [],
                "linkToOtherSubjects": []
            }]
        }]

    def count_total_lessons(self, curriculum_data: Dict) -> int:
        """Count total lessons across all strands"""
        total = 0
        for strand in curriculum_data.get("strands", []):
            for substrand in strand.get("subStrands", []):
                total += substrand.get("numberOfLessons", 0)
        return total


# Backward compatibility
CurriculumParser = EnhancedCurriculumParser


# ============================================================================
# TESTING UTILITIES
# ============================================================================

def test_single_curriculum(pdf_path: str, grade: str, learning_area: str):
    """Test parser with single curriculum"""
    print("="*80)
    print("CURRICULUM PARSER TEST")
    print("="*80)
    print(f"File: {pdf_path}")
    print(f"Grade: {grade}")
    print(f"Subject: {learning_area}")
    print("="*80)
    
    # Parse
    parser = EnhancedCurriculumParser(debug=True)
    result = parser.parse_pdf(pdf_path, grade, learning_area)
    
    # Display results
    print("\n" + "="*80)
    print("RESULTS")
    print("="*80)
    print(f"Total Pages: {result['totalPages']}")
    print(f"Strands Found: {len(result['strands'])}")
    print(f"Total Lessons: {parser.count_total_lessons(result)}")
    print(f"Extraction Method: {result['extractionMethod']}")
    print(f"Model Used: {result['modelUsed']}")
    print(f"Processing Time: {result['processingTime']}s")
    
    if result['parseWarnings']:
        print(f"\nWarnings ({len(result['parseWarnings'])}):")
        for warning in result['parseWarnings']:
            print(f"  - {warning}")
    
    print("\n📊 Strands Structure:")
    for strand in result['strands']:
        print(f"\n  {strand['strandNumber']} - {strand['strandName']}")
        for substrand in strand['subStrands']:
            outcomes_count = len(substrand.get('specificLearningOutcomes', []))
            print(f"    └─ {substrand['subStrandNumber']} {substrand['subStrandName']} "
                  f"({substrand['numberOfLessons']} lessons, {outcomes_count} outcomes)")
    
    # Save to JSON
    output_file = f"curriculum_output_{int(time.time())}.json"
    with open(output_file, "w") as f:
        json.dump(result, f, indent=2)
    
    print(f"\n💾 Full output saved to: {output_file}")
    return result


def test_batch_curricula(curricula_list: List[Dict]):
    """Test parser with multiple curricula"""
    print("="*80)
    print(f"BATCH CURRICULUM PARSING TEST ({len(curricula_list)} files)")
    print("="*80)
    
    parser = EnhancedCurriculumParser(debug=True)
    results = []
    
    for i, curr in enumerate(curricula_list, 1):
        print(f"\n{'='*80}")
        print(f"CURRICULUM {i}/{len(curricula_list)}")
        print(f"{'='*80}")
        
        result = parser.parse_pdf(
            curr['path'],
            curr['grade'],
            curr['learningArea']
        )
        results.append(result)
        
        # Summary
        print(f"\n📊 Summary:")
        print(f"  Strands: {len(result['strands'])}")
        print(f"  Lessons: {parser.count_total_lessons(result)}")
        print(f"  Model: {result['modelUsed']}")
        print(f"  Time: {result['processingTime']}s")
    
    # Overall summary
    print(f"\n{'='*80}")
    print("BATCH SUMMARY")
    print(f"{'='*80}")
    successful = sum(1 for r in results if len(r['strands']) > 0 and r['strands'][0]['strandNumber'] != '1.0')
    print(f"Total processed: {len(results)}")
    print(f"Successful extractions: {successful}/{len(results)}")
    print(f"Average time: {sum(r['processingTime'] for r in results)/len(results):.2f}s")
    
    # Save batch results
    batch_output = f"batch_results_{int(time.time())}.json"
    with open(batch_output, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Batch results saved to: {batch_output}")
    return results


# ============================================================================
# USAGE EXAMPLES
# ============================================================================

if __name__ == "__main__":
    # Example 1: Single curriculum
    test_single_curriculum(
        pdf_path="uploads/Grade_8_PreTechnical.pdf",
        grade="Grade 8",
        learning_area="Pre-Technical and Pre-Career Education"
    )
    
    # Example 2: Batch test
    # test_batch_curricula([
    #     {
    #         "path": "uploads/Grade_8_Mathematics.pdf",
    #         "grade": "Grade 8",
    #         "learningArea": "Mathematics"
    #     },
    #     {
    #         "path": "uploads/Grade_7_Science.pdf",
    #         "grade": "Grade 7",
    #         "learningArea": "Science"
    #     }
    # ])