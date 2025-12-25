-- Google OAuth support is now part of the base schema.
-- Keep this file idempotent so fresh DB inits don't fail if columns already exist.

-- Ensure existing users have a default auth_provider value.
UPDATE users SET auth_provider = 'local' WHERE auth_provider IS NULL;