-- Curriculum Templates Schema
-- These are master curriculum templates that teachers copy from

-- Main curriculum template (one per subject + grade)
CREATE TABLE IF NOT EXISTS curriculum_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    subject VARCHAR(100) NOT NULL,
    grade VARCHAR(20) NOT NULL,
    education_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE KEY unique_subject_grade (subject, grade),
    INDEX idx_grade (grade),
    INDEX idx_subject (subject)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Template strands (linked to curriculum_templates)
CREATE TABLE IF NOT EXISTS template_strands (
    id INT PRIMARY KEY AUTO_INCREMENT,
    curriculum_template_id INT NOT NULL,
    strand_number VARCHAR(10) NOT NULL,
    strand_name VARCHAR(200) NOT NULL,
    sequence_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (curriculum_template_id) REFERENCES curriculum_templates(id) ON DELETE CASCADE,
    INDEX idx_template (curriculum_template_id),
    INDEX idx_sequence (sequence_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Template sub-strands (linked to template_strands)
CREATE TABLE IF NOT EXISTS template_substrands (
    id INT PRIMARY KEY AUTO_INCREMENT,
    strand_id INT NOT NULL,
    substrand_number VARCHAR(10) NOT NULL,
    substrand_name VARCHAR(200) NOT NULL,
    number_of_lessons INT NOT NULL DEFAULT 1,
    
    -- Learning content (JSON arrays)
    specific_learning_outcomes JSON,
    suggested_learning_experiences JSON,
    key_inquiry_questions JSON,
    
    -- Supporting content (JSON arrays)
    core_competencies JSON,
    `values` JSON,
    pcis JSON,
    links_to_other_subjects JSON,
    
    sequence_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (strand_id) REFERENCES template_strands(id) ON DELETE CASCADE,
    INDEX idx_strand (strand_id),
    INDEX idx_sequence (sequence_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teacher's curriculum instances (copied from templates)
-- Keep existing 'subjects' table but add template reference
ALTER TABLE subjects 
ADD COLUMN template_id INT NULL AFTER id,
ADD FOREIGN KEY (template_id) REFERENCES curriculum_templates(id) ON DELETE SET NULL;

-- Add index for faster template lookups
CREATE INDEX idx_subjects_template ON subjects(template_id);
