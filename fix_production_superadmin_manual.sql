-- Fix Production Database - Upgrade User to Super Admin
-- Run these SQL commands directly on the production MySQL database
-- NOTE: Do NOT paste or store DB passwords in repo files.

-- Step 1: Check if user exists
SELECT id, email, full_name, role, is_admin, subscription_type, subscription_status 
FROM users 
WHERE email='kevinmugo359@gmail.com';

-- Step 2: Upgrade user to SUPER_ADMIN
UPDATE users 
SET 
  role = 'SUPER_ADMIN',
  is_admin = 1,
  subscription_type = 'INDIVIDUAL_PREMIUM',
  subscription_status = 'ACTIVE'
WHERE email='kevinmugo359@gmail.com';

-- Step 3: Verify the update
SELECT id, email, full_name, role, is_admin, subscription_type, subscription_status 
FROM users 
WHERE email='kevinmugo359@gmail.com';
