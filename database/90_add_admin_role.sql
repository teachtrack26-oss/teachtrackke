-- Add is_admin column to users table (MySQL 8.0 compatible check)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = 'teachtrack' 
                   AND TABLE_NAME = 'users' 
                   AND COLUMN_NAME = 'is_admin');

SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE AFTER auth_provider', 
              'SELECT "Column is_admin already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Make the first user (demo@teachtrack.com) an admin
UPDATE users SET is_admin = TRUE WHERE email = 'demo@teachtrack.com' LIMIT 1;

-- Or make kevinmugo359@gmail.com an admin
UPDATE users SET is_admin = TRUE WHERE email = 'kevinmugo359@gmail.com' LIMIT 1;
