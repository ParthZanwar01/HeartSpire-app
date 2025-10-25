-- Enable Authentication in Supabase
-- Run this in your Supabase SQL Editor to enable authentication

-- Enable authentication
UPDATE auth.config SET enable_signup = true;
UPDATE auth.config SET enable_email_confirmations = false; -- Set to true for production
UPDATE auth.config SET enable_phone_confirmations = false;

-- Update user_profiles table to work with auth.users
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
ALTER TABLE user_profiles ALTER COLUMN id TYPE UUID;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies for authenticated users
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Update scan_results policies
DROP POLICY IF EXISTS "Users can view own scan results" ON scan_results;
DROP POLICY IF EXISTS "Users can insert own scan results" ON scan_results;

CREATE POLICY "Users can view own scan results" ON scan_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scan results" ON scan_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Make sure trimester_info is still publicly readable
DROP POLICY IF EXISTS "Trimester info is publicly readable" ON trimester_info;
CREATE POLICY "Trimester info is publicly readable" ON trimester_info FOR SELECT USING (true);
