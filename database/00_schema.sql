-- TeachTrack CBC Database Schema
-- Drop existing tables if they exist
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS progress_log;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS sub_strands;
DROP TABLE IF EXISTS strands;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    school VARCHAR(255),
    grade_level VARCHAR(50),
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    auth_provider VARCHAR(50) DEFAULT 'local',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_verification_token (verification_token),
    INDEX idx_google_id (google_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subjects table
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    curriculum_pdf_url VARCHAR(500),
    current_strand_id INT,
    current_substrand_id INT,
    total_lessons INT DEFAULT 0,
    lessons_completed INT DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_subject_grade (subject_name, grade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Strands table (main curriculum sections)
CREATE TABLE strands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    strand_code VARCHAR(50) NOT NULL,
    strand_name VARCHAR(255) NOT NULL,
    description TEXT,
    sequence_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    INDEX idx_subject_id (subject_id),
    INDEX idx_sequence (subject_id, sequence_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sub-strands table (subsections within strands)
CREATE TABLE sub_strands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    strand_id INT NOT NULL,
    substrand_code VARCHAR(50) NOT NULL,
    substrand_name VARCHAR(255) NOT NULL,
    description TEXT,
    lessons_count INT DEFAULT 0,
    learning_outcomes TEXT,
    key_inquiry_questions TEXT,
    sequence_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (strand_id) REFERENCES strands(id) ON DELETE CASCADE,
    INDEX idx_strand_id (strand_id),
    INDEX idx_sequence (strand_id, sequence_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lessons table (individual lessons within sub-strands)
CREATE TABLE lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    substrand_id INT NOT NULL,
    lesson_number INT NOT NULL,
    lesson_title VARCHAR(255),
    description TEXT,
    duration_minutes INT,
    learning_outcomes TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    sequence_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (substrand_id) REFERENCES sub_strands(id) ON DELETE CASCADE,
    INDEX idx_substrand_id (substrand_id),
    INDEX idx_completed (is_completed, completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Progress log table (tracks lesson completion history)
CREATE TABLE progress_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject_id INT NOT NULL,
    lesson_id INT NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'completed', 'undone', 'skipped'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    INDEX idx_user_subject (user_id, subject_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notes table (teaching materials and resources)
CREATE TABLE notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject_id INT NOT NULL,
    strand_id INT,
    substrand_id INT,
    lesson_id INT,
    title VARCHAR(255) NOT NULL,
    file_type VARCHAR(50), -- 'pdf', 'pptx', 'docx', 'image', etc.
    file_url VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT,
    thumbnail_url VARCHAR(500),
    tags TEXT, -- JSON array of tags
    description TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    last_viewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (strand_id) REFERENCES strands(id) ON DELETE SET NULL,
    FOREIGN KEY (substrand_id) REFERENCES sub_strands(id) ON DELETE SET NULL,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
    INDEX idx_user_subject (user_id, subject_id),
    INDEX idx_file_type (file_type),
    INDEX idx_is_favorite (is_favorite),
    FULLTEXT idx_title_description (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample user for testing
INSERT INTO users (email, password_hash, full_name, phone, school, grade_level, email_verified) 
VALUES (
    'demo@teachtrack.com', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5cXYqBSkeB9um', -- password: password123
    'Demo Teacher', 
    '0712345678', 
    'Demo School', 
    'Grade 7', 
    TRUE
);
