-- Fix Row Level Security policies for user_profiles table
-- Run this in your Supabase SQL Editor

-- First, let's check the current policies
-- SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create new, more permissive policies
-- Allow users to insert their own profile (with proper auth check)
CREATE POLICY "Users can insert own profile" ON user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Also create a policy for UPSERT operations (which is what we're using)
CREATE POLICY "Users can upsert own profile" ON user_profiles 
FOR ALL 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_profiles';
