from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, Text, DECIMAL, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.mysql import JSON
from database import Base

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
    email_verified = Column(Boolean, default=False)
    verification_token = Column(String(255), index=True)
    google_id = Column(String(255), unique=True, nullable=True, index=True)  # For Google OAuth
    auth_provider = Column(String(50), default="local")  # local, google, etc.
    is_admin = Column(Boolean, default=False)  # Admin role flag
    
    # School settings
    default_lesson_duration = Column(Integer, default=40)  # Default lesson duration in minutes
    default_double_lesson_duration = Column(Integer, default=80)  # Default double lesson duration
    
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    subjects = relationship("Subject", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    progress_logs = relationship("ProgressLog", back_populates="user", cascade="all, delete-orphan")
    terms = relationship("Term", back_populates="user", cascade="all, delete-orphan")

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
