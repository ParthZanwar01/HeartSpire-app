-- Add reminder settings to user_profiles table
-- Run this in your Supabase SQL Editor

-- Add reminder-related columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_time TEXT DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS reminder_message TEXT,
ADD COLUMN IF NOT EXISTS reminder_trimester_specific BOOLEAN DEFAULT true;

-- Add comments to explain the purpose of each field
COMMENT ON COLUMN user_profiles.reminder_enabled IS 'Whether daily vitamin reminders are enabled';
COMMENT ON COLUMN user_profiles.reminder_time IS 'Time for daily reminders in HH:MM format';
COMMENT ON COLUMN user_profiles.reminder_message IS 'Custom reminder message for the user';
COMMENT ON COLUMN user_profiles.reminder_trimester_specific IS 'Whether to send trimester-specific reminder messages';

-- Create an index on reminder_enabled for quick filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_reminder_enabled ON user_profiles(reminder_enabled);

-- Update existing users to have default reminder settings
UPDATE user_profiles 
SET 
  reminder_enabled = false,
  reminder_time = '09:00',
  reminder_message = 'Don''t forget to take your prenatal vitamins! Your health and your baby''s development depend on it. 💕',
  reminder_trimester_specific = true
WHERE reminder_enabled IS NULL;

-- Verify the changes
SELECT 
  id, 
  name, 
  reminder_enabled, 
  reminder_time, 
  reminder_trimester_specific 
FROM user_profiles 
LIMIT 5;
