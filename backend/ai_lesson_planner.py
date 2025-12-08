"""
AI-Powered Lesson Plan Generator
Uses OpenRouter LLMs to expand brief curriculum points into detailed lesson plans
"""

import os
import json
import time
from typing import Dict, Optional
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class AILessonPlanner:
    """
    AI-powered generator for detailed lesson plans
    """

    # Free models in priority order
    FREE_MODELS = [
        "google/gemini-2.0-flash-exp:free",           # Fast general model
        "meta-llama/llama-3.3-70b-instruct:free",     # Llama 3.3
        "qwen/qwen-2.5-72b-instruct:free"             # Qwen 2.5
    ]

    def __init__(self, debug: bool = True):
        self.debug = debug
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        
        if not self.api_key:
            print("[WARNING] OPENROUTER_API_KEY not found. AI features will be disabled.")
            self.client = None
        else:
            self.client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=self.api_key,
            )

    def generate_detailed_plan(self, lesson_data: Dict) -> Dict:
        """
        Generate detailed lesson plan sections from brief data
        """
        if not self.client:
            return {"error": "AI service not configured"}

        prompt = self._build_lesson_prompt(lesson_data)
        
        # Try models in order
        for model in self.FREE_MODELS:
            try:
                response = self.client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7, # Slightly creative
                    max_tokens=2000,
                )
                
                result_text = response.choices[0].message.content
                parsed_result = self._parse_ai_response(result_text)
                
                if parsed_result:
                    return parsed_result
                    
            except Exception as e:
                print(f"[ERROR] Model {model} failed: {e}")
                continue
                
        return {"error": "Failed to generate lesson plan"}

    def _build_lesson_prompt(self, data: Dict) -> str:
        return f"""You are an expert Kenyan CBC teacher. Create a detailed "Organization of Learning" for a lesson plan.

**Lesson Details**:
- Grade: {data.get('grade')}
- Subject: {data.get('learning_area')}
- Strand: {data.get('strand')}
- Sub-strand: {data.get('sub_strand')}
- Learning Outcomes: {data.get('outcomes')}
- Core Competencies: {data.get('competencies')}
- Values: {data.get('values')}

**Task**:
Expand the brief "Learning Experiences" into a detailed step-by-step lesson flow.
Current Brief Experience: "{data.get('learning_experiences')}"

**Required Output Format (JSON)**:
Return ONLY a valid JSON object with these exact keys:
{{
  "introduction": "Detailed introduction (5 mins)...",
  "development": "Step 1: ...\\nStep 2: ...\\nStep 3: ...",
  "conclusion": "Detailed conclusion (5 mins)...",
  "summary": "Brief summary of the lesson...",
  "reflection_prompt": "A specific question for self-evaluation..."
}}

**Content Guidelines**:
1. **Introduction (5 mins)**: Include a recap of previous knowledge and introduction of new concepts.
2. **Development (30-35 mins)**: Break down into 3-4 clear steps. Use "Step 1:", "Step 2:" format. Include learner activities (e.g., "In pairs...", "Groups discuss...").
3. **Conclusion (5 mins)**: Summarize key points and include a quick assessment activity.
4. **Tone**: Professional, instructional, and learner-centered (CBC style).
5. **Length**: Detailed enough for a teacher to follow in class.

**Example Style**:
"Introduction (5 minutes)
- Recap the previous lesson on..."

"Lesson Development (30 minutes)
Step 1: Explaining the Meaning...
- In pairs, students discuss..."

Return ONLY the JSON.
"""

    def _parse_ai_response(self, response_text: str) -> Optional[Dict]:
        if not response_text:
            return None

        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.replace("```json", "").replace("```", "").strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            print(f"[ERROR] Failed to parse JSON: {cleaned[:100]}...")
            return None

async def generate_scheme_of_work(data, current_user, db):
    """
    Generate a scheme of work using AI.
    """
    # Placeholder implementation
    # In a real implementation, this would query the LLM to generate the scheme
    # based on the curriculum and user inputs.
    
    # Import models here to avoid circular imports if any
    from models import SchemeOfWork
    
    # Create a basic shell
    scheme = SchemeOfWork(
        user_id=current_user.id,
        subject_id=data.subject_id,
        teacher_name=current_user.full_name,
        school=current_user.school.name if current_user.school else "My School",
        term=data.term,
        year=data.year,
        subject=data.subject,
        grade=data.grade,
        total_weeks=data.total_weeks,
        total_lessons=data.total_lessons,
        status="draft"
    )
    db.add(scheme)
    db.commit()
    db.refresh(scheme)
    
    return scheme

async def generate_lesson_plan(plan):
    """
    Generate or enhance a lesson plan using AI.
    """
    planner = AILessonPlanner()
    
    # Convert plan model to dict for the planner
    lesson_data = {
        "topic": plan.topic,
        "sub_topic": plan.sub_topic,
        "grade": getattr(plan, 'grade', "Unknown"),
        "subject": getattr(plan, 'subject', "Unknown"),
        "objectives": plan.objectives,
        "duration": "40 minutes" # Default
    }
    
    # Note: generate_detailed_plan is synchronous in the class currently
    # We might need to run it in executor if it blocks (it calls OpenAI sync client)
    # But for now let's just call it.
    
    result = planner.generate_detailed_plan(lesson_data)
    
    if result and "error" not in result:
        # Update plan with generated content
        # Mapping result fields to plan fields
        if "introduction" in result:
            plan.introduction = result["introduction"]
        if "development" in result:
            plan.learning_activities = str(result["development"])
        if "conclusion" in result:
            plan.conclusion = result["conclusion"]
        if "resources" in result:
            plan.resources = str(result["resources"])
            
    return plan
