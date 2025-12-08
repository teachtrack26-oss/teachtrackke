from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import json

from database import get_db
from models import User, CurriculumTemplate, Subject, Strand, SubStrand, Lesson, SubscriptionType
from schemas import CurriculumTemplateResponse, BulkCurriculumUseRequest
from dependencies import get_current_user, get_current_admin_user
from config import settings
from curriculum_parser import CurriculumParser
from curriculum_importer import import_curriculum_from_json

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}",
    tags=["Curriculum"]
)

UPLOAD_DIR = "uploads/curriculum"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/curriculum/upload")
async def upload_curriculum(
    file: UploadFile = File(...),
    grade: str = Form(...),
    learning_area: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Save file
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())
        
    # Parse
    parser = CurriculumParser()
    try:
        # This is a simplified call based on main.py context
        # You might need to adjust based on actual parser implementation
        result = parser.parse_file(file_path)
        
        # Import
        import_curriculum_from_json(result, db)
        
        return {"message": "Curriculum uploaded and imported successfully", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@router.get("/curriculum-templates")
async def list_curriculum_templates(
    grade: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(CurriculumTemplate).filter(CurriculumTemplate.is_active == True)
    if grade:
        query = query.filter(CurriculumTemplate.grade == grade)
    return query.all()

@router.delete("/curriculum-templates/{template_id}")
async def delete_curriculum_template(
    template_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    template = db.query(CurriculumTemplate).filter(CurriculumTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db.delete(template)
    db.commit()
    return {"message": "Template deleted"}

@router.post("/curriculum-templates/bulk-use")
async def use_curriculum_templates_bulk(
    request: BulkCurriculumUseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    results = {
        "success": [],
        "failed": [],
        "skipped": []
    }
    
    for template_id in request.template_ids:
        # 1. Fetch the template
        template = db.query(CurriculumTemplate).filter(CurriculumTemplate.id == template_id).first()
        if not template:
            results["failed"].append({"id": template_id, "reason": "Template not found"})
            continue

        # 2. Check if user already has this subject
        existing_subject = db.query(Subject).filter(
            Subject.user_id == current_user.id,
            Subject.subject_name == template.subject,
            Subject.grade == template.grade
        ).first()

        if existing_subject:
            results["skipped"].append({"id": template_id, "subject": template.subject, "reason": "Already exists"})
            continue

        # Check subscription limits
        subject_count = db.query(Subject).filter(Subject.user_id == current_user.id).count()
        sub_type = current_user.subscription_type or SubscriptionType.FREE
        
        if sub_type == SubscriptionType.FREE and subject_count >= 2:
             results["failed"].append({"id": template_id, "subject": template.subject, "reason": "Free plan limit reached (2 subjects). Upgrade to add more."})
             continue
        elif sub_type == SubscriptionType.INDIVIDUAL_BASIC and subject_count >= 6:
             results["failed"].append({"id": template_id, "subject": template.subject, "reason": "Basic plan limit reached (6 subjects). Upgrade to add more."})
             continue

        try:
            # 3. Create the Subject
            new_subject = Subject(
                user_id=current_user.id,
                template_id=template.id,
                subject_name=template.subject,
                grade=template.grade,
                total_lessons=0, # Will be updated
                lessons_completed=0
            )
            db.add(new_subject)
            db.flush() # Get ID

            # 4. Copy Strands, Substrands, and Lessons
            total_lessons = 0
            
            for t_strand in template.strands:
                new_strand = Strand(
                    subject_id=new_subject.id,
                    strand_code=t_strand.strand_number,
                    strand_name=t_strand.strand_name,
                    sequence_order=int(t_strand.strand_number) if t_strand.strand_number.isdigit() else 0
                )
                db.add(new_strand)
                db.flush()

                for t_substrand in t_strand.substrands:
                    # Handle key_inquiry_questions conversion
                    key_inquiry_questions_text = None
                    if t_substrand.key_inquiry_questions:
                        if isinstance(t_substrand.key_inquiry_questions, (list, dict)):
                            key_inquiry_questions_text = json.dumps(t_substrand.key_inquiry_questions)
                        else:
                            key_inquiry_questions_text = str(t_substrand.key_inquiry_questions)

                    new_substrand = SubStrand(
                        strand_id=new_strand.id,
                        substrand_code=t_substrand.substrand_number,
                        substrand_name=t_substrand.substrand_name,
                        lessons_count=t_substrand.number_of_lessons,
                        specific_learning_outcomes=t_substrand.specific_learning_outcomes,
                        key_inquiry_questions=key_inquiry_questions_text,
                        suggested_learning_experiences=t_substrand.suggested_learning_experiences,
                        core_competencies=t_substrand.core_competencies,
                        values=t_substrand.values,
                        pcis=t_substrand.pcis,
                        links_to_other_subjects=t_substrand.links_to_other_subjects,
                        sequence_order=int(t_substrand.substrand_number.split('.')[-1]) if '.' in t_substrand.substrand_number else 0
                    )
                    db.add(new_substrand)
                    db.flush()

                    # Create Placeholder Lessons
                    for i in range(1, t_substrand.number_of_lessons + 1):
                        new_lesson = Lesson(
                            substrand_id=new_substrand.id,
                            lesson_number=i,
                            lesson_title=f"Lesson {i}: {t_substrand.substrand_name}",
                            sequence_order=i,
                            duration_minutes=40 # Default
                        )
                        db.add(new_lesson)
                        total_lessons += 1
            
            new_subject.total_lessons = total_lessons
            db.commit()
            results["success"].append({"id": template_id, "subject": template.subject})
            
        except Exception as e:
            db.rollback()
            results["failed"].append({"id": template_id, "subject": template.subject, "reason": str(e)})

    return {
        "message": f"Processed {len(request.template_ids)} templates",
        "results": results
    }

@router.post("/curriculum-templates/{template_id}/use")
async def use_curriculum_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Fetch the template
    template = db.query(CurriculumTemplate).filter(CurriculumTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Curriculum template not found")

    # 2. Check if user already has this subject
    existing_subject = db.query(Subject).filter(
        Subject.user_id == current_user.id,
        Subject.subject_name == template.subject,
        Subject.grade == template.grade
    ).first()

    if existing_subject:
        raise HTTPException(status_code=400, detail=f"You already have {template.subject} for {template.grade}")

    # Check subscription limits
    subject_count = db.query(Subject).filter(Subject.user_id == current_user.id).count()
    sub_type = current_user.subscription_type or SubscriptionType.FREE
    
    if sub_type == SubscriptionType.FREE and subject_count >= 2:
        raise HTTPException(status_code=403, detail="Free plan is limited to 2 subjects. Please upgrade to add more.")
    elif sub_type == SubscriptionType.INDIVIDUAL_BASIC and subject_count >= 6:
        raise HTTPException(status_code=403, detail="Basic plan is limited to 6 subjects. Please upgrade to Premium for unlimited subjects.")

    # 3. Create the Subject
    new_subject = Subject(
        user_id=current_user.id,
        template_id=template.id,
        subject_name=template.subject,
        grade=template.grade,
        total_lessons=0, # Will calculate
        lessons_completed=0,
        progress_percentage=0.0
    )
    db.add(new_subject)
    db.flush() # Get ID

    total_lessons_count = 0

    # 4. Copy Strands and SubStrands
    for t_strand in template.strands:
        new_strand = Strand(
            subject_id=new_subject.id,
            strand_code=t_strand.strand_number,
            strand_name=t_strand.strand_name,
            sequence_order=int(t_strand.strand_number) if t_strand.strand_number.isdigit() else 0
        )
        db.add(new_strand)
        db.flush()

        for t_substrand in t_strand.substrands:
            # Handle key_inquiry_questions conversion from JSON (Template) to Text (SubStrand)
            key_inquiry_questions_text = None
            if t_substrand.key_inquiry_questions:
                if isinstance(t_substrand.key_inquiry_questions, (list, dict)):
                    key_inquiry_questions_text = json.dumps(t_substrand.key_inquiry_questions)
                else:
                    key_inquiry_questions_text = str(t_substrand.key_inquiry_questions)

            new_substrand = SubStrand(
                strand_id=new_strand.id,
                substrand_code=t_substrand.substrand_number,
                substrand_name=t_substrand.substrand_name,
                lessons_count=t_substrand.number_of_lessons,
                specific_learning_outcomes=t_substrand.specific_learning_outcomes,
                suggested_learning_experiences=t_substrand.suggested_learning_experiences,
                key_inquiry_questions=key_inquiry_questions_text,
                core_competencies=t_substrand.core_competencies,
                values=t_substrand.values,
                pcis=t_substrand.pcis,
                links_to_other_subjects=t_substrand.links_to_other_subjects,
                sequence_order=int(t_substrand.substrand_number.split('.')[-1]) if '.' in t_substrand.substrand_number else 0
            )
            db.add(new_substrand)
            db.flush()

            # 5. Create Placeholder Lessons
            # Since templates don't have individual lessons, we create placeholders based on count
            for i in range(1, t_substrand.number_of_lessons + 1):
                new_lesson = Lesson(
                    substrand_id=new_substrand.id,
                    lesson_number=i,
                    lesson_title=f"Lesson {i}: {t_substrand.substrand_name}",
                    sequence_order=i,
                    duration_minutes=40 # Default
                )
                db.add(new_lesson)
                total_lessons_count += 1

    # Update total lessons
    new_subject.total_lessons = total_lessons_count
    db.commit()

    return {"message": f"Successfully added {template.subject} ({template.grade}) to your subjects"}

# Cascading Dropdowns

@router.get("/education-levels")
async def get_education_levels(db: Session = Depends(get_db)):
    # Return distinct education levels from subjects or templates
    # Or hardcoded list
    return ["Pre-Primary", "Primary", "Junior Secondary", "Senior Secondary"]

@router.get("/grades")
async def get_grades_by_education_level(
    education_level: str = None,
    db: Session = Depends(get_db)
):
    # Return grades based on level
    if education_level == "Junior Secondary":
        return ["Grade 7", "Grade 8", "Grade 9"]
    # ... add others
    return []

@router.get("/subjects-by-grade")
async def get_subjects_by_grade(
    grade: str = None,
    education_level: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Subject)
    if grade:
        query = query.filter(Subject.grade == grade)
    if education_level:
        query = query.filter(Subject.education_level == education_level)
    return query.all()
