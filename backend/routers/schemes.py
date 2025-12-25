from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta
from io import BytesIO

from database import get_db
from models import User, UserRole, SchemeOfWork, SchemeWeek, SchemeLesson, Term, SubscriptionType, SchoolSettings, SchoolTerm, SystemTerm, UserTermAdjustment
from schemas import (
    SchemeOfWorkCreate, SchemeOfWorkUpdate, SchemeOfWorkResponse, SchemeOfWorkSummary, 
    SchemeAutoGenerateRequest, SchemeLessonUpdate, SchemeLessonCreate
)
from dependencies import get_current_user
from config import settings
from ai_lesson_planner import generate_scheme_of_work
from rate_limiter import rate_limiter

# ReportLab Imports
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, LongTable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}/schemes",
    tags=["Schemes of Work"]
)

@router.get("", response_model=List[SchemeOfWorkSummary])
async def list_schemes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # If user is School Admin, they can see all schemes for their school
    if current_user.role in [UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN] and current_user.school_id:
        return db.query(SchemeOfWork).join(User).filter(User.school_id == current_user.school_id).all()

    return db.query(SchemeOfWork).filter(SchemeOfWork.user_id == current_user.id).all()

@router.get("/stats")
async def scheme_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total = db.query(SchemeOfWork).filter(SchemeOfWork.user_id == current_user.id).count()
    return {"total_schemes": total}

@router.get("/{scheme_id}", response_model=SchemeOfWorkResponse)
async def get_scheme(
    scheme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme = db.query(SchemeOfWork).filter(SchemeOfWork.id == scheme_id, SchemeOfWork.user_id == current_user.id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    
    # Calculate week dates if term info is available
    # Try to find the matching term
    term = db.query(Term).filter(
        Term.user_id == current_user.id,
        Term.term_name == scheme.term,
        Term.academic_year == str(scheme.year)
    ).first()
    
    # If not found by exact year match, try just term name and user (fallback)
    if not term:
        term = db.query(Term).filter(
            Term.user_id == current_user.id,
            Term.term_name == scheme.term
        ).order_by(Term.start_date.desc()).first()
    
    if term:
        term_start = term.start_date
        for week in scheme.weeks:
            # Calculate start and end dates for the week
            # Week 1 starts on term_start
            # We assume week_number is 1-based
            week_start = term_start + timedelta(weeks=week.week_number - 1)
            week_end = week_start + timedelta(days=4) # Mon-Fri (5 days)
            
            # Inject into the week object (it won't save to DB, just for response)
            week.start_date = week_start
            week.end_date = week_end

    return scheme

@router.post("", response_model=SchemeOfWorkResponse, status_code=201)
async def create_scheme(
    data: SchemeOfWorkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme = SchemeOfWork(
        user_id=current_user.id,
        subject_id=data.subject_id,
        teacher_name=data.teacher_name,
        school=data.school,
        term=data.term,
        year=data.year,
        subject=data.subject,
        grade=data.grade,
        stream=getattr(data, 'stream', None),
        roll=getattr(data, 'roll', None),
        total_weeks=data.total_weeks,
        total_lessons=data.total_lessons,
        status=data.status or "active"
    )
    db.add(scheme)
    db.flush()

    for week_payload in data.weeks:
        week = SchemeWeek(
            scheme_id=scheme.id,
            week_number=week_payload.week_number
        )
        db.add(week)
        db.flush()
        
        for lesson_payload in week_payload.lessons:
            lesson = SchemeLesson(
                week_id=week.id,
                lesson_number=lesson_payload.lesson_number,
                strand=lesson_payload.strand,
                sub_strand=lesson_payload.sub_strand,
                specific_learning_outcomes=lesson_payload.specific_learning_outcomes,
                key_inquiry_questions=lesson_payload.key_inquiry_questions,
                learning_experiences=lesson_payload.learning_experiences,
                learning_resources=lesson_payload.learning_resources,
                assessment_methods=lesson_payload.assessment_methods,
                textbook_name=lesson_payload.textbook_name,
                textbook_teacher_guide_pages=lesson_payload.textbook_teacher_guide_pages,
                textbook_learner_book_pages=lesson_payload.textbook_learner_book_pages,
                reflection=lesson_payload.reflection
            )
            db.add(lesson)

    db.commit()
    db.refresh(scheme)
    return scheme

@router.post("/generate", response_model=SchemeOfWorkResponse, status_code=201)
async def generate_scheme(
    data: SchemeAutoGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # AI Generation Logic
    # This calls the AI service
    import traceback
    try:
        generated_scheme = await generate_scheme_of_work(data, current_user, db)
        return generated_scheme
    except Exception as e:
        print(f"[ERROR] Scheme generation failed: {str(e)}")
        print(f"[ERROR] Full traceback:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@router.put("/{scheme_id}", response_model=SchemeOfWorkResponse)
async def update_scheme(
    scheme_id: int,
    data: SchemeOfWorkUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme = db.query(SchemeOfWork).filter(SchemeOfWork.id == scheme_id, SchemeOfWork.user_id == current_user.id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
        
    for key, value in data.dict(exclude_unset=True).items():
        if key != "weeks":
            setattr(scheme, key, value)
            
    db.commit()
    db.refresh(scheme)
    return scheme

@router.delete("/{scheme_id}")
async def delete_scheme(
    scheme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme = db.query(SchemeOfWork).filter(SchemeOfWork.id == scheme_id, SchemeOfWork.user_id == current_user.id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
        
    db.delete(scheme)
    db.commit()
    return {"message": "Scheme deleted"}

@router.put("/{scheme_id}/lessons/{lesson_id}", response_model=SchemeLessonCreate)
async def update_scheme_lesson(
    scheme_id: int,
    lesson_id: int,
    payload: SchemeLessonUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify ownership via scheme
    scheme = db.query(SchemeOfWork).filter(SchemeOfWork.id == scheme_id, SchemeOfWork.user_id == current_user.id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
        
    lesson = db.query(SchemeLesson).filter(SchemeLesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(lesson, key, value)
        
    db.commit()
    db.refresh(lesson)
    return lesson

@router.post("/{scheme_id}/generate-lesson-plans")
async def generate_lesson_plans_from_scheme(
    scheme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate individual lesson plans for all lessons in a scheme of work.
    """
    from models import LessonPlan, CurriculumTemplate, TemplateStrand, TemplateSubstrand
    from sqlalchemy import func
    import re

    def _resolve_term_start_date() -> "datetime | None":
        """Resolve start date from system terms, applying user/school adjustments if present."""
        term_number = None
        if scheme.term:
            m = re.search(r"(\d+)", scheme.term)
            if m:
                term_number = int(m.group(1))

        term_q = db.query(SystemTerm).filter(SystemTerm.year == scheme.year)
        if scheme.term:
            term_exact = term_q.filter(SystemTerm.term_name == scheme.term).first()
            if term_exact:
                system_term = term_exact
            elif term_number is not None:
                system_term = term_q.filter(SystemTerm.term_number == term_number).first()
            else:
                system_term = term_q.order_by(SystemTerm.term_number.asc()).first()
        else:
            system_term = term_q.order_by(SystemTerm.term_number.asc()).first()

        if not system_term:
            return None

        adjustment = None
        if current_user.school_id:
            adjustment = db.query(UserTermAdjustment).filter(
                UserTermAdjustment.system_term_id == system_term.id,
                UserTermAdjustment.school_id == current_user.school_id,
                UserTermAdjustment.is_active == True,
            ).first()
        if not adjustment:
            adjustment = db.query(UserTermAdjustment).filter(
                UserTermAdjustment.system_term_id == system_term.id,
                UserTermAdjustment.user_id == current_user.id,
                UserTermAdjustment.is_active == True,
            ).first()

        return adjustment.adjusted_start_date if adjustment else system_term.start_date
    
    scheme = db.query(SchemeOfWork).filter(SchemeOfWork.id == scheme_id, SchemeOfWork.user_id == current_user.id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
        
    # Pre-fetch curriculum template data to avoid N+1 queries
    # We try to find the template that matches this scheme's subject and grade
    template = db.query(CurriculumTemplate).filter(
        func.lower(CurriculumTemplate.subject) == func.lower(scheme.subject),
        func.lower(CurriculumTemplate.grade) == func.lower(scheme.grade)
    ).first()
    
    # Create a lookup map: (strand_name, substrand_name) -> TemplateSubstrand
    substrand_map = {}
    if template:
        strands = db.query(TemplateStrand).filter(TemplateStrand.curriculum_template_id == template.id).all()
        for s in strands:
            substrands = db.query(TemplateSubstrand).filter(TemplateSubstrand.strand_id == s.id).all()
            for sub in substrands:
                key = (s.strand_name.strip().lower(), sub.substrand_name.strip().lower())
                substrand_map[key] = sub
    
    count = 0

    term_start = _resolve_term_start_date()
    
    for week in scheme.weeks:
        for lesson in week.lessons:
            # Check if plan already exists
            existing = db.query(LessonPlan).filter(LessonPlan.scheme_lesson_id == lesson.id).first()
            if existing:
                continue
            
            # Try to find matching template data
            template_data = substrand_map.get((lesson.strand.strip().lower(), lesson.sub_strand.strip().lower()))
            
            core_competencies = ""
            values = ""
            pcis = ""
            
            if template_data:
                def format_list(data):
                    if isinstance(data, list):
                        return ", ".join(data)
                    return str(data) if data else ""
                
                core_competencies = format_list(template_data.core_competencies)
                values = format_list(template_data.values)
                pcis = format_list(template_data.pcis)
            
            # Generate Smart Organization of Learning
            intro = f"Review previous lesson. Introduce the topic of {lesson.sub_strand}."
            conclusion = f"Ask learners questions about {lesson.sub_strand}. Summarize key points."
            
            # Create new lesson plan
            planned_date = None
            if term_start:
                # Week 1 starts on term_start. We assume 5-day teaching week.
                week_start = term_start + timedelta(days=(week.week_number - 1) * 7)
                lesson_index = max((lesson.lesson_number or 1) - 1, 0)
                extra_weeks, day_index = divmod(lesson_index, 5)
                planned_dt = week_start + timedelta(weeks=extra_weeks, days=day_index)
                planned_date = planned_dt.date().isoformat()

            plan = LessonPlan(
                user_id=current_user.id,
                subject_id=scheme.subject_id,
                scheme_lesson_id=lesson.id,
                learning_area=scheme.subject,
                grade=scheme.grade,
                date=planned_date,
                roll=scheme.roll,
                strand_theme_topic=lesson.strand,
                sub_strand_sub_theme_sub_topic=lesson.sub_strand,
                specific_learning_outcomes=lesson.specific_learning_outcomes,
                key_inquiry_questions=lesson.key_inquiry_questions,
                learning_resources=lesson.learning_resources,
                
                # Enhanced Fields
                core_competences=core_competencies,
                values_to_be_developed=values,
                pcis_to_be_addressed=pcis,
                
                # Organization of Learning
                introduction=intro,
                development=lesson.learning_experiences, # Map experiences to development
                conclusion=conclusion,
                summary=f"Lesson on {lesson.sub_strand} covered successfully.",
                
                status="pending"
            )
            db.add(plan)
            count += 1
            
    db.commit()
    return {"message": "Lesson plans generated", "total_plans": count}

@router.get("/{scheme_id}/pdf", dependencies=[Depends(rate_limiter(limit=5, window_seconds=60))])
async def scheme_pdf(
    scheme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme = db.query(SchemeOfWork).filter(SchemeOfWork.id == scheme_id, SchemeOfWork.user_id == current_user.id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    # Only PREMIUM or SCHOOL_SPONSORED users can download
    is_school_linked = current_user.school_id is not None
    is_premium = current_user.subscription_type in [SubscriptionType.SCHOOL_SPONSORED, SubscriptionType.INDIVIDUAL_PREMIUM]
    is_trial = current_user.is_trial_active
    
    if not (is_school_linked or is_premium or is_trial):
         raise HTTPException(
            status_code=403,
            detail="Downloads are available on Premium plans only. Please upgrade to download."
        )

    pdf_io = BytesIO()
    # Reduced margins for more content space
    doc = SimpleDocTemplate(pdf_io, pagesize=landscape(A4), leftMargin=0.25*cm, rightMargin=0.25*cm, topMargin=0.25*cm, bottomMargin=0.25*cm)
    elements = []
    styles = getSampleStyleSheet()
    
    # Cover Page
    elements.append(Spacer(1, 3*cm)) # Vertical centering
    
    # Title Section
    title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=36, textColor=colors.HexColor('#1e293b'), alignment=TA_CENTER, spaceAfter=12, leading=42)
    elements.append(Paragraph("SCHEME OF WORK", title_style))
    
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontName='Helvetica', fontSize=18, textColor=colors.HexColor('#64748b'), alignment=TA_CENTER, spaceAfter=30, leading=24)
    elements.append(Paragraph(f"{scheme.subject} • {scheme.grade}", subtitle_style))
    
    # Decorative Divider
    line_data = [[""]]
    line_table = Table(line_data, colWidths=[10*cm], rowHeights=[2])
    line_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#4F46E5')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    elements.append(line_table)
    elements.append(Spacer(1, 2*cm))
    
    # Info Grid Data
    label_style = ParagraphStyle('Label', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor('#64748b'), alignment=TA_CENTER, leading=12)
    value_style = ParagraphStyle('Value', parent=styles['Normal'], fontName='Helvetica', fontSize=14, textColor=colors.HexColor('#0f172a'), alignment=TA_CENTER, leading=18)
    
    cell_1_1 = [Paragraph("TEACHER", label_style), Spacer(1, 3), Paragraph(scheme.teacher_name or "-", value_style)]
    cell_1_2 = [Paragraph("TERM", label_style), Spacer(1, 3), Paragraph(scheme.term or "-", value_style)]
    cell_1_3 = [Paragraph("TOTAL WEEKS", label_style), Spacer(1, 3), Paragraph(str(scheme.total_weeks), value_style)]
    
    cell_2_1 = [Paragraph("SCHOOL", label_style), Spacer(1, 3), Paragraph(scheme.school or "-", value_style)]
    cell_2_2 = [Paragraph("YEAR", label_style), Spacer(1, 3), Paragraph(str(scheme.year), value_style)]
    cell_2_3 = [Paragraph("TOTAL LESSONS", label_style), Spacer(1, 3), Paragraph(str(scheme.total_lessons), value_style)]
    
    info_data = [
        [cell_1_1, cell_1_2, cell_1_3],
        [cell_2_1, cell_2_2, cell_2_3]
    ]
    
    info_table = Table(info_data, colWidths=[7*cm, 7*cm, 7*cm])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 20),
        ('BOTTOMPADDING', (0,0), (-1,-1), 20),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        
        # Grid lines
        ('LINEAFTER', (0,0), (1,-1), 0.5, colors.HexColor('#cbd5e1')), # Vertical lines between cols
        ('LINEBELOW', (0,0), (-1,0), 0.5, colors.HexColor('#cbd5e1')), # Horizontal line between rows
        
        # Outer Border
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor('#94a3b8')),
        
        # Background
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
    ]))
    
    elements.append(info_table)
    elements.append(PageBreak())
    
    # Helper function to format learning outcomes with a, b, c numbering
    def format_learning_outcomes(text):
        if not text:
            return ""
            
        intro_text = "By the end of the sub-strand, the learner should be able to:"
        clean_text = text
        
        # Remove intro if present to process the list items
        if clean_text.strip().startswith(intro_text):
            clean_text = clean_text.replace(intro_text, "", 1).strip()
            
        # Split logic similar to experiences
        parts = []
        if '\n' in clean_text:
            parts = [p.strip() for p in clean_text.split('\n') if p.strip()]
        elif '-' in clean_text: # If hyphens are used as bullets
             parts = [p.strip() for p in clean_text.split('-') if p.strip()]
        else:
             parts = [clean_text.strip()]
             
        formatted = [f"<b>{intro_text}</b>"]
        
        for i, p in enumerate(parts):
            # Remove any leading bullets just in case
            p = p.lstrip('•-* ')
            if p:
                capitalized = p[0].upper() + p[1:]
                letter = chr(97 + i) # a, b, c...
                formatted.append(f"{letter}) {capitalized}")
                
        return "<br/>".join(formatted)

    # Helper function to format learning experiences with bullets
    def format_learning_experiences(text):
        if not text:
            return ""
        
        # Split by newline if present, otherwise split by period
        if '\n' in text:
            parts = text.split('\n')
        else:
            # Simple split by period, filtering empty strings
            parts = [p.strip() for p in text.split('.') if p.strip()]
            
        formatted = []
        for p in parts:
            p = p.strip()
            if p:
                # Remove existing bullets
                p = p.lstrip('•-* ')
                if p:
                    capitalized = p[0].upper() + p[1:]
                    formatted.append(f"• {capitalized}")
                    
        return "<br/>".join(formatted)

    # Helper function to format resources
    def format_resources(text, lesson):
        formatted_parts = []
        
        # Format basic resources
        if text:
            resources_list = [r.strip() for r in text.split(',') if r.strip()]
            for r in resources_list:
                capitalized = r[0].upper() + r[1:]
                formatted_parts.append(f"• {capitalized}")
        
        # Add textbook info
        if lesson.textbook_name:
            # Add spacing if there are other resources
            if formatted_parts:
                formatted_parts.append("<br/>")
                
            formatted_parts.append("<b>Textbook:</b>")
            formatted_parts.append(f"{lesson.textbook_name}")
            
            if lesson.textbook_teacher_guide_pages:
                formatted_parts.append(f"TG: {lesson.textbook_teacher_guide_pages}")
            
            if lesson.textbook_learner_book_pages:
                formatted_parts.append(f"LB: {lesson.textbook_learner_book_pages}")
                
        return "<br/>".join(formatted_parts)

    # Helper function to format assessment methods
    def format_assessment_methods(text):
        if not text:
            return ""
        
        formatted_parts = []
        methods_list = [m.strip() for m in text.split(',') if m.strip()]
        
        for m in methods_list:
            capitalized = m[0].upper() + m[1:]
            formatted_parts.append(f"• {capitalized}")
            
        return "<br/>".join(formatted_parts)
    
    # Main table - use Paragraphs for text wrapping with optimized spacing
    # Reduced font size to 8 and leading to 10 to fit more content
    cell_style = ParagraphStyle('CellStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=10, spaceBefore=1, spaceAfter=1, textColor=colors.HexColor('#334155'))
    header_style = ParagraphStyle('HeaderStyle', parent=styles['Normal'], fontSize=8, textColor=colors.white, fontName='Helvetica-Bold', leading=10, alignment=TA_CENTER)
    
    # Uppercase headers
    table_data = [[
        Paragraph('WEEK', header_style),
        Paragraph('LESSON', header_style),
        Paragraph('STRAND', header_style),
        Paragraph('SUB-STRAND', header_style),
        Paragraph('Specific Learning Outcomes', header_style),
        Paragraph('Suggested Key Inquiry Question(s)', header_style),
        Paragraph('Suggested Learning Experiences', header_style),
        Paragraph('RESOURCES', header_style),
        Paragraph('ASSESSMENT', header_style),
        Paragraph('REFLECTION', header_style)
    ]]
    
    # Track row spans for merging week cells
    # row_spans = [] # Disabled to prevent LayoutError on page breaks
    current_row_index = 1 # Start after header row
    week_col_lines = [] # Dynamic lines for week column
    
    # --- Smart Calendar Logic ---
    try:
        term_number = 1
        if "term" in scheme.term.lower():
            try:
                term_number = int(scheme.term.lower().replace("term", "").strip())
            except ValueError:
                pass
        
        term_start_date = None
        
        if current_user.school_id:
            school_settings = db.query(SchoolSettings).first()
            if school_settings:
                school_term = db.query(SchoolTerm).filter(
                    SchoolTerm.school_settings_id == school_settings.id,
                    SchoolTerm.year == scheme.year,
                    SchoolTerm.term_number == term_number
                ).first()
                if school_term:
                    try:
                        term_start_date = datetime.strptime(school_term.start_date, "%Y-%m-%d")
                    except ValueError:
                        pass
        
        if not term_start_date:
            user_terms = db.query(Term).filter(
                Term.user_id == current_user.id,
                Term.term_number == term_number
            ).all()
            for t in user_terms:
                if str(scheme.year) in t.academic_year:
                    term_start_date = t.start_date
                    break
    except Exception:
        term_start_date = None

    for week in sorted(scheme.weeks, key=lambda w: w.week_number):
        week_lessons = sorted(week.lessons, key=lambda l: l.lesson_number)
        num_lessons = len(week_lessons)
        
        # Calculate dates
        week_date_str = ""
        if term_start_date:
            days_offset = (week.week_number - 1) * 7
            week_start = term_start_date + timedelta(days=days_offset)
            week_end = week_start + timedelta(days=4)
            week_date_str = f"<br/><font size=6 color='#64748b'>{week_start.strftime('%d %b')} - {week_end.strftime('%d %b')}</font>"
        
        if num_lessons > 0:
            # Calculate end row for this week to draw the bottom line
            end_row = current_row_index + num_lessons - 1
            week_col_lines.append(('LINEBELOW', (0, end_row), (0, end_row), 0.5, colors.HexColor('#94a3b8')))
        
        for i, lesson in enumerate(week_lessons):
            # Only show week number in the first row of the week
            # Use bold for week number
            week_text = f"<b>{week.week_number}</b>{week_date_str}" if i == 0 else ""
            
            # Format learning outcomes with a, b, c numbering
            outcomes = format_learning_outcomes(lesson.specific_learning_outcomes)
            
            # Format resources to include textbooks
            resources = format_resources(lesson.learning_resources, lesson)
            
            # Format assessment methods
            assessments = format_assessment_methods(lesson.assessment_methods)

            table_data.append([
                Paragraph(week_text, cell_style),
                Paragraph(str(lesson.lesson_number), cell_style),
                Paragraph(lesson.strand or "", cell_style),
                Paragraph(lesson.sub_strand or "", cell_style),
                Paragraph(outcomes, cell_style),
                Paragraph(lesson.key_inquiry_questions or "", cell_style),
                Paragraph(format_learning_experiences(lesson.learning_experiences or ""), cell_style),
                Paragraph(resources, cell_style),
                Paragraph(assessments, cell_style),
                Paragraph(lesson.reflection or "", cell_style)
            ])
            current_row_index += 1
    
    # Optimized column widths to reduce space wastage and fill landscape A4 (Total ~29.0cm)
    # Week, Lesson, Strand, Sub-strand, Outcomes, Questions, Experiences, Resources, Assessment, Reflection
    # Reduced total width slightly to ensure right border is not clipped
    # Adjusted widths: Reduced Strand/Sub-strand/Resources slightly, Increased Experiences/Outcomes
    main_table = LongTable(table_data, colWidths=[0.8*cm, 0.8*cm, 2.2*cm, 2.8*cm, 5.5*cm, 3.5*cm, 6.3*cm, 3.0*cm, 2.8*cm, 1.3*cm], repeatRows=1, splitByRow=1)
    
    table_style_commands = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')), # Dark Slate Header
        
        # Grid for columns 1 to end (Lesson onwards) - draws all lines
        ('GRID', (1, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')), # Light Slate Grid
        
        # Vertical lines for Week column
        ('LINEBEFORE', (0, 0), (0, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('LINEAFTER', (0, 0), (0, -1), 0.5, colors.HexColor('#cbd5e1')),
        
        # Top line for Week column header
        ('LINEABOVE', (0, 0), (0, 0), 0.5, colors.HexColor('#cbd5e1')),
        # Bottom line for Week column header (separator between header and data)
        ('LINEBELOW', (0, 0), (0, 0), 0.5, colors.HexColor('#cbd5e1')),

        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        # Reduced padding to fit more content
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('ALIGN', (0, 1), (1, -1), 'CENTER'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
    ]
    
    # Add dynamic week lines
    table_style_commands.extend(week_col_lines)
    
    main_table.setStyle(TableStyle(table_style_commands))
    main_table.hAlign = 'LEFT'
    elements.append(main_table)
    
    doc.build(elements)
    pdf_io.seek(0)
    filename = f"scheme_{scheme.id}_{scheme.subject}_{scheme.grade}_{scheme.term}_{scheme.year}.pdf".replace(" ", "_")
    return StreamingResponse(pdf_io, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})
