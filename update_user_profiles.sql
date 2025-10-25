-- Update user_profiles table to include new health information fields
-- Run this in your Supabase SQL Editor

-- Add new columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS age TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS weight TEXT,
ADD COLUMN IF NOT EXISTS due_date TEXT;

-- Add comments to explain the purpose of each field
COMMENT ON COLUMN user_profiles.age IS 'User age for age-appropriate recommendations';
COMMENT ON COLUMN user_profiles.gender IS 'User gender for personalized health guidance';
COMMENT ON COLUMN user_profiles.weight IS 'User weight for dosage calculations';
COMMENT ON COLUMN user_profiles.due_date IS 'Estimated due date for pregnancy tracking';

-- Update RLS policies to include new fields
-- (The existing policies should already cover all columns, but let's ensure they do)

-- Verify that the policies allow users to access all their profile data
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Optional: Add constraints for data validation
-- ALTER TABLE user_profiles ADD CONSTRAINT check_age_positive CHECK (age IS NULL OR age::integer > 0);
-- ALTER TABLE user_profiles ADD CONSTRAINT check_weight_positive CHECK (weight IS NULL OR weight::numeric > 0);
-- ALTER TABLE user_profiles ADD CONSTRAINT check_gender_valid CHECK (gender IS NULL OR gender IN ('female', 'male', 'non-binary', 'prefer-not-to-say'));

-- Create an index on gender for potential filtering/analytics
CREATE INDEX IF NOT EXISTS idx_user_profiles_gender ON user_profiles(gender);

-- Create an index on trimester for quick filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_trimester ON user_profiles(trimester);
