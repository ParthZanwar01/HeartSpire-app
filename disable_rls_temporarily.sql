-- Alternative: Temporarily disable RLS for testing
-- Run this in your Supabase SQL Editor if the above doesn't work

-- Temporarily disable RLS on user_profiles table
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- After testing, you can re-enable RLS with:
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
