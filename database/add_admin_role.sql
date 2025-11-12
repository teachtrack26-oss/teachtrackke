-- Add is_admin column to users table
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE AFTER auth_provider;

-- Make the first user (demo@teachtrack.com) an admin
UPDATE users SET is_admin = TRUE WHERE email = 'demo@teachtrack.com' LIMIT 1;

-- Or make kevinmugo359@gmail.com an admin
UPDATE users SET is_admin = TRUE WHERE email = 'kevinmugo359@gmail.com' LIMIT 1;
