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
    is_admin: bool
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
    subject_id: Optional[int] = None
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

# Curriculum Template Schemas
class CurriculumTemplateBase(BaseModel):
    education_level: str
    grade: str
    subject: str
    is_active: bool = True

class CurriculumTemplateCreate(CurriculumTemplateBase):
    pass

class CurriculumTemplateUpdate(BaseModel):
    education_level: Optional[str] = None
    grade: Optional[str] = None
    subject: Optional[str] = None
    is_active: Optional[bool] = None

class CurriculumTemplateResponse(CurriculumTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Presentation Feature Schemas
class NoteAnnotationBase(BaseModel):
    note_id: int
    page_number: int = 1
    drawing_data: dict  # JSON data for drawing paths

class NoteAnnotationCreate(NoteAnnotationBase):
    pass

class NoteAnnotationUpdate(BaseModel):
    drawing_data: dict

class NoteAnnotationResponse(NoteAnnotationBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PresentationSessionCreate(BaseModel):
    note_id: int

class PresentationSessionUpdate(BaseModel):
    duration_seconds: int
    ended_at: Optional[datetime] = None

class PresentationSessionResponse(BaseModel):
    id: int
    note_id: int
    user_id: int
    duration_seconds: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class SpeakerNoteBase(BaseModel):
    note_id: int
    page_number: int = 1
    notes: Optional[str] = None

class SpeakerNoteCreate(SpeakerNoteBase):
    pass

class SpeakerNoteUpdate(BaseModel):
    notes: Optional[str] = None

class SpeakerNoteResponse(SpeakerNoteBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SharedPresentationCreate(BaseModel):
    note_id: int
    expires_in_days: Optional[int] = 7
    allow_download: bool = False

class SharedPresentationResponse(BaseModel):
    id: int
    note_id: int
    user_id: int
    share_token: str
    share_url: str
    expires_at: Optional[datetime] = None
    is_active: bool
    view_count: int
    allow_download: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================================
# TIMETABLE SCHEMAS
# ============================================================================

class SchoolScheduleBase(BaseModel):
    schedule_name: str
    education_level: Optional[str] = None
    school_start_time: str  # e.g., "08:00", "07:50"
    single_lesson_duration: int = 40  # minutes
    double_lesson_duration: int = 80  # minutes
    first_break_duration: int = 10
    second_break_duration: int = 30
    lunch_break_duration: int = 60
    lessons_before_first_break: int = 2
    lessons_before_second_break: int = 2
    lessons_before_lunch: int = 2
    lessons_after_lunch: int = 2
    school_end_time: str = "16:00"

class SchoolScheduleCreate(SchoolScheduleBase):
    pass

class SchoolScheduleUpdate(BaseModel):
    schedule_name: Optional[str] = None
    education_level: Optional[str] = None
    school_start_time: Optional[str] = None
    single_lesson_duration: Optional[int] = None
    double_lesson_duration: Optional[int] = None
    first_break_duration: Optional[int] = None
    second_break_duration: Optional[int] = None
    lunch_break_duration: Optional[int] = None
    lessons_before_first_break: Optional[int] = None
    lessons_before_second_break: Optional[int] = None
    lessons_before_lunch: Optional[int] = None
    lessons_after_lunch: Optional[int] = None
    school_end_time: Optional[str] = None
    is_active: Optional[bool] = None

class SchoolScheduleResponse(SchoolScheduleBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TimeSlotResponse(BaseModel):
    id: int
    schedule_id: int
    slot_number: int
    start_time: str
    end_time: str
    slot_type: str  # lesson, break, lunch
    label: str
    sequence_order: int
    
    class Config:
        from_attributes = True

class TimetableEntryBase(BaseModel):
    subject_id: int
    day_of_week: int  # 1=Monday, 2=Tuesday, ..., 5=Friday
    time_slot_id: int
    strand_id: Optional[int] = None
    substrand_id: Optional[int] = None
    lesson_id: Optional[int] = None
    room_number: Optional[str] = None
    grade_section: Optional[str] = None
    notes: Optional[str] = None
    is_double_lesson: bool = False

class TimetableEntryCreate(TimetableEntryBase):
    pass

class TimetableEntryUpdate(BaseModel):
    subject_id: Optional[int] = None
    day_of_week: Optional[int] = None
    time_slot_id: Optional[int] = None
    strand_id: Optional[int] = None
    substrand_id: Optional[int] = None
    lesson_id: Optional[int] = None
    room_number: Optional[str] = None
    grade_section: Optional[str] = None
    notes: Optional[str] = None
    is_double_lesson: Optional[bool] = None

class TimetableEntryResponse(TimetableEntryBase):
    id: int
    user_id: int
    schedule_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================================
# PROFESSIONAL RECORDS SCHEMAS
# ============================================================================

# Scheme of Work Schemas
class SchemeLessonBase(BaseModel):
    lesson_number: int
    strand: str
    sub_strand: str
    specific_learning_outcomes: str
    key_inquiry_questions: Optional[str] = None
    learning_experiences: str
    learning_resources: Optional[str] = None
    assessment_methods: Optional[str] = None
    reflection: Optional[str] = None

class SchemeLessonCreate(SchemeLessonBase):
    pass

class SchemeLessonResponse(SchemeLessonBase):
    id: int
    week_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SchemeWeekBase(BaseModel):
    week_number: int

class SchemeWeekCreate(SchemeWeekBase):
    lessons: List[SchemeLessonCreate]

class SchemeWeekResponse(SchemeWeekBase):
    id: int
    scheme_id: int
    lessons: List[SchemeLessonResponse]
    created_at: datetime
    
    class Config:
        from_attributes = True

class SchemeOfWorkBase(BaseModel):
    subject_id: int
    teacher_name: str
    school: str
    term: str
    year: int
    subject: str
    grade: str
    total_weeks: int
    total_lessons: int
    status: Optional[str] = "draft"

class SchemeOfWorkCreate(SchemeOfWorkBase):
    weeks: List[SchemeWeekCreate]

class SchemeOfWorkUpdate(BaseModel):
    teacher_name: Optional[str] = None
    school: Optional[str] = None
    term: Optional[str] = None
    year: Optional[int] = None
    status: Optional[str] = None

class SchemeOfWorkResponse(SchemeOfWorkBase):
    id: int
    user_id: int
    weeks: List[SchemeWeekResponse]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SchemeOfWorkSummary(BaseModel):
    id: int
    subject: str
    grade: str
    term: str
    year: int
    total_weeks: int
    total_lessons: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================================
# LESSON PLAN SCHEMAS
# ============================================================================

class LessonPlanBase(BaseModel):
    subject_id: int
    learning_area: str
    grade: str
    date: Optional[str] = None
    time: Optional[str] = None
    roll: Optional[str] = None
    strand_theme_topic: str
    sub_strand_sub_theme_sub_topic: str
    specific_learning_outcomes: str
    key_inquiry_questions: Optional[str] = None
    core_competences: Optional[str] = None
    values_to_be_developed: Optional[str] = None
    pcis_to_be_addressed: Optional[str] = None
    learning_resources: Optional[str] = None
    introduction: Optional[str] = None
    development: Optional[str] = None
    conclusion: Optional[str] = None
    summary: Optional[str] = None
    reflection_self_evaluation: Optional[str] = None
    status: Optional[str] = "pending"

class LessonPlanCreate(LessonPlanBase):
    scheme_lesson_id: Optional[int] = None

class LessonPlanUpdate(BaseModel):
    learning_area: Optional[str] = None
    grade: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    roll: Optional[str] = None
    strand_theme_topic: Optional[str] = None
    sub_strand_sub_theme_sub_topic: Optional[str] = None
    specific_learning_outcomes: Optional[str] = None
    key_inquiry_questions: Optional[str] = None
    core_competences: Optional[str] = None
    values_to_be_developed: Optional[str] = None
    pcis_to_be_addressed: Optional[str] = None
    learning_resources: Optional[str] = None
    introduction: Optional[str] = None
    development: Optional[str] = None
    conclusion: Optional[str] = None
    summary: Optional[str] = None
    reflection_self_evaluation: Optional[str] = None
    status: Optional[str] = None

class LessonPlanResponse(LessonPlanBase):
    id: int
    user_id: int
    scheme_lesson_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class LessonPlanSummary(BaseModel):
    id: int
    learning_area: str
    grade: str
    strand_theme_topic: str
    sub_strand_sub_theme_sub_topic: str
    date: Optional[str] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
