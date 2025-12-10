from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, Text, DECIMAL, ForeignKey, BigInteger, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.mysql import JSON
from database import Base
import enum

# ============================================================================
# ENUMS
# ============================================================================

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    SCHOOL_ADMIN = "SCHOOL_ADMIN"
    TEACHER = "TEACHER"

class SubscriptionType(str, enum.Enum):
    FREE = "FREE"
    SCHOOL_SPONSORED = "SCHOOL_SPONSORED"
    INDIVIDUAL_BASIC = "INDIVIDUAL_BASIC"
    INDIVIDUAL_PREMIUM = "INDIVIDUAL_PREMIUM"

class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    PAST_DUE = "PAST_DUE"
    CANCELLED = "CANCELLED"

# ============================================================================
# SCHOOL MODEL
# ============================================================================

class School(Base):
    __tablename__ = "schools"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    subscription_status = Column(SQLEnum(SubscriptionStatus), default=SubscriptionStatus.INACTIVE)
    max_teachers = Column(Integer, default=1)
    teacher_counts_by_level = Column(JSON, default={})  # Stores breakdown like {"Pre-Primary": 2, "Lower Primary": 5}
    
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    admin = relationship("User", foreign_keys=[admin_id], back_populates="managed_school")
    teachers = relationship("User", foreign_keys="[User.school_id]", back_populates="school_rel")

# ============================================================================
# PAYMENT MODELS
# ============================================================================

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    phone_number = Column(String(20), nullable=False)
    transaction_code = Column(String(50), unique=True, nullable=True) # M-Pesa Receipt Number
    checkout_request_id = Column(String(100), unique=True, nullable=False) # For STK Push tracking
    merchant_request_id = Column(String(100), nullable=True)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    description = Column(String(255), nullable=True) # e.g. "Termly Pass Subscription"
    reference = Column(String(100), nullable=True) # Internal reference
    
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="payments")

# ============================================================================
# TEMPLATE MODELS
# ============================================================================

class CurriculumTemplate(Base):
    __tablename__ = 'curriculum_templates'
    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(100), nullable=False)
    grade = Column(String(20), nullable=False)
    education_level = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    strands = relationship("TemplateStrand", back_populates="curriculum_template", cascade="all, delete-orphan")

class TemplateStrand(Base):
    __tablename__ = 'template_strands'
    id = Column(Integer, primary_key=True, index=True)
    curriculum_template_id = Column(Integer, ForeignKey('curriculum_templates.id', ondelete="CASCADE"), nullable=False)
    strand_number = Column(String(10), nullable=False)
    strand_name = Column(String(200), nullable=False)
    sequence_order = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    curriculum_template = relationship("CurriculumTemplate", back_populates="strands")
    substrands = relationship("TemplateSubstrand", back_populates="strand", cascade="all, delete-orphan")

class TemplateSubstrand(Base):
    __tablename__ = 'template_substrands'
    id = Column(Integer, primary_key=True, index=True)
    strand_id = Column(Integer, ForeignKey('template_strands.id', ondelete="CASCADE"), nullable=False)
    substrand_number = Column(String(10), nullable=False)
    substrand_name = Column(String(200), nullable=False)
    number_of_lessons = Column(Integer, nullable=False, default=1)
    
    specific_learning_outcomes = Column(JSON)
    suggested_learning_experiences = Column(JSON)
    key_inquiry_questions = Column(JSON)
    core_competencies = Column(JSON)
    values = Column(JSON)
    pcis = Column(JSON)
    links_to_other_subjects = Column(JSON)
    
    # New fields for Textbook Mapping
    default_textbook_name = Column(String(255), nullable=True)
    default_learner_book_pages = Column(String(100), nullable=True)
    default_teacher_guide_pages = Column(String(100), nullable=True)
    
    sequence_order = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    strand = relationship("TemplateStrand", back_populates="substrands")

# ============================================================================
# USER-FACING MODELS
# ============================================================================

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # Allow null for OAuth users
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20))
    school = Column(String(255))
    grade_level = Column(String(50))
    tsc_number = Column(String(50))  # Teachers Service Commission Number
    email_verified = Column(Boolean, default=False)
    verification_token = Column(String(255), index=True)
    google_id = Column(String(255), unique=True, nullable=True, index=True)  # For Google OAuth
    auth_provider = Column(String(50), default="local")  # local, google, etc.
    is_admin = Column(Boolean, default=False)  # Legacy Admin flag (keep for backward compatibility)
    is_active = Column(Boolean, default=True)  # For banning users
    
    # SaaS Fields
    role = Column(SQLEnum(UserRole), default=UserRole.TEACHER)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="SET NULL"), nullable=True)
    previous_school_id = Column(Integer, ForeignKey("schools.id", ondelete="SET NULL"), nullable=True)  # Track previous school after downgrade
    subscription_type = Column(SQLEnum(SubscriptionType), default=SubscriptionType.INDIVIDUAL_BASIC)
    subscription_status = Column(SQLEnum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE) # Default active for free tier
    
    # For Individual Basic plan limits
    # We'll calculate active_subjects count dynamically, but could store a list if needed.
    # For now, we'll rely on the 'subjects' relationship count.
    
    # School settings
    default_lesson_duration = Column(Integer, default=40)  # Default lesson duration in minutes
    default_double_lesson_duration = Column(Integer, default=80)  # Default double lesson duration
    
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    # Relationships
    subjects = relationship("Subject", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    progress_logs = relationship("ProgressLog", back_populates="user", cascade="all, delete-orphan")
    terms = relationship("Term", back_populates="user", cascade="all, delete-orphan")
    
    # SaaS Relationships
    school_rel = relationship("School", foreign_keys=[school_id], back_populates="teachers")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")

    @property
    def is_trial_active(self):
        """Check if the user is in the 14-day trial period."""
        if self.subscription_type != SubscriptionType.FREE:
            return False  # Paid users are not in "trial" mode (they have full access)
        
        if not self.created_at:
            return False
            
        from datetime import datetime, timedelta
        # Handle potential string format if not converted by ORM
        created = self.created_at
        if isinstance(created, str):
            try:
                created = datetime.fromisoformat(str(created))
            except:
                return False

        trial_end = created + timedelta(days=14)
        return datetime.now() < trial_end

    @property
    def trial_days_remaining(self):
        """Return number of days remaining in trial."""
        if self.subscription_type != SubscriptionType.FREE:
            return 0
            
        if not self.created_at:
            return 0
            
        from datetime import datetime, timedelta
        # Handle potential string format
        created = self.created_at
        if isinstance(created, str):
            try:
                created = datetime.fromisoformat(str(created))
            except:
                return 0

        trial_end = created + timedelta(days=14)
        remaining = trial_end - datetime.now()
        return max(0, remaining.days)

    @property
    def has_subjects(self):
        """Check if user has any subjects."""
        return len(self.subjects) > 0

    @property
    def subject_count(self):
        """Return number of subjects."""
        return len(self.subjects)

    @property
    def subjects_count(self):
        """Alias for subject_count."""
        return len(self.subjects)

    managed_school = relationship("School", foreign_keys="[School.admin_id]", back_populates="admin", uselist=False)
    
    # Teacher Profile (for independent teachers)
    teacher_profile = relationship("TeacherProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    template_id = Column(Integer, ForeignKey("curriculum_templates.id", ondelete="SET NULL"), nullable=True)
    subject_name = Column(String(255), nullable=False)
    grade = Column(String(10), nullable=False)
    curriculum_pdf_url = Column(String(500))
    current_strand_id = Column(Integer)
    current_substrand_id = Column(Integer)
    total_lessons = Column(Integer, default=0)
    lessons_completed = Column(Integer, default=0)
    progress_percentage = Column(DECIMAL(5, 2), default=0.00)
    
    # Scheduling configuration
    lessons_per_week = Column(Integer, default=5)  # Number of lessons per week
    single_lesson_duration = Column(Integer, default=40)  # Duration in minutes
    double_lesson_duration = Column(Integer, default=80)  # Duration for double lessons
    double_lessons_per_week = Column(Integer, default=0)  # Number of double lessons per week
    
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="subjects")
    strands = relationship("Strand", back_populates="subject", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="subject", cascade="all, delete-orphan")
    progress_logs = relationship("ProgressLog", back_populates="subject", cascade="all, delete-orphan")
    # This relationship links a user's subject back to the template it came from
    template = relationship("CurriculumTemplate")

class Strand(Base):
    __tablename__ = "strands"
    
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    strand_code = Column(String(50), nullable=False)
    strand_name = Column(String(255), nullable=False)
    description = Column(Text)
    sequence_order = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    subject = relationship("Subject", back_populates="strands")
    sub_strands = relationship("SubStrand", back_populates="strand", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="strand")

class SubStrand(Base):
    __tablename__ = "sub_strands"
    
    id = Column(Integer, primary_key=True, index=True)
    strand_id = Column(Integer, ForeignKey("strands.id", ondelete="CASCADE"), nullable=False)
    substrand_code = Column(String(50), nullable=False)
    substrand_name = Column(String(255), nullable=False)
    description = Column(Text)
    lessons_count = Column(Integer, default=0)
    learning_outcomes = Column(Text)
    key_inquiry_questions = Column(Text)
    
    # Additional curriculum fields from template
    specific_learning_outcomes = Column(JSON)
    suggested_learning_experiences = Column(JSON)
    core_competencies = Column(JSON)
    values = Column(JSON)
    pcis = Column(JSON)
    links_to_other_subjects = Column(JSON)
    
    sequence_order = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    strand = relationship("Strand", back_populates="sub_strands")
    lessons = relationship("Lesson", back_populates="substrand", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="substrand")

class Lesson(Base):
    __tablename__ = "lessons"
    
    id = Column(Integer, primary_key=True, index=True)
    substrand_id = Column(Integer, ForeignKey("sub_strands.id", ondelete="CASCADE"), nullable=False)
    lesson_number = Column(Integer, nullable=False)
    lesson_title = Column(String(255))
    description = Column(Text)
    duration_minutes = Column(Integer)
    learning_outcomes = Column(Text)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(TIMESTAMP)
    sequence_order = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    substrand = relationship("SubStrand", back_populates="lessons")
    progress_logs = relationship("ProgressLog", back_populates="lesson", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="lesson")

class ProgressLog(Base):
    __tablename__ = "progress_log"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(50), nullable=False)
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="progress_logs")
    subject = relationship("Subject", back_populates="progress_logs")
    lesson = relationship("Lesson", back_populates="progress_logs")

class Term(Base):
    __tablename__ = "terms"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    term_number = Column(Integer, nullable=False)  # 1, 2, or 3
    term_name = Column(String(100), nullable=False)  # e.g., "Term 1", "Term 2", "Term 3"
    academic_year = Column(String(20), nullable=False)  # e.g., "2024/2025"
    start_date = Column(TIMESTAMP, nullable=False)
    end_date = Column(TIMESTAMP, nullable=False)
    teaching_weeks = Column(Integer, nullable=False)  # Number of teaching weeks in this term
    is_current = Column(Boolean, default=False)  # Mark which term is currently active
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="terms")

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    strand_id = Column(Integer, ForeignKey("strands.id", ondelete="SET NULL"))
    substrand_id = Column(Integer, ForeignKey("sub_strands.id", ondelete="SET NULL"))
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="SET NULL"))
    title = Column(String(255), nullable=False)
    file_type = Column(String(50))
    file_url = Column(String(500), nullable=False)
    file_size_bytes = Column(BigInteger)
    thumbnail_url = Column(String(500))
    tags = Column(Text)
    description = Column(Text)
    is_favorite = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    last_viewed_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="notes")
    subject = relationship("Subject", back_populates="notes")
    strand = relationship("Strand", back_populates="notes")
    substrand = relationship("SubStrand", back_populates="notes")
    lesson = relationship("Lesson", back_populates="notes")
    annotations = relationship("NoteAnnotation", back_populates="note", cascade="all, delete-orphan")
    speaker_notes = relationship("SpeakerNote", back_populates="note", cascade="all, delete-orphan")
    presentation_sessions = relationship("PresentationSession", back_populates="note", cascade="all, delete-orphan")
    shared_presentations = relationship("SharedPresentation", back_populates="note", cascade="all, delete-orphan")

# ============================================================================
# PRESENTATION FEATURE MODELS
# ============================================================================

class NoteAnnotation(Base):
    __tablename__ = "note_annotations"
    
    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    page_number = Column(Integer, default=1)
    drawing_data = Column(JSON, nullable=False)  # Stores array of drawing paths
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    note = relationship("Note", back_populates="annotations")
    user = relationship("User")

class PresentationSession(Base):
    __tablename__ = "presentation_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    duration_seconds = Column(Integer, default=0)
    started_at = Column(TIMESTAMP, server_default=func.now())
    ended_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    note = relationship("Note", back_populates="presentation_sessions")
    user = relationship("User")

class SpeakerNote(Base):
    __tablename__ = "speaker_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    page_number = Column(Integer, default=1)
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    note = relationship("Note", back_populates="speaker_notes")
    user = relationship("User")

class SharedPresentation(Base):
    __tablename__ = "shared_presentations"
    
    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    share_token = Column(String(64), unique=True, nullable=False, index=True)
    expires_at = Column(TIMESTAMP, nullable=True)
    is_active = Column(Boolean, default=True)
    view_count = Column(Integer, default=0)
    allow_download = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    note = relationship("Note", back_populates="shared_presentations")
    user = relationship("User")

# ============================================================================
# TIMETABLE MODELS
# ============================================================================

class SchoolSchedule(Base):
    """Stores school-wide schedule settings (start time, lesson duration, breaks)"""
    __tablename__ = "school_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    schedule_name = Column(String(100), nullable=False)  # e.g., "Default Schedule", "Monday-Thursday"
    education_level = Column(String(50))  # e.g., "Pre-Primary", "Lower Primary", "Upper Primary", "Junior Secondary", "Senior Secondary"
    
    # Timing configuration
    school_start_time = Column(String(10), nullable=False)  # e.g., "08:00", "07:50", "08:10", "08:20"
    single_lesson_duration = Column(Integer, nullable=False, default=40)  # in minutes (30, 35, 40)
    double_lesson_duration = Column(Integer, nullable=False, default=80)  # typically 2x single lesson
    
    # Break configuration (all in minutes)
    first_break_duration = Column(Integer, default=10)  # After first 2 lessons (10-15 min)
    second_break_duration = Column(Integer, default=30)  # Tea/snack break (20-40 min)
    lunch_break_duration = Column(Integer, default=60)  # Lunch break (40-120 min)
    
    # Session configuration
    lessons_before_first_break = Column(Integer, default=2)  # Usually 2
    lessons_before_second_break = Column(Integer, default=2)  # Usually 2
    lessons_before_lunch = Column(Integer, default=2)  # Usually 2
    lessons_after_lunch = Column(Integer, default=2)  # Usually 2-3
    
    school_end_time = Column(String(10), nullable=False, default="16:00")  # e.g., "16:00" or "17:00"
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    time_slots = relationship("TimeSlot", back_populates="schedule", cascade="all, delete-orphan")
    timetable_entries = relationship("TimetableEntry", back_populates="schedule", cascade="all, delete-orphan")


class TimeSlot(Base):
    """Represents automatically calculated time slots based on schedule"""
    __tablename__ = "time_slots"
    
    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("school_schedules.id", ondelete="CASCADE"), nullable=False)
    slot_number = Column(Integer, nullable=False)  # 1, 2, 3, 4, etc.
    start_time = Column(String(10), nullable=False)  # e.g., "08:00"
    end_time = Column(String(10), nullable=False)  # e.g., "08:40"
    slot_type = Column(String(20), nullable=False, default="lesson")  # lesson, break, lunch
    label = Column(String(100))  # e.g., "Period 1", "Break", "Lunch"
    sequence_order = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    schedule = relationship("SchoolSchedule", back_populates="time_slots")
    timetable_entries = relationship("TimetableEntry", back_populates="time_slot", cascade="all, delete-orphan")


class TimetableEntry(Base):
    """Teacher's actual timetable - which subject/lesson at which time on which day"""
    __tablename__ = "timetable_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    schedule_id = Column(Integer, ForeignKey("school_schedules.id", ondelete="CASCADE"), nullable=False)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id", ondelete="CASCADE"), nullable=False)
    
    # Subject and class information
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 1=Monday, 2=Tuesday, ..., 5=Friday
    
    # Optional: Link to specific lesson/strand/substrand if tracking curriculum progress
    strand_id = Column(Integer, ForeignKey("strands.id", ondelete="SET NULL"), nullable=True)
    substrand_id = Column(Integer, ForeignKey("sub_strands.id", ondelete="SET NULL"), nullable=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True)
    
    # Additional info
    room_number = Column(String(50))  # Optional: classroom/lab
    grade_section = Column(String(50))  # e.g., "Grade 9A", "Grade 9B"
    notes = Column(Text)  # Teacher notes for this period
    
    is_double_lesson = Column(Boolean, default=False)  # If this is a double lesson
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    schedule = relationship("SchoolSchedule", back_populates="timetable_entries")
    time_slot = relationship("TimeSlot", back_populates="timetable_entries")
    subject = relationship("Subject")
    strand = relationship("Strand")
    substrand = relationship("SubStrand")
    lesson = relationship("Lesson")

# ============================================================================
# SCHOOL SETTINGS MODELS
# ============================================================================

class SchoolSettings(Base):
    __tablename__ = 'school_settings'
    id = Column(Integer, primary_key=True, index=True)
    school_name = Column(String(255), nullable=False)
    school_email = Column(String(255), nullable=False)
    school_phone = Column(String(50))
    school_address = Column(Text)
    school_type = Column(String(50))  # Public, Private, Government, Faith-Based, County
    school_motto = Column(String(500))
    school_logo_url = Column(String(500))
    principal_name = Column(String(255))
    deputy_principal_name = Column(String(255))
    county = Column(String(100))
    sub_county = Column(String(100))
    established_year = Column(Integer)
    grades_offered = Column(JSON)  # Array of grade strings
    streams_per_grade = Column(JSON)  # Object mapping grade to array of stream names
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    terms = relationship("SchoolTerm", back_populates="school_settings", cascade="all, delete-orphan")
    activities = relationship("CalendarActivity", back_populates="school_settings", cascade="all, delete-orphan")

class SchoolTerm(Base):
    __tablename__ = 'school_terms'
    id = Column(Integer, primary_key=True, index=True)
    school_settings_id = Column(Integer, ForeignKey('school_settings.id', ondelete="CASCADE"), nullable=True)
    term_number = Column(Integer, nullable=False)  # 1, 2, or 3
    year = Column(Integer, nullable=False)
    start_date = Column(String(50), nullable=False)  # YYYY-MM-DD
    end_date = Column(String(50), nullable=False)  # YYYY-MM-DD
    mid_term_break_start = Column(String(50))  # Optional
    mid_term_break_end = Column(String(50))  # Optional
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    school_settings = relationship("SchoolSettings", back_populates="terms")
    activities = relationship("CalendarActivity", back_populates="term", cascade="all, delete-orphan")

class CalendarActivity(Base):
    __tablename__ = 'calendar_activities'
    id = Column(Integer, primary_key=True, index=True)
    school_settings_id = Column(Integer, ForeignKey('school_settings.id', ondelete="CASCADE"), nullable=True)
    term_id = Column(Integer, ForeignKey('school_terms.id', ondelete="CASCADE"), nullable=False)
    activity_name = Column(String(255), nullable=False)
    activity_date = Column(String(50), nullable=False)  # YYYY-MM-DD
    activity_type = Column(String(100), nullable=False)  # Opening Day, Closing Day, Exam Week, etc.
    description = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    school_settings = relationship("SchoolSettings", back_populates="activities")
    term = relationship("SchoolTerm", back_populates="activities")


class LessonConfiguration(Base):
    """Global lesson configuration set by admin for each subject/grade combination"""
    __tablename__ = 'lesson_configurations'
    
    id = Column(Integer, primary_key=True, index=True)
    subject_name = Column(String(255), nullable=False)
    grade = Column(String(50), nullable=False)
    education_level = Column(String(100), nullable=True)  # e.g., "Junior Secondary", "Senior Secondary"
    lessons_per_week = Column(Integer, default=5)
    double_lessons_per_week = Column(Integer, default=0)
    single_lesson_duration = Column(Integer, default=40)  # in minutes
    double_lesson_duration = Column(Integer, default=80)  # in minutes
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Unique constraint on subject_name + grade
    __table_args__ = (
        Index('ix_lesson_config_subject_grade', 'subject_name', 'grade', unique=True),
    )


class TeacherLessonConfig(Base):
    """Teacher-specific lesson configuration (for independent teachers)"""
    __tablename__ = 'teacher_lesson_configs'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    subject_name = Column(String(255), nullable=False)
    grade = Column(String(50), nullable=False)
    lessons_per_week = Column(Integer, default=5)
    double_lessons_per_week = Column(Integer, default=0)
    single_lesson_duration = Column(Integer, default=40)  # in minutes
    double_lesson_duration = Column(Integer, default=80)  # in minutes
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    
    # Unique constraint: one config per user + subject + grade
    __table_args__ = (
        Index('ix_teacher_lesson_config_user_subject_grade', 'user_id', 'subject_name', 'grade', unique=True),
    )


class SystemAnnouncement(Base):
    __tablename__ = "system_announcements"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info")  # info, warning, success, error
    is_active = Column(Boolean, default=True)
    expires_at = Column(TIMESTAMP, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    creator = relationship("User")

# ============================================================================
# PROFESSIONAL RECORDS MODELS
# ============================================================================

class SchemeOfWork(Base):
    __tablename__ = 'schemes_of_work'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete="CASCADE"), nullable=False)
    
    # Header Information
    teacher_name = Column(String(255), nullable=False)
    school = Column(String(255), nullable=False)
    term = Column(String(50), nullable=False)  # e.g., "Term 1"
    year = Column(Integer, nullable=False)
    subject = Column(String(100), nullable=False)
    grade = Column(String(20), nullable=False)
    
    # Metadata
    total_weeks = Column(Integer, nullable=False)
    total_lessons = Column(Integer, nullable=False)
    status = Column(String(20), default='draft')  # draft, active, completed
    is_archived = Column(Boolean, default=False)
    
    # Sharing and Notes
    share_token = Column(String(64), unique=True)
    is_public = Column(Boolean, default=False)
    notes = Column(Text)
    
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    subject_rel = relationship("Subject")
    weeks = relationship("SchemeWeek", back_populates="scheme", cascade="all, delete-orphan")

class SchemeWeek(Base):
    __tablename__ = 'scheme_weeks'
    id = Column(Integer, primary_key=True, index=True)
    scheme_id = Column(Integer, ForeignKey('schemes_of_work.id', ondelete="CASCADE"), nullable=False)
    week_number = Column(Integer, nullable=False)
    
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    scheme = relationship("SchemeOfWork", back_populates="weeks")
    lessons = relationship("SchemeLesson", back_populates="week", cascade="all, delete-orphan")

class SchemeLesson(Base):
    __tablename__ = 'scheme_lessons'
    id = Column(Integer, primary_key=True, index=True)
    week_id = Column(Integer, ForeignKey('scheme_weeks.id', ondelete="CASCADE"), nullable=False)
    lesson_number = Column(Integer, nullable=False)  # Lesson number within the week
    
    # Lesson Content
    strand = Column(String(255), nullable=False)
    sub_strand = Column(String(255), nullable=False)
    specific_learning_outcomes = Column(Text, nullable=False)
    key_inquiry_questions = Column(Text)
    learning_experiences = Column(Text, nullable=False)
    learning_resources = Column(Text)
    
    # Textbook References
    textbook_name = Column(String(500))
    textbook_teacher_guide_pages = Column(String(100))
    textbook_learner_book_pages = Column(String(100))
    
    assessment_methods = Column(Text)
    reflection = Column(Text)  # Filled after teaching
    
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    week = relationship("SchemeWeek", back_populates="lessons")

# ============================================================================
# LESSON PLANS
# ============================================================================

class LessonPlan(Base):
    __tablename__ = 'lesson_plans'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete="CASCADE"), nullable=False)
    scheme_lesson_id = Column(Integer, ForeignKey('scheme_lessons.id', ondelete="SET NULL"))
    
    # Header Information
    learning_area = Column(String(255), nullable=False)
    grade = Column(String(20), nullable=False)
    date = Column(String(50))
    time = Column(String(50))
    roll = Column(String(50))
    
    # Lesson Details
    strand_theme_topic = Column(String(255), nullable=False)
    sub_strand_sub_theme_sub_topic = Column(String(255), nullable=False)
    specific_learning_outcomes = Column(Text, nullable=False)
    key_inquiry_questions = Column(Text)
    core_competences = Column(Text)
    values_to_be_developed = Column(Text)
    pcis_to_be_addressed = Column(Text)
    learning_resources = Column(Text)
    
    # Organization of Learning - Lesson Steps
    introduction = Column(Text)
    development = Column(Text)
    conclusion = Column(Text)
    summary = Column(Text)
    
    # Reflection on Lesson/Self-evaluation
    reflection_self_evaluation = Column(Text)
    
    # Status
    status = Column(String(20), default='pending')  # pending, taught, postponed
    is_archived = Column(Boolean, default=False)
    
    # Sharing and Notes
    share_token = Column(String(64), unique=True)
    is_public = Column(Boolean, default=False)
    notes = Column(Text)
    
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    subject_rel = relationship("Subject")
    scheme_lesson = relationship("SchemeLesson")

    @property
    def lesson_number(self):
        if self.scheme_lesson:
            return self.scheme_lesson.lesson_number
        return None

    @property
    def week_number(self):
        if self.scheme_lesson and self.scheme_lesson.week:
            return self.scheme_lesson.week.week_number
        return None

# ============================================================================
# RECORD OF WORK MODELS
# ============================================================================

class RecordOfWork(Base):
    __tablename__ = 'records_of_work'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete="CASCADE"), nullable=False)
    
    # Header Information
    school_name = Column(String(255))
    teacher_name = Column(String(255))
    learning_area = Column(String(255)) # Subject
    grade = Column(String(50))
    term = Column(String(50))
    year = Column(Integer)
    is_archived = Column(Boolean, default=False)
    
    # Sharing and Notes
    share_token = Column(String(64), unique=True)
    is_public = Column(Boolean, default=False)
    notes = Column(Text)
    
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    subject = relationship("Subject")
    entries = relationship("RecordOfWorkEntry", back_populates="record", cascade="all, delete-orphan")

class RecordOfWorkEntry(Base):
    __tablename__ = 'record_of_work_entries'
    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey('records_of_work.id', ondelete="CASCADE"), nullable=False)
    
    week_number = Column(Integer, nullable=False)
    strand = Column(String(255)) # Main curriculum area
    
    # Work Covered Breakdown
    topic = Column(String(255)) # Sub-topic
    learning_outcome_a = Column(Text)
    learning_outcome_b = Column(Text)
    learning_outcome_c = Column(Text)
    learning_outcome_d = Column(Text) # Extra just in case
    
    reflection = Column(Text)
    signature = Column(String(100)) # Teacher's signature or name
    
    # Metadata
    date_taught = Column(TIMESTAMP)
    status = Column(String(20), default='pending') # pending, taught
    
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    record = relationship("RecordOfWork", back_populates="entries")


# ============================================================================
# TEACHER PROFILE MODEL (For Independent Teachers)
# ============================================================================

class TeacherProfile(Base):
    """
    Profile settings for independent teachers (not linked to a school).
    Stores their school context, teaching preferences, and professional details.
    
    Logic:
    - If teacher has school_id (linked to a school) → Use SchoolSettings
    - If teacher has NO school_id (independent) → Use TeacherProfile
    """
    __tablename__ = 'teacher_profiles'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # ========================================
    # School Context (for letterheads/documents)
    # ========================================
    school_name = Column(String(255))
    school_logo_url = Column(String(500))
    school_address = Column(Text)
    school_phone = Column(String(50))
    school_email = Column(String(255))
    school_motto = Column(String(500))
    principal_name = Column(String(255))
    deputy_principal_name = Column(String(255))
    county = Column(String(100))
    sub_county = Column(String(100))
    school_type = Column(String(50))  # Public, Private, Government, Faith-Based, County
    
    # ========================================
    # Teaching Preferences (defaults for new subjects)
    # ========================================
    default_lessons_per_week = Column(Integer, default=5)
    default_lesson_duration = Column(Integer, default=40)  # minutes
    default_double_lesson_duration = Column(Integer, default=80)  # minutes
    default_double_lessons_per_week = Column(Integer, default=0)
    
    # ========================================
    # Professional Details
    # ========================================
    tsc_number = Column(String(50))  # Teachers Service Commission Number
    registration_number = Column(String(50))  # Other registration
    subjects_taught = Column(JSON)  # Array: ["Mathematics", "Science"]
    grade_levels_taught = Column(JSON)  # Array: ["Grade 4", "Grade 5"]
    years_of_experience = Column(Integer)
    qualifications = Column(Text)  # Degrees, certifications
    specialization = Column(String(255))  # e.g., "Special Needs Education"
    
    # ========================================
    # Academic Year Settings
    # ========================================
    current_academic_year = Column(String(20))  # e.g., "2024/2025"
    default_term_weeks = Column(Integer, default=13)  # Teaching weeks per term
    
    # ========================================
    # Grades & Streams Configuration
    # ========================================
    grades_offered = Column(JSON)  # Array: ["Grade 1", "Grade 2", "Grade 3"]
    streams_per_grade = Column(JSON)  # Object: {"Grade 1": ["East", "West"], "Grade 2": ["A", "B"]}
    
    # ========================================
    # Timestamps
    # ========================================
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # ========================================
    # Relationships
    # ========================================
    user = relationship("User", back_populates="teacher_profile")

