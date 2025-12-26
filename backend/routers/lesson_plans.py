from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta
import re

from database import get_db
from models import User, UserRole, LessonPlan, SchemeLesson, SystemTerm, UserTermAdjustment
from schemas import LessonPlanCreate, LessonPlanUpdate, LessonPlanResponse, LessonPlanSummary
from dependencies import get_current_user
from config import settings
from ai_lesson_planner import generate_lesson_plan

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}/lesson-plans",
    tags=["Lesson Plans"]
)

@router.post("", response_model=LessonPlanResponse)
async def create_lesson_plan(
    lesson_plan: LessonPlanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_plan = LessonPlan(
        user_id=current_user.id,
        **lesson_plan.dict()
    )
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.post("/from-scheme/{scheme_lesson_id}", response_model=LessonPlanResponse)
async def create_lesson_plan_from_scheme(
    scheme_lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme_lesson = db.query(SchemeLesson).filter(SchemeLesson.id == scheme_lesson_id).first()
    if not scheme_lesson:
        raise HTTPException(status_code=404, detail="Scheme lesson not found")
        
    # Create plan from scheme lesson data
    # Ensure we have the scheme loaded to get subject details
    scheme = scheme_lesson.week.scheme

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

    planned_date = None
    term_start = _resolve_term_start_date()
    if term_start:
        # Week 1 starts on term_start. We assume 5-day teaching week.
        week_start = term_start + timedelta(days=(scheme_lesson.week.week_number - 1) * 7)
        lesson_index = max((scheme_lesson.lesson_number or 1) - 1, 0)
        extra_weeks, day_index = divmod(lesson_index, 5)
        planned_dt = week_start + timedelta(weeks=extra_weeks, days=day_index)
        planned_date = planned_dt.date().isoformat()
    
    plan = LessonPlan(
        user_id=current_user.id,
        subject_id=scheme.subject_id,
        scheme_lesson_id=scheme_lesson.id,
        learning_area=scheme.subject,
        grade=scheme.grade,
        date=planned_date,
        roll=scheme.roll,
        lesson_duration_minutes=getattr(scheme, 'lesson_duration_minutes', None),
        strand_theme_topic=scheme_lesson.strand,
        sub_strand_sub_theme_sub_topic=scheme_lesson.sub_strand,
        specific_learning_outcomes=scheme_lesson.specific_learning_outcomes,
        key_inquiry_questions=scheme_lesson.key_inquiry_questions,
        learning_resources=scheme_lesson.learning_resources,
        development=scheme_lesson.learning_experiences, # Pre-fill development with experiences
        status="pending"
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

@router.get("", response_model=List[LessonPlanSummary])
async def get_lesson_plans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # If user is School Admin, they can see all lesson plans for their school
    if current_user.role in [UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN] and current_user.school_id:
        return db.query(LessonPlan).join(User).filter(User.school_id == current_user.school_id).all()

    return db.query(LessonPlan).filter(LessonPlan.user_id == current_user.id).all()

@router.get("/{lesson_plan_id}", response_model=LessonPlanResponse)
async def get_lesson_plan(
    lesson_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(LessonPlan).filter(LessonPlan.id == lesson_plan_id, LessonPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    return plan

@router.put("/{lesson_plan_id}", response_model=LessonPlanResponse)
async def update_lesson_plan(
    lesson_plan_id: int,
    lesson_plan_update: LessonPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(LessonPlan).filter(LessonPlan.id == lesson_plan_id, LessonPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
        
    for key, value in lesson_plan_update.dict(exclude_unset=True).items():
        setattr(plan, key, value)
        
    db.commit()
    db.refresh(plan)
    return plan

@router.delete("/{lesson_plan_id}")
async def delete_lesson_plan(
    lesson_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(LessonPlan).filter(LessonPlan.id == lesson_plan_id, LessonPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
        
    db.delete(plan)
    db.commit()
    return {"message": "Lesson plan deleted"}

@router.post("/bulk-delete")
async def bulk_delete_lesson_plans(
    ids: List[int],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(LessonPlan).filter(LessonPlan.id.in_(ids), LessonPlan.user_id == current_user.id).delete(synchronize_session=False)
    db.commit()
    return {"message": "Plans deleted"}

@router.post("/bulk-download")
async def bulk_download_lesson_plans(
    ids: List[int],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check premium status
    is_school_linked = current_user.school_id is not None
    is_premium = current_user.subscription_type in [SubscriptionType.SCHOOL_SPONSORED, SubscriptionType.INDIVIDUAL_PREMIUM]
    is_trial = current_user.is_trial_active
    is_super_admin = current_user.role == UserRole.SUPER_ADMIN
    
    if not (is_school_linked or is_premium or is_trial or is_super_admin):
        raise HTTPException(
            status_code=403,
            detail="Bulk downloads are available on Premium plans only."
        )
    
    # Get all lesson plans
    plans = db.query(LessonPlan).filter(LessonPlan.id.in_(ids), LessonPlan.user_id == current_user.id).all()
    
    if not plans:
        raise HTTPException(status_code=404, detail="No lesson plans found")
    
    # Import PyPDF2 for merging
    try:
        from PyPDF2 import PdfMerger
    except ImportError:
        raise HTTPException(status_code=500, detail="PDF merge library not available")
    
    merger = PdfMerger()
    
    # Generate PDF for each plan and add to merger
    for plan in plans:
        # Generate individual PDF (reuse the logic from single PDF endpoint)
        individual_pdf = generate_single_lesson_pdf(plan, current_user)
        merger.append(individual_pdf)
    
    # Write merged PDF to BytesIO
    output = BytesIO()
    merger.write(output)
    merger.close()
    output.seek(0)
    
    filename = f"LessonPlans_Bulk_{len(plans)}_plans.pdf"
    return StreamingResponse(output, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})

# Helper function to generate a single lesson plan PDF (extracted for reuse)
def generate_single_lesson_pdf(plan: LessonPlan, current_user: User) -> BytesIO:

@router.post("/{lesson_plan_id}/auto-generate", response_model=LessonPlanResponse)
async def auto_generate_lesson_plan(
    lesson_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # AI Generation
    plan = db.query(LessonPlan).filter(LessonPlan.id == lesson_plan_id, LessonPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
        
    # Call AI service
    try:
        plan = await generate_lesson_plan(plan)
        db.commit()
        db.refresh(plan)
    except Exception as e:
        print(f"AI Generation failed: {e}")
        # We don't raise here to allow returning the partial plan, or we could raise.
        # For now, let's just log and return the plan as is.
        
    return plan

@router.post("/{lesson_plan_id}/enhance", response_model=LessonPlanResponse)
async def enhance_lesson_plan_with_ai(
    lesson_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # AI Enhancement
    plan = db.query(LessonPlan).filter(LessonPlan.id == lesson_plan_id, LessonPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
        
    # Call AI service (same as generate for now)
    try:
        plan = await generate_lesson_plan(plan)
        db.commit()
        db.refresh(plan)
    except Exception as e:
        print(f"AI Enhancement failed: {e}")
        
    return plan


# PDF Generation imports
from io import BytesIO
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from models import SubscriptionType

@router.get("/{lesson_plan_id}/pdf")
async def lesson_plan_pdf(
    lesson_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(LessonPlan).filter(LessonPlan.id == lesson_plan_id, LessonPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")

    # Only PREMIUM or SCHOOL_SPONSORED users can download
    is_school_linked = current_user.school_id is not None
    is_premium = current_user.subscription_type in [SubscriptionType.SCHOOL_SPONSORED, SubscriptionType.INDIVIDUAL_PREMIUM]
    is_trial = current_user.is_trial_active
    is_super_admin = current_user.role == UserRole.SUPER_ADMIN
    
    if not (is_school_linked or is_premium or is_trial or is_super_admin):
        raise HTTPException(
            status_code=403,
            detail="Downloads are available on Premium plans only. Please upgrade to download."
        )



    pdf_io = BytesIO()
    doc = SimpleDocTemplate(pdf_io, pagesize=A4, leftMargin=0.8*cm, rightMargin=0.8*cm, topMargin=0.6*cm, bottomMargin=0.6*cm)
    elements = []
    styles = getSampleStyleSheet()
    
    # Improved font sizes for readability
    title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=24, textColor=colors.HexColor('#1e293b'), alignment=TA_CENTER, spaceAfter=4, leading=28)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=12, textColor=colors.HexColor('#64748b'), alignment=TA_CENTER, spaceAfter=8, leading=16)
    label_style = ParagraphStyle('Label', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor('#64748b'), alignment=TA_CENTER, leading=10)
    value_style = ParagraphStyle('Value', parent=styles['Normal'], fontName='Helvetica', fontSize=10, textColor=colors.HexColor('#0f172a'), alignment=TA_CENTER, leading=12)
    section_title = ParagraphStyle('SectionTitle', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#1e40af'), spaceBefore=5, spaceAfter=3, leading=12)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontName='Helvetica', fontSize=9, textColor=colors.HexColor('#374151'), leading=11, spaceAfter=4)
    
    # Header
    elements.append(Spacer(1, 0.3*cm))
    elements.append(Paragraph("LESSON PLAN", title_style))
    elements.append(Paragraph(f"{plan.learning_area or 'Subject'} • {plan.grade or 'Grade'}", subtitle_style))
    
    # Decorative Line
    line_data = [[""]]
    line_table = Table(line_data, colWidths=[6*cm], rowHeights=[2])
    line_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#4F46E5')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    elements.append(line_table)
    elements.append(Spacer(1, 0.3*cm))
    
    # Info Grid - Compact
    teacher_name = current_user.full_name if hasattr(current_user, 'full_name') else current_user.email
    duration = f"{plan.lesson_duration_minutes} min" if plan.lesson_duration_minutes else "Not set"
    
    cell_1_1 = [Paragraph("DATE", label_style), Spacer(1, 1), Paragraph(plan.date or "-", value_style)]
    cell_1_2 = [Paragraph("TIME", label_style), Spacer(1, 1), Paragraph(plan.time or "-", value_style)]
    cell_1_3 = [Paragraph("DURATION", label_style), Spacer(1, 1), Paragraph(duration, value_style)]
    
    cell_2_1 = [Paragraph("ROLL", label_style), Spacer(1, 1), Paragraph(str(plan.roll) if plan.roll else "-", value_style)]
    cell_2_2 = [Paragraph("GRADE", label_style), Spacer(1, 1), Paragraph(plan.grade or "-", value_style)]
    cell_2_3 = [Paragraph("TEACHER", label_style), Spacer(1, 1), Paragraph(teacher_name or "-", value_style)]
    
    info_data = [
        [cell_1_1, cell_1_2, cell_1_3],
        [cell_2_1, cell_2_2, cell_2_3]
    ]
    
    info_table = Table(info_data, colWidths=[6*cm, 6*cm, 6*cm])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LINEAFTER', (0,0), (1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('LINEBELOW', (0,0), (-1,0), 0.5, colors.HexColor('#cbd5e1')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#94a3b8')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
    ]))
    
    elements.append(info_table)
    elements.append(Spacer(1, 0.3*cm))
    
    # Helper to format lists with a), b), c)
    def format_list_items(text):
        if not text:
            return ""
        
        # Split by common delimiters
        items = []
        if '\n-' in text or '\n•' in text:
            # Split by newline and filter bullets
            items = [line.strip().lstrip('-•* ').strip() for line in text.split('\n') if line.strip() and not line.strip().startswith(('By the end', 'The learner'))]
        elif '- ' in text:
            items = [item.strip() for item in text.split('- ') if item.strip()]
        else:
            # Try splitting by periods or newlines
            items = [item.strip() for item in text.replace('\n', '. ').split('. ') if item.strip() and len(item.strip()) > 10]
        
        if not items:
            return text.replace('\n', '<br/>')
        
        # Format with a), b), c)
        formatted = []
        for i, item in enumerate(items):
            letter = chr(97 + i)  # a, b, c...
            formatted.append(f"{letter}) {item}")
        
        return '<br/>'.join(formatted)
    
    # Content Sections with borders
    def add_section(title, content, use_list_format=False):
        if content:
            # Create a bordered section
            section_elements = []
            section_elements.append(Paragraph(title, section_title))
            
            if use_list_format:
                formatted_content = format_list_items(content)
            else:
                formatted_content = content.replace('\n', '<br/>')
            
            section_elements.append(Paragraph(formatted_content, body_style))
            
            # Wrap in a table for border
            section_table = Table([[section_elements]], colWidths=[18*cm])
            section_table.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('LEFTPADDING', (0,0), (-1,-1), 6),
                ('RIGHTPADDING', (0,0), (-1,-1), 6),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
                ('BACKGROUND', (0,0), (-1,-1), colors.white),
            ]))
            elements.append(section_table)
            elements.append(Spacer(1, 0.15*cm))
    
    # Sections with updated labels (removed "Topic" and "Sub-topic")
    add_section("Strand / Theme", plan.strand_theme_topic)
    add_section("Sub-strand / Sub-theme", plan.sub_strand_sub_theme_sub_topic)
    add_section("Specific Learning Outcomes", plan.specific_learning_outcomes, use_list_format=True)
    add_section("Key Inquiry Questions", plan.key_inquiry_questions)
    add_section("Core Competences", plan.core_competences, use_list_format=True)
    add_section("Values to be Developed", plan.values_to_be_developed, use_list_format=True)
    add_section("PCIs to be Addressed", plan.pcis_to_be_addressed)
    add_section("Learning Resources", plan.learning_resources)
    add_section("Introduction", plan.introduction)
    add_section("Development (Lesson Steps)", plan.development)
    add_section("Conclusion", plan.conclusion)
    add_section("Summary", plan.summary)
    
    # Reflection section - always show, leave empty (no instruction text)
    reflection_content = plan.reflection_self_evaluation if plan.reflection_self_evaluation else ""
    if reflection_content or True:  # Always show
        section_elements = []
        section_elements.append(Paragraph("Reflection / Self-Evaluation", section_title))
        section_elements.append(Paragraph(reflection_content if reflection_content else " ", body_style))
        
        section_table = Table([[section_elements]], colWidths=[18*cm])
        section_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 20),  # Extra space for writing
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
            ('BACKGROUND', (0,0), (-1,-1), colors.white),
        ]))
        elements.append(section_table)
    
    doc.build(elements)
    pdf_io.seek(0)
    
    filename = f"LessonPlan_{plan.learning_area}_{plan.grade}_{plan.date or 'undated'}.pdf".replace(" ", "_")
    return StreamingResponse(pdf_io, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})

