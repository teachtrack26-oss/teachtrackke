-- School Settings Tables Migration
-- Add comprehensive school configuration functionality

-- School Settings Table
CREATE TABLE IF NOT EXISTS school_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    school_name VARCHAR(255) NOT NULL,
    school_email VARCHAR(255) NOT NULL,
    school_phone VARCHAR(50),
    school_address TEXT,
    school_type VARCHAR(50),
    school_motto VARCHAR(500),
    school_logo_url VARCHAR(500),
    principal_name VARCHAR(255),
    deputy_principal_name VARCHAR(255),
    county VARCHAR(100),
    sub_county VARCHAR(100),
    established_year INT,
    grades_offered JSON,
    streams_per_grade JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- School Terms Table
CREATE TABLE IF NOT EXISTS school_terms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    school_settings_id INT,
    term_number INT NOT NULL,
    year INT NOT NULL,
    start_date VARCHAR(50) NOT NULL,
    end_date VARCHAR(50) NOT NULL,
    mid_term_break_start VARCHAR(50),
    mid_term_break_end VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_settings_id) REFERENCES school_settings(id) ON DELETE CASCADE,
    INDEX idx_term_year (year, term_number)
);

-- Calendar Activities Table
CREATE TABLE IF NOT EXISTS calendar_activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    school_settings_id INT,
    term_id INT NOT NULL,
    activity_name VARCHAR(255) NOT NULL,
    activity_date VARCHAR(50) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_settings_id) REFERENCES school_settings(id) ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES school_terms(id) ON DELETE CASCADE,
    INDEX idx_activity_date (activity_date),
    INDEX idx_activity_type (activity_type)
);

-- Sample data for testing (optional)
-- You can remove this section in production

-- INSERT INTO school_settings (
--     school_name,
--     school_email,
--     school_phone,
--     school_address,
--     school_type,
--     school_motto,
--     principal_name,
--     county,
--     sub_county,
--     established_year,
--     grades_offered,
--     streams_per_grade
-- ) VALUES (
--     'Sample Primary School',
--     'info@sampleprimary.ac.ke',
--     '+254 700 000000',
--     'P.O. Box 123, Nairobi',
--     'Public',
--     'Excellence in Education',
--     'John Kamau',
--     'Nairobi',
--     'Westlands',
--     2005,
--     '["PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"]',
--     '{"Grade 1": ["East", "West"], "Grade 2": ["East", "West"], "Grade 3": ["A", "B"]}'
-- );
