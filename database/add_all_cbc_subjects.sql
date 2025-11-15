-- Add all CBC learning areas/subjects to curriculum_templates table
-- This populates the database with subjects for all education levels

-- ============================================
-- 1. PRE-PRIMARY (PP1 & PP2) - 5 Activities
-- ============================================

-- PP1
INSERT INTO curriculum_templates (subject, grade, education_level, is_active) VALUES
('Language Activities', 'PP1', 'Pre-Primary', 1),
('Mathematical Activities', 'PP1', 'Pre-Primary', 1),
('Environmental Activities', 'PP1', 'Pre-Primary', 1),
('Psychomotor and Creative Activities', 'PP1', 'Pre-Primary', 1),
('Religious Education Activities', 'PP1', 'Pre-Primary', 1);

-- PP2
INSERT INTO curriculum_templates (subject, grade, education_level, is_active) VALUES
('Language Activities', 'PP2', 'Pre-Primary', 1),
('Mathematical Activities', 'PP2', 'Pre-Primary', 1),
('Environmental Activities', 'PP2', 'Pre-Primary', 1),
('Psychomotor and Creative Activities', 'PP2', 'Pre-Primary', 1),
('Religious Education Activities', 'PP2', 'Pre-Primary', 1);

-- ============================================
-- 2. LOWER PRIMARY (Grade 1, 2, 3) - 6 Learning Areas
-- ============================================

-- Grade 1
INSERT INTO curriculum_templates (subject, grade, education_level, is_active) VALUES
('English Activities', 'Grade 1', 'Lower Primary', 1),
('Kiswahili/Kenyan Sign Language', 'Grade 1', 'Lower Primary', 1),
('Mathematics', 'Grade 1', 'Lower Primary', 1),
('Environmental Activities', 'Grade 1', 'Lower Primary', 1),
('Religious Education (CRE/IRE/HRE)', 'Grade 1', 'Lower Primary', 1),
('Movement and Creative Activities', 'Grade 1', 'Lower Primary', 1);

-- Grade 2
INSERT INTO curriculum_templates (subject, grade, education_level, is_active) VALUES
('English Activities', 'Grade 2', 'Lower Primary', 1),
('Kiswahili/Kenyan Sign Language', 'Grade 2', 'Lower Primary', 1),
('Mathematics', 'Grade 2', 'Lower Primary', 1),
('Environmental Activities', 'Grade 2', 'Lower Primary', 1),
('Religious Education (CRE/IRE/HRE)', 'Grade 2', 'Lower Primary', 1),
('Movement and Creative Activities', 'Grade 2', 'Lower Primary', 1);

-- Grade 3
INSERT INTO curriculum_templates (subject, grade, education_level, is_active) VALUES
('English Activities', 'Grade 3', 'Lower Primary', 1),
('Kiswahili/Kenyan Sign Language', 'Grade 3', 'Lower Primary', 1),
('Mathematics', 'Grade 3', 'Lower Primary', 1),
('Environmental Activities', 'Grade 3', 'Lower Primary', 1),
('Religious Education (CRE/IRE/HRE)', 'Grade 3', 'Lower Primary', 1),
('Movement and Creative Activities', 'Grade 3', 'Lower Primary', 1);

-- ============================================
-- 3. UPPER PRIMARY (Grade 4, 5, 6) - 8 Learning Areas + 4 Foreign Languages
-- ============================================

-- Grade 4
INSERT INTO curriculum_templates (subject, grade, education_level, is_active) VALUES
('English', 'Grade 4', 'Upper Primary', 1),
('Kiswahili/Kenyan Sign Language', 'Grade 4', 'Upper Primary', 1),
('Mathematics', 'Grade 4', 'Upper Primary', 1),
('Religious Education (CRE/IRE/HRE)', 'Grade 4', 'Upper Primary', 1),
('Creative Arts and Sports', 'Grade 4', 'Upper Primary', 1),
('Agriculture and Nutrition', 'Grade 4', 'Upper Primary', 1),
('Science and Technology', 'Grade 4', 'Upper Primary', 1),
('Social Studies', 'Grade 4', 'Upper Primary', 1),
('French', 'Grade 4', 'Upper Primary', 1),
('German', 'Grade 4', 'Upper Primary', 1),
('Arabic', 'Grade 4', 'Upper Primary', 1),
('Mandarin', 'Grade 4', 'Upper Primary', 1);

-- Grade 5
INSERT INTO curriculum_templates (subject, grade, education_level, is_active) VALUES
('English', 'Grade 5', 'Upper Primary', 1),
('Kiswahili/Kenyan Sign Language', 'Grade 5', 'Upper Primary', 1),
('Mathematics', 'Grade 5', 'Upper Primary', 1),
('Religious Education (CRE/IRE/HRE)', 'Grade 5', 'Upper Primary', 1),
('Creative Arts and Sports', 'Grade 5', 'Upper Primary', 1),
('Agriculture and Nutrition', 'Grade 5', 'Upper Primary', 1),
('Science and Technology', 'Grade 5', 'Upper Primary', 1),
('Social Studies', 'Grade 5', 'Upper Primary', 1),
('French', 'Grade 5', 'Upper Primary', 1),
('German', 'Grade 5', 'Upper Primary', 1),
('Arabic', 'Grade 5', 'Upper Primary', 1),
('Mandarin', 'Grade 5', 'Upper Primary', 1);

-- Grade 6
INSERT INTO curriculum_templates (subject, grade, education_level, is_active) VALUES
('English', 'Grade 6', 'Upper Primary', 1),
('Kiswahili/Kenyan Sign Language', 'Grade 6', 'Upper Primary', 1),
('Mathematics', 'Grade 6', 'Upper Primary', 1),
('Religious Education (CRE/IRE/HRE)', 'Grade 6', 'Upper Primary', 1),
('Creative Arts and Sports', 'Grade 6', 'Upper Primary', 1),
('Agriculture and Nutrition', 'Grade 6', 'Upper Primary', 1),
('Science and Technology', 'Grade 6', 'Upper Primary', 1),
('Social Studies', 'Grade 6', 'Upper Primary', 1),
('French', 'Grade 6', 'Upper Primary', 1),
('German', 'Grade 6', 'Upper Primary', 1),
('Arabic', 'Grade 6', 'Upper Primary', 1),
('Mandarin', 'Grade 6', 'Upper Primary', 1);

-- ============================================
-- 4. JUNIOR SECONDARY (Grade 7, 8, 9) - 9 Core Subjects + 4 Foreign Languages
-- ============================================

-- Grade 7
INSERT INTO curriculum_templates (subject, grade, education_level, is_active) VALUES
('English', 'Grade 7', 'Junior Secondary', 1),
('Kiswahili/Kenyan Sign Language', 'Grade 7', 'Junior Secondary', 1),
('Mathematics', 'Grade 7', 'Junior Secondary', 1),
('Integrated Science', 'Grade 7', 'Junior Secondary', 1),
('Health Education', 'Grade 7', 'Junior Secondary', 1),
('Pre-Technical and Pre-Career Education', 'Grade 7', 'Junior Secondary', 1),
('Social Studies', 'Grade 7', 'Junior Secondary', 1),
('Religious Education (CRE/IRE/HRE)', 'Grade 7', 'Junior Secondary', 1),
('Creative Arts and Sports', 'Grade 7', 'Junior Secondary', 1),
('Agriculture and Nutrition', 'Grade 7', 'Junior Secondary', 1),
('French', 'Grade 7', 'Junior Secondary', 1),
('German', 'Grade 7', 'Junior Secondary', 1),
('Arabic', 'Grade 7', 'Junior Secondary', 1),
('Mandarin', 'Grade 7', 'Junior Secondary', 1);

-- Grade 8
INSERT INTO curriculum_templates (subject, grade, education_level, is_active) VALUES
('English', 'Grade 8', 'Junior Secondary', 1),
('Kiswahili/Kenyan Sign Language', 'Grade 8', 'Junior Secondary', 1),
('Mathematics', 'Grade 8', 'Junior Secondary', 1),
('Integrated Science', 'Grade 8', 'Junior Secondary', 1),
('Health Education', 'Grade 8', 'Junior Secondary', 1),
('Pre-Technical and Pre-Career Education', 'Grade 8', 'Junior Secondary', 1),
('Social Studies', 'Grade 8', 'Junior Secondary', 1),
('Religious Education (CRE/IRE/HRE)', 'Grade 8', 'Junior Secondary', 1),
('Creative Arts and Sports', 'Grade 8', 'Junior Secondary', 1),
('Agriculture and Nutrition', 'Grade 8', 'Junior Secondary', 1),
('French', 'Grade 8', 'Junior Secondary', 1),
('German', 'Grade 8', 'Junior Secondary', 1),
('Arabic', 'Grade 8', 'Junior Secondary', 1),
('Mandarin', 'Grade 8', 'Junior Secondary', 1);

-- Grade 9 (Already exists, but adding missing subjects)
INSERT INTO curriculum_templates (subject, grade, education_level, is_active) VALUES
('Health Education', 'Grade 9', 'Junior Secondary', 1),
('Pre-Technical and Pre-Career Education', 'Grade 9', 'Junior Secondary', 1),
('French', 'Grade 9', 'Junior Secondary', 1),
('German', 'Grade 9', 'Junior Secondary', 1),
('Arabic', 'Grade 9', 'Junior Secondary', 1),
('Mandarin', 'Grade 9', 'Junior Secondary', 1);

-- Note: Senior Secondary (Grade 10, 11, 12) will be added later as requested
