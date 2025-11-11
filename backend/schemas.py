from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    school: Optional[str] = None
    grade_level: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuth(BaseModel):
    email: EmailStr
    full_name: str
    google_id: str
    provider: str = "google"

class UserResponse(UserBase):
    id: int
    email_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Subject Schemas
class SubjectBase(BaseModel):
    subject_name: str
    grade: str
    curriculum_pdf_url: Optional[str] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: int
    user_id: int
    current_strand_id: Optional[int] = None
    current_substrand_id: Optional[int] = None
    total_lessons: int
    lessons_completed: int
    progress_percentage: float
    created_at: datetime
    
    class Config:
        from_attributes = True

# Strand Schemas
class StrandBase(BaseModel):
    strand_code: str
    strand_name: str
    description: Optional[str] = None
    sequence_order: int

class StrandCreate(StrandBase):
    subject_id: int

class StrandResponse(StrandBase):
    id: int
    subject_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# SubStrand Schemas
class SubStrandBase(BaseModel):
    substrand_code: str
    substrand_name: str
    description: Optional[str] = None
    lessons_count: int = 0
    learning_outcomes: Optional[str] = None
    key_inquiry_questions: Optional[str] = None
    
    # Detailed curriculum fields
    specific_learning_outcomes: Optional[list] = None
    suggested_learning_experiences: Optional[list] = None
    core_competencies: Optional[list] = None
    values: Optional[list] = None
    pcis: Optional[list] = None
    links_to_other_subjects: Optional[list] = None
    
    sequence_order: int

class SubStrandCreate(SubStrandBase):
    strand_id: int

class SubStrandResponse(SubStrandBase):
    id: int
    strand_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Lesson Schemas
class LessonBase(BaseModel):
    lesson_number: int
    lesson_title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    learning_outcomes: Optional[str] = None
    sequence_order: int

class LessonCreate(LessonBase):
    substrand_id: int

class LessonResponse(LessonBase):
    id: int
    substrand_id: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Progress Schemas
class ProgressLogCreate(BaseModel):
    subject_id: int
    lesson_id: int
    action: str  # 'completed', 'undone', 'skipped'
    notes: Optional[str] = None

class ProgressLogResponse(ProgressLogCreate):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Note Schemas
class NoteBase(BaseModel):
    subject_id: int
    strand_id: Optional[int] = None
    substrand_id: Optional[int] = None
    lesson_id: Optional[int] = None
    title: str
    file_type: Optional[str] = None
    file_url: str
    file_size_bytes: Optional[int] = None
    thumbnail_url: Optional[str] = None
    tags: Optional[str] = None
    description: Optional[str] = None
    is_favorite: bool = False

class NoteCreate(NoteBase):
    pass

class NoteResponse(NoteBase):
    id: int
    user_id: int
    view_count: int
    last_viewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
