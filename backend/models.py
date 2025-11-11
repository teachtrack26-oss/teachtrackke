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
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    subjects = relationship("Subject", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    progress_logs = relationship("ProgressLog", back_populates="user", cascade="all, delete-orphan")

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

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
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
