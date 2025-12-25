-- Add Professional Records Tables for Schemes of Work, Lesson Plans, and Records

-- ============================================================================
-- SCHEMES OF WORK
-- ============================================================================

CREATE TABLE IF NOT EXISTS schemes_of_work (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subject_id INT NOT NULL,
    
    -- Header Information
    teacher_name VARCHAR(255) NOT NULL,
    school VARCHAR(255) NOT NULL,
    term VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade VARCHAR(20) NOT NULL,
    stream VARCHAR(50),
    roll VARCHAR(50),
    lesson_duration_minutes INT,
    
    -- Metadata
    total_weeks INT NOT NULL,
    total_lessons INT NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    
    INDEX idx_user_subject (user_id, subject_id),
    INDEX idx_term_year (term, year),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS scheme_weeks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    scheme_id INT NOT NULL,
    week_number INT NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (scheme_id) REFERENCES schemes_of_work(id) ON DELETE CASCADE,
    
    INDEX idx_scheme_week (scheme_id, week_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS scheme_lessons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    week_id INT NOT NULL,
    lesson_number INT NOT NULL,
    
    -- Lesson Content
    strand VARCHAR(255) NOT NULL,
    sub_strand VARCHAR(255) NOT NULL,
    specific_learning_outcomes TEXT NOT NULL,
    key_inquiry_questions TEXT,
    learning_experiences TEXT,
    learning_resources TEXT,

    -- Textbook References
    textbook_name VARCHAR(500),
    textbook_teacher_guide_pages VARCHAR(100),
    textbook_learner_book_pages VARCHAR(100),

    assessment_methods TEXT,
    reflection TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (week_id) REFERENCES scheme_weeks(id) ON DELETE CASCADE,
    
    INDEX idx_week_lesson (week_id, lesson_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- LESSON PLANS
-- ============================================================================

CREATE TABLE IF NOT EXISTS lesson_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subject_id INT NOT NULL,
    scheme_lesson_id INT,
    
    -- Header Information
    teacher_name VARCHAR(255),
    school VARCHAR(255),
    subject VARCHAR(100),
    grade VARCHAR(20) NOT NULL,
    strand VARCHAR(255),
    sub_strand VARCHAR(255),
    
    -- Lesson Details
    lesson_number INT,
    lesson_title VARCHAR(255),
    date_planned VARCHAR(50),
    duration VARCHAR(50),
    class_size INT,
    room_number VARCHAR(50),

    -- New Lesson Plan Fields (CBC format)
    learning_area VARCHAR(255),
    date VARCHAR(50),
    time VARCHAR(50),
    roll VARCHAR(50),
    lesson_duration_minutes INT,
    strand_theme_topic VARCHAR(255),
    sub_strand_sub_theme_sub_topic VARCHAR(255),
    core_competences TEXT,
    values_to_be_developed TEXT,
    pcis_to_be_addressed TEXT,
    introduction TEXT,
    development TEXT,
    conclusion TEXT,
    summary TEXT,
    reflection_self_evaluation TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    share_token VARCHAR(64),
    is_public BOOLEAN DEFAULT FALSE,
    
    -- Learning Content
    specific_learning_outcomes TEXT NOT NULL,
    key_inquiry_questions TEXT,
    learning_experiences TEXT NOT NULL,
    learning_resources TEXT,
    
    -- Lesson Development (Three stages)
    introduction_teacher_activities TEXT,
    introduction_learner_activities TEXT,
    introduction_duration INT,
    
    development_teacher_activities TEXT,
    development_learner_activities TEXT,
    development_duration INT,
    
    conclusion_teacher_activities TEXT,
    conclusion_learner_activities TEXT,
    conclusion_duration INT,
    
    -- Additional Information
    core_competencies TEXT,
    `values` TEXT,
    pcis TEXT,
    links_to_other_subjects TEXT,
    
    -- Assessment
    assessment_rubric JSON,
    
    -- Teacher Reflection (filled after teaching)
    what_went_well TEXT,
    areas_for_improvement TEXT,
    follow_up_actions TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (scheme_lesson_id) REFERENCES scheme_lessons(id) ON DELETE SET NULL,
    
    INDEX idx_user_subject (user_id, subject_id),
    INDEX idx_date (date_planned),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- RECORDS OF WORK COVERED
-- ============================================================================

CREATE TABLE IF NOT EXISTS records_of_work (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subject_id INT NOT NULL,
    lesson_plan_id INT,
    
    -- Basic Information
    subject VARCHAR(100),
    grade VARCHAR(20),
    strand VARCHAR(255),
    sub_strand VARCHAR(255),
    lesson_title VARCHAR(255),
    
    -- Teaching Details
    date_taught VARCHAR(50),
    time_taught VARCHAR(50),
    lessons_covered INT DEFAULT 1,
    attendance INT,
    total_students INT,
    
    -- Content Covered
    topics_covered TEXT,
    learning_outcomes_achieved TEXT,
    
    -- Observations & Notes
    notes TEXT,
    challenges_encountered TEXT,
    remedial_actions TEXT,
    
    -- Follow-up
    absent_students TEXT,
    homework_assigned TEXT,

    -- New Record of Work Header Fields (weekly entries)
    school_name VARCHAR(255),
    teacher_name VARCHAR(255),
    learning_area VARCHAR(255),
    term VARCHAR(50),
    year INT,
    is_archived BOOLEAN DEFAULT FALSE,
    share_token VARCHAR(64),
    is_public BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE SET NULL,
    
    INDEX idx_user_subject (user_id, subject_id),
    INDEX idx_date (date_taught),
    INDEX idx_subject_grade (subject, grade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- RECORD OF WORK ENTRIES (WEEKLY)
-- ============================================================================

CREATE TABLE IF NOT EXISTS record_of_work_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    record_id INT NOT NULL,
    week_number INT NOT NULL,
    strand VARCHAR(255),
    topic VARCHAR(255),
    learning_outcome_a TEXT,
    learning_outcome_b TEXT,
    learning_outcome_c TEXT,
    learning_outcome_d TEXT,
    reflection TEXT,
    signature VARCHAR(100),
    date_taught TIMESTAMP NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (record_id) REFERENCES records_of_work(id) ON DELETE CASCADE,
    INDEX idx_record_week (record_id, week_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
