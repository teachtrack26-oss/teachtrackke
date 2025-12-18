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
    Generate a scheme of work using the original logic (CurriculumTemplate based).
    """
    from fastapi import HTTPException
    from sqlalchemy import func
    from datetime import datetime, timedelta
    import re
    
    # Import models
    from models import (
        User, UserRole, SchemeOfWork, SchemeWeek, SchemeLesson, 
        CurriculumTemplate, TemplateStrand, TemplateSubstrand,
        SchoolSettings, SchoolTerm, SubscriptionType
    )

    # Enforce Free Plan Limits
    # If user is on FREE plan AND not linked to a school, limit to 1 week
    # Note: School-linked users (even if marked FREE) should get full access
    is_school_linked = current_user.school_id is not None

    if not is_school_linked:
        if current_user.subscription_type == SubscriptionType.FREE:
            print(f"[LIMIT] User {current_user.id} is on FREE plan. Limiting scheme to 1 week.")
            data.total_weeks = 1
        elif current_user.subscription_type == SubscriptionType.INDIVIDUAL_BASIC:
            print(f"[LIMIT] User {current_user.id} is on BASIC plan. Limiting scheme to 2 weeks.")
            data.total_weeks = 2
        # Optional: You could also limit lessons_per_week if needed
        # data.lessons_per_week = min(data.lessons_per_week, 5)

    # 1. Find Curriculum Template
    # Try to match by subject name and grade (case-insensitive)
    template = db.query(CurriculumTemplate).filter(
        func.lower(CurriculumTemplate.subject) == func.lower(data.subject),
        func.lower(CurriculumTemplate.grade) == func.lower(data.grade)
    ).first()

    if not template:
        # Fallback: Try to match by subject_id if provided and valid
        # But CurriculumTemplate doesn't have subject_id link usually, it's text based.
        # So we just fail if not found.
        raise HTTPException(
            status_code=404,
            detail=f"No curriculum template found for {data.subject} {data.grade}. Please ensure the curriculum exists in the system."
        )

    # 2. Create Scheme Shell
    scheme = SchemeOfWork(
        user_id=current_user.id,
        subject_id=data.subject_id,
        teacher_name=data.teacher_name,
        school=data.school,
        term=data.term,
        year=data.year,
        subject=data.subject,
        grade=data.grade,
        total_weeks=data.total_weeks,
        total_lessons=0, # Will update later
        status="active"
    )
    db.add(scheme)
    db.flush() # Get scheme.id

    # NEW: Fetch School Term Data for Mid Term Break Calculation
    term_start_date = None
    mid_term_start = None
    mid_term_end = None
    term_number = 1 # Default to Term 1

    try:
        # Extract term number from string "Term X"
        # Handle "Term 2", "Term 2 (2025)", "2"
        term_match = re.search(r'(\d+)', data.term)
        
        print(f"[DEBUG] Generating scheme for Term: {data.term}, Year: {data.year}")

        if term_match:
            term_number = int(term_match.group(1))
            print(f"[DEBUG] Extracted term number: {term_number}")

            # Try to find SchoolTerm
            # Logic:
            # 1. If user belongs to a school, try to find that school's specific terms.
            # 2. If not found or user is independent, fall back to Default Settings (ID 1).

            school_term = None

            # Attempt 1: Specific School Settings (if user has school_id)
            if current_user.school_id:
                # Assuming SchoolSettings might be linked or we use a convention.
                # For now, we'll check if there's a SchoolSettings entry with the same name as the user's school
                # This is a heuristic since the models aren't perfectly linked yet.
                if current_user.school_rel:
                     settings_match = db.query(SchoolSettings).filter(
                         SchoolSettings.school_name == current_user.school_rel.name
                     ).first()

                     if settings_match:
                         school_term = db.query(SchoolTerm).filter(
                            SchoolTerm.school_settings_id == settings_match.id,
                            SchoolTerm.year == data.year,
                            SchoolTerm.term_number == term_number
                        ).first()

            # Attempt 2: Fallback to Default/Global Settings (ID 1)
            if not school_term:
                school_term = db.query(SchoolTerm).filter(
                    SchoolTerm.school_settings_id == 1, # Default / National Dates
                    SchoolTerm.year == data.year,
                    SchoolTerm.term_number == term_number
                ).first()

            # Attempt 3: Any term matching the year/number (Legacy fallback)
            if not school_term:
                school_term = db.query(SchoolTerm).filter(
                    SchoolTerm.year == data.year,
                    SchoolTerm.term_number == term_number
                ).first()

            if school_term:
                print(f"[DEBUG] Found SchoolTerm: id={school_term.id}")
                print(f"[DEBUG] SchoolTerm start_date: {school_term.start_date}")
                print(f"[DEBUG] SchoolTerm mid_term_break_start: {school_term.mid_term_break_start}")
                print(f"[DEBUG] SchoolTerm mid_term_break_end: {school_term.mid_term_break_end}")

                if school_term.start_date:
                    try:
                        term_start_date = datetime.strptime(school_term.start_date, "%Y-%m-%d")
                        print(f"[DEBUG] Parsed term_start_date: {term_start_date}")
                    except ValueError:
                        print(f"[DEBUG] Failed to parse start_date: {school_term.start_date}")

                if school_term.mid_term_break_start and school_term.mid_term_break_end:
                    try:
                        mid_term_start = datetime.strptime(school_term.mid_term_break_start, "%Y-%m-%d")
                        mid_term_end = datetime.strptime(school_term.mid_term_break_end, "%Y-%m-%d")
                        print(f"[DEBUG] Mid Term Break: {mid_term_start} to {mid_term_end}")
                    except ValueError:
                        print(f"[DEBUG] Failed to parse mid term dates")
                else:
                    print(f"[DEBUG] No mid-term break dates found in SchoolTerm")
            else:
                print(f"[DEBUG] No SchoolTerm found for year={data.year}, term_number={term_number}")
        else:
            print(f"[DEBUG] Could not parse term number from: {data.term}")
    except Exception as e:
        print(f"[DEBUG] Error calculating mid term break: {e}")

    # 3. Flatten Curriculum into Lessons
    strands = db.query(TemplateStrand).filter(
        TemplateStrand.curriculum_template_id == template.id
    ).order_by(TemplateStrand.sequence_order, TemplateStrand.id).all()

    all_lessons_data = []

    def format_list_field(field_data):
        if not field_data:
            return ""
        if isinstance(field_data, list):
            return "\n".join([f"- {item}" for item in field_data])
        return str(field_data)

    # Smart Generators for Resources and Assessment
    def generate_smart_resources(experiences, outcomes):
        resources = ["Curriculum designs", "Textbooks"]
        text = (str(experiences) + " " + str(outcomes)).lower()
        
        if "digital" in text or "video" in text or "watch" in text or "internet" in text or "online" in text:
            resources.append("Digital devices")
            resources.append("Video clips")
        if "chart" in text or "draw" in text or "illustrate" in text or "poster" in text:
            resources.append("Charts/Manila paper")
        if "map" in text or "locate" in text:
            resources.append("Maps/Atlases")
        if "model" in text or "construct" in text or "make" in text:
            resources.append("Modeling materials")
        if "group" in text or "discuss" in text:
            resources.append("Reference materials")
        if "field" in text or "visit" in text or "walk" in text:
            resources.append("Field trip consent forms")
        if "experiment" in text or "observe" in text or "measure" in text:
            resources.append("Real objects/Realia")
        if "picture" in text or "photo" in text:
            resources.append("Pictures/Photographs")

        return ", ".join(resources)

    def generate_smart_assessment(experiences, outcomes):
        methods = ["Observation", "Oral questions"]
        text = (str(experiences) + " " + str(outcomes)).lower()

        if "write" in text or "list" in text or "explain" in text or "describe" in text:
            methods.append("Written exercise")
        if "draw" in text or "sketch" in text or "paint" in text:
            methods.append("Drawing/Portfolio")
        if "group" in text or "discuss" in text or "share" in text:
            methods.append("Group discussion")
        if "present" in text or "report" in text or "tell" in text:
            methods.append("Presentation")
        if "project" in text or "create" in text or "make" in text:
            methods.append("Project work")
        if "calculate" in text or "solve" in text or "compute" in text:
            methods.append("Computation")
        if "role" in text or "act" in text or "play" in text:
            methods.append("Role play")

        return ", ".join(methods)

    for strand in strands:
        substrands = db.query(TemplateSubstrand).filter(
            TemplateSubstrand.strand_id == strand.id
        ).order_by(TemplateSubstrand.sequence_order, TemplateSubstrand.id).all()
        
        for sub in substrands:
            # Determine how many lessons this substrand takes
            count = sub.number_of_lessons if sub.number_of_lessons and sub.number_of_lessons > 0 else 1
            
            # Prepare content
            slo = format_list_field(sub.specific_learning_outcomes)
            kiq = format_list_field(sub.key_inquiry_questions)
            sle = format_list_field(sub.suggested_learning_experiences)

            # Generate smart content
            smart_resources = generate_smart_resources(sle, slo)
            smart_assessment = generate_smart_assessment(sle, slo)

            # Textbook Data (if available in template)
            tb_name = sub.default_textbook_name or ""
            tb_learner_pages = sub.default_learner_book_pages or ""
            tb_teacher_pages = sub.default_teacher_guide_pages or ""

            for i in range(count):
                all_lessons_data.append({
                    "strand": strand.strand_name,
                    "sub_strand": sub.substrand_name,
                    "specific_learning_outcomes": slo,
                    "key_inquiry_questions": kiq,
                    "learning_experiences": sle,
                    "learning_resources": smart_resources,
                    "assessment_methods": smart_assessment,
                    "textbook_name": tb_name,
                    "textbook_learner_book_pages": tb_learner_pages,
                    "textbook_teacher_guide_pages": tb_teacher_pages,
                })

    # scheme.total_lessons = len(all_lessons_data) # Don't set it here, or set it to 0

    # 4. Distribute into Weeks
    total_lessons_count = len(all_lessons_data)

    # Smart Start Index based on Term (Weighted Distribution)
    # Term 1 (13 weeks), Term 2 (14 weeks), Term 3 (9 weeks) -> Total 36 weeks
    start_index = 0
    if term_number == 2:
        # Start after Term 1 (~36%)
        start_index = int(total_lessons_count * (13/36))
    elif term_number == 3:
        # Start after Term 2 (~75%)
        start_index = int(total_lessons_count * (27/36))

    current_lesson_idx = start_index

    print(f"[DEBUG] Total curriculum lessons: {total_lessons_count}")
    print(f"[DEBUG] Term {term_number} start index: {start_index}")
    print(f"[DEBUG] Total weeks: {data.total_weeks}, Lessons per week: {data.lessons_per_week}")

    actual_lessons_count = 0

    # Create weeks
    for week_num in range(1, data.total_weeks + 1):
        week = SchemeWeek(scheme_id=scheme.id, week_number=week_num)
        db.add(week)
        db.flush()

        # Calculate week start date if we have term start date
        week_start = None
        week_end = None
        if term_start_date:
            week_start = term_start_date + timedelta(weeks=week_num - 1)
            week_end = week_start + timedelta(days=6) # Sunday
            if week_num <= 10:  # Only log first 10 weeks
                print(f"[DEBUG] Week {week_num}: {week_start.strftime('%Y-%m-%d')} to {week_end.strftime('%Y-%m-%d')}")

        # --- Special Weeks Logic (Opening, Assessment, Closing) ---
        is_special_week = False
        special_week_data = None

        if getattr(data, 'include_special_weeks', False):
            if week_num == 1:
                is_special_week = True
                special_week_data = {
                    "strand": "OPENING WEEK",
                    "sub_strand": "OPENER ASSESSMENT",
                    "specific_learning_outcomes": "By the end of the week, the learner should be able to attempt the opener assessment.",
                    "learning_experiences": "Administering opener assessment.",
                    "learning_resources": "Assessment papers",
                    "assessment_methods": "Written"
                }
            elif week_num == data.total_weeks - 1:
                is_special_week = True
                special_week_data = {
                    "strand": "ASSESSMENT WEEK",
                    "sub_strand": "END OF TERM ASSESSMENT",
                    "specific_learning_outcomes": "By the end of the week, the learner should be able to attempt the end of term assessment.",
                    "learning_experiences": "Administering end of term assessment.",
                    "learning_resources": "Assessment papers",
                    "assessment_methods": "Written"
                }
            elif week_num == data.total_weeks:
                is_special_week = True
                special_week_data = {
                    "strand": "CLOSING WEEK",
                    "sub_strand": "CLOSING AND CLEANING",
                    "specific_learning_outcomes": "Closing school for the holiday.",
                    "learning_experiences": "Cleaning and clearing.",
                    "learning_resources": "Cleaning materials",
                    "assessment_methods": "Observation"
                }

        if is_special_week and special_week_data:
             # Create lessons for special week
             for lesson_num in range(1, data.lessons_per_week + 1):
                lesson = SchemeLesson(
                    week_id=week.id,
                    lesson_number=lesson_num,
                    strand=special_week_data["strand"],
                    sub_strand=special_week_data["sub_strand"],
                    specific_learning_outcomes=special_week_data["specific_learning_outcomes"],
                    key_inquiry_questions="",
                    learning_experiences=special_week_data["learning_experiences"],
                    learning_resources=special_week_data.get("learning_resources", ""),
                    assessment_methods=special_week_data.get("assessment_methods", ""),
                    textbook_name="",
                    textbook_teacher_guide_pages="",
                    textbook_learner_book_pages="",
                    reflection=""
                )
                db.add(lesson)
                actual_lessons_count += 1
             continue # Skip to next week

        # Check if the ENTIRE week is a break (Full Week Break)
        # If week_start and week_end are both within mid_term range
        is_full_week_break = False
        if week_start and mid_term_start and mid_term_end:
            # Check if the working week (Mon-Fri) is covered
            # Mon = week_start, Fri = week_start + 4
            mon = week_start
            fri = week_start + timedelta(days=4)
            if mid_term_start <= mon and mid_term_end >= fri:
                is_full_week_break = True

        if is_full_week_break:
            # Create ONE lesson for the whole week
            lesson = SchemeLesson(
                week_id=week.id,
                lesson_number=1,
                strand="MID TERM BREAK",
                sub_strand="MID TERM BREAK",
                specific_learning_outcomes="Mid Term Break",
                key_inquiry_questions="",
                learning_experiences="Mid Term Break",
                learning_resources="",
                assessment_methods="",
                textbook_name="",
                textbook_teacher_guide_pages="",
                textbook_learner_book_pages="",
                reflection=""
            )
            db.add(lesson)
            actual_lessons_count += 1
            # Do NOT increment current_lesson_idx (Push lessons)
            continue # Skip to next week

        # Add lessons for this week
        for lesson_num in range(1, data.lessons_per_week + 1):
            # Check for Mid Term Break Lesson (Partial Week)
            is_break = False
            if week_start and mid_term_start and mid_term_end:
                day_offset = lesson_num - 1
                if day_offset > 6: day_offset = 6
                lesson_date = week_start + timedelta(days=day_offset)

                if mid_term_start <= lesson_date <= mid_term_end:
                    is_break = True

            if is_break:
                print(f"[DEBUG] Week {week_num}, Lesson {lesson_num}: BREAK (lesson_date={lesson_date.strftime('%Y-%m-%d')}). current_lesson_idx stays at {current_lesson_idx}")
                lesson = SchemeLesson(
                    week_id=week.id,
                    lesson_number=lesson_num,
                    strand="MID TERM BREAK",
                    sub_strand="MID TERM BREAK",
                    specific_learning_outcomes="Mid Term Break",
                    key_inquiry_questions="",
                    learning_experiences="Mid Term Break",
                    learning_resources="",
                    assessment_methods="",
                    textbook_name="",
                    textbook_teacher_guide_pages="",
                    textbook_learner_book_pages="",
                    reflection=""
                )
                db.add(lesson)
                actual_lessons_count += 1
                # Do NOT increment current_lesson_idx (Push lessons)
            elif current_lesson_idx < total_lessons_count:
                l_data = all_lessons_data[current_lesson_idx]
                if week_num <= 10:  # Only log first 10 weeks
                    print(f"[DEBUG] Week {week_num}, Lesson {lesson_num}: Curriculum idx={current_lesson_idx}, Strand={l_data['strand'][:20]}...")
                lesson = SchemeLesson(
                    week_id=week.id,
                    lesson_number=lesson_num,
                    strand=l_data["strand"],
                    sub_strand=l_data["sub_strand"],
                    specific_learning_outcomes=l_data["specific_learning_outcomes"],
                    key_inquiry_questions=l_data["key_inquiry_questions"],
                    learning_experiences=l_data["learning_experiences"],
                    learning_resources=l_data["learning_resources"],
                    assessment_methods=l_data["assessment_methods"],
                    textbook_name=l_data["textbook_name"],
                    textbook_teacher_guide_pages=l_data["textbook_teacher_guide_pages"],
                    textbook_learner_book_pages=l_data["textbook_learner_book_pages"],
                    reflection=""
                )
                db.add(lesson)
                actual_lessons_count += 1
                current_lesson_idx += 1
            else:
                # Add Revision / End of Term Assessment if curriculum is finished
                lesson = SchemeLesson(
                    week_id=week.id,
                    lesson_number=lesson_num,
                    strand="REVISION / ASSESSMENT",
                    sub_strand="REVISION",
                    specific_learning_outcomes="Learners to revise covered work and prepare for assessment.",
                    key_inquiry_questions="",
                    learning_experiences="Revision and Assessment",
                    learning_resources="Past papers, Assessment tools",
                    assessment_methods="Written assessment",
                    textbook_name="",
                    textbook_teacher_guide_pages="",
                    textbook_learner_book_pages="",
                    reflection=""
                )
                db.add(lesson)
                actual_lessons_count += 1

    scheme.total_lessons = actual_lessons_count
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
        "strand": plan.strand_theme_topic,
        "sub_strand": plan.sub_strand_sub_theme_sub_topic,
        "grade": getattr(plan, 'grade', "Unknown"),
        "learning_area": getattr(plan, 'learning_area', "Unknown"),
        "outcomes": plan.specific_learning_outcomes,
        "competencies": plan.core_competences,
        "values": plan.values_to_be_developed,
        "learning_experiences": plan.development or "",
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
            plan.development = str(result["development"])
        if "conclusion" in result:
            plan.conclusion = result["conclusion"]
        if "resources" in result:
            plan.learning_resources = str(result["resources"])
            
    return plan
