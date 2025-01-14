-- Update auth settings to allow sign-ups without email confirmation
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
-- Enable sign-ups
UPDATE auth.config
SET enable_signup = true;
-- Disable email confirmation requirement
UPDATE auth.config
SET mailer_autoconfirm = true;