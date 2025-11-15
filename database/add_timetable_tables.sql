-- ============================================================================
-- TIMETABLE SYSTEM SCHEMA
-- ============================================================================
-- This creates the complete timetable system with flexible schedule configuration

-- 1. School Schedules Table (stores timing configuration)
CREATE TABLE IF NOT EXISTS school_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    schedule_name VARCHAR(100) NOT NULL,
    
    -- Timing configuration
    school_start_time VARCHAR(10) NOT NULL,
    single_lesson_duration INT NOT NULL DEFAULT 40,
    double_lesson_duration INT NOT NULL DEFAULT 80,
    
    -- Break configuration (all in minutes)
    first_break_duration INT DEFAULT 10,
    second_break_duration INT DEFAULT 30,
    lunch_break_duration INT DEFAULT 60,
    
    -- Session configuration
    lessons_before_first_break INT DEFAULT 2,
    lessons_before_second_break INT DEFAULT 2,
    lessons_before_lunch INT DEFAULT 2,
    lessons_after_lunch INT DEFAULT 2,
    
    school_end_time VARCHAR(10) NOT NULL DEFAULT '16:00',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_schedule (user_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Time Slots Table (automatically calculated based on schedule)
CREATE TABLE IF NOT EXISTS time_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    slot_number INT NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    slot_type VARCHAR(20) NOT NULL DEFAULT 'lesson',
    label VARCHAR(100),
    sequence_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (schedule_id) REFERENCES school_schedules(id) ON DELETE CASCADE,
    INDEX idx_schedule_slot (schedule_id, sequence_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Timetable Entries Table (teacher's actual weekly schedule)
CREATE TABLE IF NOT EXISTS timetable_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    schedule_id INT NOT NULL,
    time_slot_id INT NOT NULL,
    
    -- Subject and class information
    subject_id INT NOT NULL,
    day_of_week INT NOT NULL,
    
    -- Optional: Link to specific curriculum content
    strand_id INT NULL,
    substrand_id INT NULL,
    lesson_id INT NULL,
    
    -- Additional info
    room_number VARCHAR(50),
    grade_section VARCHAR(50),
    notes TEXT,
    
    is_double_lesson BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES school_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (time_slot_id) REFERENCES time_slots(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (strand_id) REFERENCES strands(id) ON DELETE SET NULL,
    FOREIGN KEY (substrand_id) REFERENCES sub_strands(id) ON DELETE SET NULL,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
    
    INDEX idx_user_day (user_id, day_of_week),
    INDEX idx_schedule_day (schedule_id, day_of_week),
    UNIQUE KEY unique_user_time_day (user_id, time_slot_id, day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Example: Create a default schedule for testing
-- INSERT INTO school_schedules (user_id, schedule_name, school_start_time, single_lesson_duration, double_lesson_duration)
-- VALUES (1, 'Default Schedule', '08:00', 40, 80);
