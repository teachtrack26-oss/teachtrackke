-- Add Google OAuth support to users table
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) UNIQUE,
ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'local',
MODIFY COLUMN password_hash VARCHAR(255) NULL,
ADD INDEX idx_google_id (google_id);

-- Update existing users to have 'local' auth provider
UPDATE users SET auth_provider = 'local' WHERE auth_provider IS NULL;