from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from database import get_db
from models import User, UserRole, Subject, Strand, SubStrand, Lesson, SubscriptionType
from schemas import SubjectCreate, SubjectResponse
from dependencies import get_current_user
from config import settings

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}/subjects",
    tags=["Subjects"]
)

@router.get("", response_model=List[SubjectResponse])
def get_subjects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # If user is School Admin, they can see all subjects for their school
    if current_user.role in [UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN] and current_user.school_id:
        return db.query(Subject).join(User).filter(User.school_id == current_user.school_id).all()

    # Filter by current user
    return db.query(Subject).filter(Subject.user_id == current_user.id).all()

@router.get("/{subject_id}")
def get_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subject = db.query(Subject).options(
        joinedload(Subject.strands).joinedload(Strand.sub_strands)
    ).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Build the response with strands and sub_strands
    result = {
        "id": subject.id,
        "subject_name": subject.subject_name,
        "grade": subject.grade,
        "total_lessons": subject.total_lessons,
        "lessons_completed": subject.lessons_completed,
        "progress_percentage": float(subject.progress_percentage) if subject.progress_percentage else 0,
        "strands": []
    }
    
    for strand in sorted(subject.strands, key=lambda s: s.sequence_order):
        strand_data = {
            "id": strand.id,
            "strand_code": strand.strand_code,
            "strand_name": strand.strand_name,
            "sequence_order": strand.sequence_order,
            "sub_strands": []
        }
        
        for sub in sorted(strand.sub_strands, key=lambda s: s.sequence_order):
            sub_data = {
                "id": sub.id,
                "substrand_code": sub.substrand_code,
                "substrand_name": sub.substrand_name,
                "lessons_count": sub.lessons_count,
                "learning_outcomes": sub.learning_outcomes,
                "key_inquiry_questions": sub.key_inquiry_questions,
                "specific_learning_outcomes": sub.specific_learning_outcomes or [],
                "suggested_learning_experiences": sub.suggested_learning_experiences or [],
                "core_competencies": sub.core_competencies or [],
                "values": sub.values or [],
                "pcis": sub.pcis or [],
                "links_to_other_subjects": sub.links_to_other_subjects or [],
                "sequence_order": sub.sequence_order
            }
            strand_data["sub_strands"].append(sub_data)
        
        result["strands"].append(strand_data)
    
    return result

@router.get("/{subject_id}/strands")
def get_subject_strands(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    strands = db.query(Strand).filter(Strand.subject_id == subject_id).options(
        joinedload(Strand.sub_strands)
    ).all()
    return strands

@router.get("/{subject_id}/lessons")
def get_subject_lessons(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get lessons through strands -> substrands
    # Or if Lesson has subject_id directly (it usually does in this schema)
    # Checking models... Lesson usually linked to SubStrand.
    # But main.py had a direct query or join.
    
    # Let's use the join approach from main.py logic
    # db.query(Lesson).join(SubStrand).join(Strand).filter(Strand.subject_id == subject_id).all()
    
    lessons = (
        db.query(Lesson)
        .join(Lesson.substrand)
        .join(Strand)
        .filter(Strand.subject_id == subject_id)
        .all()
    )
    return lessons

@router.post("", response_model=SubjectResponse)
def create_subject(
    subject_data: SubjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check subscription limits
    subject_count = db.query(Subject).filter(Subject.user_id == current_user.id).count()
    
    # Default to FREE if no subscription type
    sub_type = current_user.subscription_type or SubscriptionType.FREE
    
    if sub_type == SubscriptionType.FREE:
        if subject_count >= 2:
            raise HTTPException(
                status_code=403, 
                detail="Free plan is limited to 2 subjects. Please upgrade to add more."
            )
    elif sub_type == SubscriptionType.INDIVIDUAL_BASIC:
        if subject_count >= 6:
            raise HTTPException(
                status_code=403, 
                detail="Basic plan is limited to 6 subjects. Please upgrade to Premium for unlimited subjects."
            )

    # Create subject for current user
    subject = Subject(user_id=current_user.id, **subject_data.dict())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject

@router.delete("/{subject_id}")
def delete_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    db.delete(subject)
    db.commit()
    return {"message": "Subject deleted"}
