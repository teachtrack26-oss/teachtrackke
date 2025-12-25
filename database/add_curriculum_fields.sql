-- Add additional curriculum fields to sub_strands table
-- These fields store detailed learning information from templates
-- MySQL 8.0 compatible: check column existence before adding

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = 'teachtrack' 
                   AND TABLE_NAME = 'sub_strands' 
                   AND COLUMN_NAME = 'specific_learning_outcomes');
SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE sub_strands ADD COLUMN specific_learning_outcomes JSON COMMENT ''Array of specific learning outcomes for this sub-strand''', 
              'SELECT "Column specific_learning_outcomes already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = 'teachtrack' 
                   AND TABLE_NAME = 'sub_strands' 
                   AND COLUMN_NAME = 'suggested_learning_experiences');
SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE sub_strands ADD COLUMN suggested_learning_experiences JSON COMMENT ''Array of suggested learning activities''', 
              'SELECT "Column suggested_learning_experiences already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = 'teachtrack' 
                   AND TABLE_NAME = 'sub_strands' 
                   AND COLUMN_NAME = 'core_competencies');
SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE sub_strands ADD COLUMN core_competencies JSON COMMENT ''Array of core competencies to be developed''', 
              'SELECT "Column core_competencies already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = 'teachtrack' 
                   AND TABLE_NAME = 'sub_strands' 
                   AND COLUMN_NAME = 'values');
SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE sub_strands ADD COLUMN `values` JSON COMMENT ''Array of values to be developed''', 
              'SELECT "Column values already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = 'teachtrack' 
                   AND TABLE_NAME = 'sub_strands' 
                   AND COLUMN_NAME = 'pcis');
SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE sub_strands ADD COLUMN pcis JSON COMMENT ''Array of Pertinent and Contemporary Issues (PCIs)''', 
              'SELECT "Column pcis already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = 'teachtrack' 
                   AND TABLE_NAME = 'sub_strands' 
                   AND COLUMN_NAME = 'links_to_other_subjects');
SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE sub_strands ADD COLUMN links_to_other_subjects JSON COMMENT ''Array of links to other learning areas''', 
              'SELECT "Column links_to_other_subjects already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
