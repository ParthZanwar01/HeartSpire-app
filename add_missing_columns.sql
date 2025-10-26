-- Add missing columns to user_profiles table
-- Run this in your Supabase SQL Editor

-- Add all the missing columns that are in the UserProfile interface
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS age TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS weight TEXT,
ADD COLUMN IF NOT EXISTS due_date TEXT,
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'pending';

-- Add constraints for account_status (drop first if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_account_status') THEN
        ALTER TABLE user_profiles DROP CONSTRAINT check_account_status;
    END IF;
END $$;

ALTER TABLE user_profiles 
ADD CONSTRAINT check_account_status 
CHECK (account_status IN ('pending', 'active'));

-- Add comments to explain the purpose of each field
COMMENT ON COLUMN user_profiles.age IS 'User age for age-appropriate recommendations';
COMMENT ON COLUMN user_profiles.gender IS 'User gender for personalized health guidance';
COMMENT ON COLUMN user_profiles.weight IS 'User weight for dosage calculations';
COMMENT ON COLUMN user_profiles.due_date IS 'Estimated due date for pregnancy tracking';
COMMENT ON COLUMN user_profiles.account_status IS 'Account status: pending (incomplete profile) or active (complete profile)';

-- Update existing users to have 'active' status if they have complete profiles
UPDATE user_profiles 
SET account_status = 'active' 
WHERE account_status IS NULL 
AND name IS NOT NULL 
AND name != '';

-- Verify all columns exist
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;
