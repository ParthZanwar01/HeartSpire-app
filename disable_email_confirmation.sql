-- Disable email confirmation requirement
-- Run this in your Supabase SQL Editor

-- Disable email confirmations
UPDATE auth.config 
SET enable_email_confirmations = false;

-- Verify the setting was updated
SELECT enable_email_confirmations 
FROM auth.config;
