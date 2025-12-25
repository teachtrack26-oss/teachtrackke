-- Add scheduling configuration to users table (MySQL 8.0 compatible)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = 'teachtrack' 
                   AND TABLE_NAME = 'users' 
                   AND COLUMN_NAME = 'default_lesson_duration');
SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE users ADD COLUMN default_lesson_duration INT DEFAULT 40 COMMENT ''Default lesson duration in minutes''', 
              'SELECT "Column default_lesson_duration already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = 'teachtrack' 
                   AND TABLE_NAME = 'users' 
                   AND COLUMN_NAME = 'default_double_lesson_duration');
SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE users ADD COLUMN default_double_lesson_duration INT DEFAULT 80 COMMENT ''Default double lesson duration in minutes''', 
              'SELECT "Column default_double_lesson_duration already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add scheduling configuration to subjects table (MySQL 8.0 compatible)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = 'teachtrack' 
                   AND TABLE_NAME = 'subjects' 
                   AND COLUMN_NAME = 'lessons_per_week');
SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE subjects ADD COLUMN lessons_per_week INT DEFAULT 5 COMMENT ''Number of lessons per week for this subject''', 
              'SELECT "Column lessons_per_week already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = 'teachtrack' 
                   AND TABLE_NAME = 'subjects' 
                   AND COLUMN_NAME = 'single_lesson_duration');
SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE subjects ADD COLUMN single_lesson_duration INT DEFAULT 40 COMMENT ''Duration of single lesson in minutes''', 
              'SELECT "Column single_lesson_duration already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = 'teachtrack' 
                   AND TABLE_NAME = 'subjects' 
                   AND COLUMN_NAME = 'double_lesson_duration');
SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE subjects ADD COLUMN double_lesson_duration INT DEFAULT 80 COMMENT ''Duration of double lesson in minutes''', 
              'SELECT "Column double_lesson_duration already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = 'teachtrack' 
                   AND TABLE_NAME = 'subjects' 
                   AND COLUMN_NAME = 'double_lessons_per_week');
SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE subjects ADD COLUMN double_lessons_per_week INT DEFAULT 0 COMMENT ''Number of double lessons per week''', 
              'SELECT "Column double_lessons_per_week already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Create terms table
CREATE TABLE IF NOT EXISTS terms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    term_number INT NOT NULL COMMENT '1, 2, or 3',
    term_name VARCHAR(100) NOT NULL COMMENT 'e.g., Term 1, Term 2, Term 3',
    academic_year VARCHAR(20) NOT NULL COMMENT 'e.g., 2024/2025',
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    teaching_weeks INT NOT NULL COMMENT 'Number of teaching weeks in this term',
    is_current BOOLEAN DEFAULT FALSE COMMENT 'Whether this term is currently active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_term (user_id, term_number, academic_year),
    INDEX idx_current_term (user_id, is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default terms for existing users (2024/2025 academic year)
-- Term 1: January - April (14 weeks - longest term)
-- Term 2: May - August (12 weeks)
-- Term 3: September - November (10 weeks - shortest term)

INSERT INTO terms (user_id, term_number, term_name, academic_year, start_date, end_date, teaching_weeks, is_current)
SELECT 
    id as user_id,
    1 as term_number,
    'Term 1' as term_name,
    '2025' as academic_year,
    '2025-01-06 00:00:00' as start_date,
    '2025-04-04 23:59:59' as end_date,
    14 as teaching_weeks,
    TRUE as is_current
FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM terms WHERE terms.user_id = users.id AND term_number = 1 AND academic_year = '2025'
);

INSERT INTO terms (user_id, term_number, term_name, academic_year, start_date, end_date, teaching_weeks, is_current)
SELECT 
    id as user_id,
    2 as term_number,
    'Term 2' as term_name,
    '2025' as academic_year,
    '2025-05-05 00:00:00' as start_date,
    '2025-08-01 23:59:59' as end_date,
    12 as teaching_weeks,
    FALSE as is_current
FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM terms WHERE terms.user_id = users.id AND term_number = 2 AND academic_year = '2025'
);

INSERT INTO terms (user_id, term_number, term_name, academic_year, start_date, end_date, teaching_weeks, is_current)
SELECT 
    id as user_id,
    3 as term_number,
    'Term 3' as term_name,
    '2025' as academic_year,
    '2025-09-01 00:00:00' as start_date,
    '2025-11-21 23:59:59' as end_date,
    10 as teaching_weeks,
    FALSE as is_current
FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM terms WHERE terms.user_id = users.id AND term_number = 3 AND academic_year = '2025'
);
