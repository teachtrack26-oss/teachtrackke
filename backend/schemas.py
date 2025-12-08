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
    tsc_number: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "TEACHER"  # TEACHER or SCHOOL_ADMIN

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuth(BaseModel):
    token: str  # Google ID token from frontend

class UserResponse(UserBase):
    id: int
    email_verified: bool
    is_admin: bool
    role: str
    subscription_type: str
    created_at: datetime
    is_trial_active: bool = False
    trial_days_remaining: int = 0
    has_subjects: bool = False
    
    class Config:
        from_attributes = True
        use_enum_values = True
        use_enum_values = True

# Payment Schemas
class PaymentInitiate(BaseModel):
    phone_number: str
    amount: float
    plan: str # TERMLY or YEARLY

class PaymentResponse(BaseModel):
    checkout_request_id: str
    merchant_request_id: str
    response_code: str
    response_description: str
    customer_message: str

class PaymentStatusResponse(BaseModel):
    status: str
    transaction_code: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[datetime] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[UserResponse] = None

class TokenData(BaseModel):
    email: Optional[str] = None


class AdminSubjectSummary(BaseModel):
    id: int
    subject_name: str
    grade: str
    total_lessons: int
    lessons_completed: int
    progress_percentage: float


class AdminUserSummary(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    # Legacy fields for backward compatibility
    school: Optional[str] = None
    grade_level: Optional[str] = None
    is_admin: Optional[bool] = False
    auth_provider: Optional[str] = None
    # New role-based fields
    role: Optional[str] = None
    subscription_type: Optional[str] = None
    subscription_status: Optional[str] = None
    school_id: Optional[int] = None
    subject_count: Optional[int] = 0
    subjects_count: Optional[int] = 0
    subjects: Optional[List[AdminSubjectSummary]] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminUsersResponse(BaseModel):
    users: List[AdminUserSummary]
    total: int
    page: Optional[int] = 1
    page_size: Optional[int] = 50


class AdminRoleUpdate(BaseModel):
    is_admin: Optional[bool] = None
    role: Optional[str] = None


class BulkDeleteRequest(BaseModel):
    user_ids: List[int]


class ResetProgressRequest(BaseModel):
    subject_id: Optional[int] = None


class TermResponse(BaseModel):
    id: int
    term_number: int
    term_name: str
    academic_year: str
    start_date: datetime
    end_date: datetime
    teaching_weeks: int
    is_current: bool

    class Config:
        from_attributes = True


class TermsResponse(BaseModel):
    terms: List[TermResponse]


class TermUpdate(BaseModel):
    term_name: Optional[str] = None
    academic_year: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    teaching_weeks: Optional[int] = None
    is_current: Optional[bool] = None


class UserSettingsUpdate(BaseModel):
    default_lesson_duration: Optional[int] = None
    default_double_lesson_duration: Optional[int] = None


class UserSettingsResponse(BaseModel):
    default_lesson_duration: int
    default_double_lesson_duration: int

    class Config:
        from_attributes = True

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

class BulkCurriculumUseRequest(BaseModel):
    template_ids: List[int]

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
    label: Optional[str] = None
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
    
    # Textbook References
    textbook_name: Optional[str] = None
    textbook_teacher_guide_pages: Optional[str] = None
    textbook_learner_book_pages: Optional[str] = None
    
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

class SchemeLessonUpdate(BaseModel):
    id: Optional[int] = None
    lesson_number: Optional[int] = None
    strand: Optional[str] = None
    sub_strand: Optional[str] = None
    specific_learning_outcomes: Optional[str] = None
    key_inquiry_questions: Optional[str] = None
    learning_experiences: Optional[str] = None
    learning_resources: Optional[str] = None
    textbook_name: Optional[str] = None
    textbook_teacher_guide_pages: Optional[str] = None
    textbook_learner_book_pages: Optional[str] = None
    assessment_methods: Optional[str] = None
    reflection: Optional[str] = None

class SchemeWeekBase(BaseModel):
    week_number: int

class SchemeWeekCreate(SchemeWeekBase):
    lessons: List[SchemeLessonCreate]

class SchemeWeekUpdate(BaseModel):
    week_number: Optional[int] = None
    lessons: Optional[List[SchemeLessonUpdate]] = None

class SchemeWeekResponse(SchemeWeekBase):
    id: int
    scheme_id: int
    lessons: List[SchemeLessonResponse]
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
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

class SchemeAutoGenerateRequest(BaseModel):
    subject_id: int
    teacher_name: str
    school: str
    term: str
    year: int
    subject: str
    grade: str
    total_weeks: int
    lessons_per_week: int = 5

class SchemeOfWorkUpdate(BaseModel):
    teacher_name: Optional[str] = None
    school: Optional[str] = None
    term: Optional[str] = None
    year: Optional[int] = None
    status: Optional[str] = None
    weeks: Optional[List[SchemeWeekUpdate]] = None

class SchemeOfWorkResponse(SchemeOfWorkBase):
    id: int
    user_id: int
    weeks: List[SchemeWeekResponse]
    is_archived: bool
    share_token: Optional[str] = None
    is_public: bool = False
    notes: Optional[str] = None
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
    is_archived: bool
    share_token: Optional[str] = None
    is_public: bool = False
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
    is_archived: bool
    share_token: Optional[str] = None
    is_public: bool = False
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    lesson_duration_minutes: Optional[int] = None
    
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
    is_archived: bool
    share_token: Optional[str] = None
    is_public: bool = False
    created_at: datetime
    lesson_number: Optional[int] = None
    week_number: Optional[int] = None
    
    class Config:
        from_attributes = True

# ============================================================================
# RECORD OF WORK SCHEMAS
# ============================================================================

class RecordOfWorkEntryBase(BaseModel):
    week_number: int
    strand: Optional[str] = None
    topic: Optional[str] = None
    learning_outcome_a: Optional[str] = None
    learning_outcome_b: Optional[str] = None
    learning_outcome_c: Optional[str] = None
    learning_outcome_d: Optional[str] = None
    reflection: Optional[str] = None
    signature: Optional[str] = None
    date_taught: Optional[datetime] = None
    status: Optional[str] = "pending"

class RecordOfWorkEntryCreate(RecordOfWorkEntryBase):
    pass

class RecordOfWorkEntryUpdate(BaseModel):
    strand: Optional[str] = None
    topic: Optional[str] = None
    learning_outcome_a: Optional[str] = None
    learning_outcome_b: Optional[str] = None
    learning_outcome_c: Optional[str] = None
    learning_outcome_d: Optional[str] = None
    reflection: Optional[str] = None
    signature: Optional[str] = None
    date_taught: Optional[datetime] = None
    status: Optional[str] = None

class RecordOfWorkEntryResponse(RecordOfWorkEntryBase):
    id: int
    record_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class RecordOfWorkBase(BaseModel):
    subject_id: int
    school_name: Optional[str] = None
    teacher_name: Optional[str] = None
    learning_area: Optional[str] = None
    grade: Optional[str] = None
    term: Optional[str] = None
    year: Optional[int] = None

class RecordOfWorkCreate(RecordOfWorkBase):
    entries: List[RecordOfWorkEntryCreate] = []

class RecordOfWorkUpdate(BaseModel):
    school_name: Optional[str] = None
    teacher_name: Optional[str] = None
    term: Optional[str] = None
    year: Optional[int] = None

class RecordOfWorkResponse(RecordOfWorkBase):
    id: int
    user_id: int
    entries: List[RecordOfWorkEntryResponse]
    is_archived: bool
    share_token: Optional[str] = None
    is_public: bool = False
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class RecordOfWorkSummary(BaseModel):
    id: int
    learning_area: str
    grade: str
    term: str
    year: int
    is_archived: bool
    share_token: Optional[str] = None
    is_public: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================================
# SYSTEM ANNOUNCEMENT SCHEMAS
# ============================================================================

class SystemAnnouncementBase(BaseModel):
    title: str
    message: str
    type: str = "info"
    is_active: bool = True
    expires_at: Optional[datetime] = None

class SystemAnnouncementCreate(SystemAnnouncementBase):
    pass

class SystemAnnouncementResponse(SystemAnnouncementBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================================
# SCHOOL SCHEMAS
# ============================================================================

class SchoolCreate(BaseModel):
    name: str
    max_teachers: int
    teacher_counts_by_level: Optional[dict] = {}

class SchoolResponse(BaseModel):
    id: int
    name: str
    admin_id: Optional[int]
    subscription_status: str
    max_teachers: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class TeacherInvite(BaseModel):
    email: EmailStr

class SchoolTeacherResponse(UserBase):
    id: int
    email_verified: bool
    subscription_status: str
    subjects_count: int = 0
    
    class Config:
        from_attributes = True


# ============================================================================
# TEACHER PROFILE SCHEMAS (For Independent Teachers)
# ============================================================================

class TeacherProfileBase(BaseModel):
    """Base schema for teacher profile settings"""
    # School Context
    school_name: Optional[str] = None
    school_address: Optional[str] = None
    school_phone: Optional[str] = None
    school_email: Optional[str] = None
    school_motto: Optional[str] = None
    principal_name: Optional[str] = None
    deputy_principal_name: Optional[str] = None
    county: Optional[str] = None
    sub_county: Optional[str] = None
    school_type: Optional[str] = None
    
    # Teaching Preferences
    default_lessons_per_week: int = 5
    default_lesson_duration: int = 40
    default_double_lesson_duration: int = 80
    default_double_lessons_per_week: int = 0
    
    # Professional Details
    tsc_number: Optional[str] = None
    registration_number: Optional[str] = None
    subjects_taught: Optional[List[str]] = []
    grade_levels_taught: Optional[List[str]] = []
    years_of_experience: Optional[int] = None
    qualifications: Optional[str] = None
    specialization: Optional[str] = None
    
    # Academic Year Settings
    current_academic_year: Optional[str] = None
    default_term_weeks: int = 13
    
    # Grades & Streams
    grades_offered: Optional[List[str]] = []
    streams_per_grade: Optional[dict] = {}

class TeacherProfileCreate(TeacherProfileBase):
    """Schema for creating/updating teacher profile"""
    pass

class TeacherProfileUpdate(TeacherProfileBase):
    """Schema for partial updates"""
    pass

class TeacherProfileResponse(TeacherProfileBase):
    """Schema for teacher profile response"""
    id: int
    user_id: int
    school_logo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TeacherProfileLogoResponse(BaseModel):
    """Response after uploading logo"""
    message: str
    logo_url: str

