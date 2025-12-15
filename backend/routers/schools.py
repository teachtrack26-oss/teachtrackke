from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, School, UserRole
from schemas import SchoolCreate, SchoolResponse, TeacherInvite, SchoolTeacherResponse
from dependencies import get_current_user
from config import settings
from email_utils import send_invitation_email
import secrets

router = APIRouter(
    prefix=f"{settings.API_V1_PREFIX}/schools",
    tags=["Schools"]
)

@router.post("", response_model=SchoolResponse)
def create_school(
    school_data: SchoolCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only allow creating a school if user doesn't have one and isn't linked
    if current_user.school_id:
        raise HTTPException(
            status_code=400,
            detail="User is already linked to a school"
        )
    
    # Create school
    school = School(
        name=school_data.name,
        type=school_data.type,
        county=school_data.county,
        sub_county=school_data.sub_county,
        zone=school_data.zone,
        created_by=current_user.id
    )
    db.add(school)
    db.commit()
    db.refresh(school)
    
    # Update user role to SCHOOL_ADMIN and link to school
    current_user.role = UserRole.SCHOOL_ADMIN
    current_user.school_id = school.id
    db.commit()
    
    return school

@router.get("/me", response_model=SchoolResponse)
def get_my_school(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.school_id:
        raise HTTPException(
            status_code=404,
            detail="User is not linked to any school"
        )
    
    school = db.query(School).filter(School.id == current_user.school_id).first()
    return school

@router.post("/teachers", response_model=SchoolTeacherResponse)
async def invite_teacher(
    invite_data: TeacherInvite,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only School Admin can invite
    if current_user.role != UserRole.SCHOOL_ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only School Admins can invite teachers"
        )
    
    # Check if user exists
    existing_user = db.query(User).filter(User.email == invite_data.email).first()
    
    if existing_user:
        if existing_user.school_id:
            raise HTTPException(
                status_code=400,
                detail="User is already linked to a school"
            )
        # Link existing user
        existing_user.school_id = current_user.school_id
        db.commit()
        return SchoolTeacherResponse(
            id=existing_user.id,
            full_name=existing_user.full_name,
            email=existing_user.email,
            role=existing_user.role,
            status="active"
        )
    else:
        # Create placeholder user / invitation
        # For now, we'll just create a user with a random password and email them
        temp_password = secrets.token_urlsafe(8)
        from auth import get_password_hash
        
        new_user = User(
            email=invite_data.email,
            full_name=invite_data.email.split('@')[0], # Placeholder name
            hashed_password=get_password_hash(temp_password),
            role=UserRole.TEACHER,
            school_id=current_user.school_id,
            is_active=True # Or false until they verify
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Send invitation email
        school_name = current_user.school_rel.name if current_user.school_rel else "your school"
        await send_invitation_email(invite_data.email, school_name, temp_password)
        
        return SchoolTeacherResponse(
            id=new_user.id,
            full_name=new_user.full_name,
            email=new_user.email,
            role=new_user.role,
            status="invited"
        )

@router.get("/teachers", response_model=List[SchoolTeacherResponse])
def get_school_teachers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.school_id:
        raise HTTPException(
            status_code=400,
            detail="User is not linked to a school"
        )
    
    teachers = db.query(User).filter(
        User.school_id == current_user.school_id,
        User.id != current_user.id # Exclude self? Maybe include.
    ).all()
    
    return [
        SchoolTeacherResponse(
            id=t.id,
            full_name=t.full_name,
            email=t.email,
            role=t.role,
            status="active" if t.is_active else "inactive"
        ) for t in teachers
    ]

@router.delete("/teachers/{teacher_id}")
def remove_teacher(
    teacher_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.SCHOOL_ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only School Admins can remove teachers"
        )
    
    teacher = db.query(User).filter(
        User.id == teacher_id,
        User.school_id == current_user.school_id
    ).first()
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found in your school")
    
    # Unlink teacher
    teacher.school_id = None
    db.commit()
    
    return {"message": "Teacher removed from school"}
