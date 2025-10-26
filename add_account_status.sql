-- Add account_status column to user_profiles table
-- Run this in your Supabase SQL Editor

-- Add account_status column
ALTER TABLE user_profiles 
ADD COLUMN account_status TEXT NOT NULL DEFAULT 'pending' 
CHECK (account_status IN ('pending', 'active'));

-- Add comment to explain the purpose
COMMENT ON COLUMN user_profiles.account_status IS 'Account status: pending (incomplete profile) or active (complete profile)';

-- Update existing users to have 'active' status (assuming they have complete profiles)
UPDATE user_profiles 
SET account_status = 'active' 
WHERE account_status = 'pending' 
AND name IS NOT NULL 
AND name != '';

-- Verify the column was added
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name = 'account_status';
