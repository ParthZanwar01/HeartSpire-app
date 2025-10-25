-- VitaMom Database Setup for https://ppcgjeiamazpujkqdgjm.supabase.co
-- Copy and paste this entire code into your Supabase SQL Editor

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  trimester TEXT NOT NULL CHECK (trimester IN ('first', 'second', 'third', 'not_pregnant')),
  allergies TEXT[] DEFAULT '{}',
  focus_areas TEXT[] DEFAULT '{}',
  dietary_restrictions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trimester information table
CREATE TABLE trimester_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trimester TEXT NOT NULL UNIQUE,
  recommended_vitamins TEXT[] NOT NULL,
  important_nutrients TEXT[] NOT NULL,
  foods_to_avoid TEXT[] NOT NULL,
  foods_to_include TEXT[] NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scan results table
CREATE TABLE scan_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  ingredients JSONB NOT NULL,
  analysis TEXT,
  recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert trimester data
INSERT INTO trimester_info (trimester, recommended_vitamins, important_nutrients, foods_to_avoid, foods_to_include, description) VALUES
('first', ARRAY['Folic Acid', 'Iron', 'Vitamin D', 'B12'], ARRAY['Folate', 'Iron', 'Calcium', 'Protein'], ARRAY['Raw fish', 'Unpasteurized dairy', 'High-mercury fish', 'Excessive caffeine'], ARRAY['Leafy greens', 'Lean proteins', 'Whole grains', 'Citrus fruits'], 'First trimester focuses on neural tube development and preventing birth defects.'),
('second', ARRAY['Iron', 'Vitamin D', 'Calcium', 'Omega-3'], ARRAY['Iron', 'Calcium', 'Protein', 'Omega-3 fatty acids'], ARRAY['Raw fish', 'Unpasteurized dairy', 'High-mercury fish'], ARRAY['Dairy products', 'Fish (low mercury)', 'Nuts and seeds', 'Colorful vegetables'], 'Second trimester focuses on bone development and brain growth.'),
('third', ARRAY['Iron', 'Vitamin D', 'Calcium', 'Vitamin K'], ARRAY['Iron', 'Calcium', 'Protein', 'Vitamin K'], ARRAY['Raw fish', 'Unpasteurized dairy', 'High-mercury fish'], ARRAY['Iron-rich foods', 'Calcium sources', 'Protein', 'Healthy fats'], 'Third trimester prepares for birth and supports final growth spurts.'),
('not_pregnant', ARRAY['Multivitamin', 'Vitamin D', 'B12', 'Iron'], ARRAY['Folate', 'Iron', 'Calcium', 'Protein'], ARRAY['Excessive alcohol', 'High-mercury fish'], ARRAY['Balanced diet', 'Fruits and vegetables', 'Whole grains', 'Lean proteins'], 'General health and wellness focus for preconception or general health.');

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_results ENABLE ROW LEVEL SECURITY;

-- Create policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own scan results" ON scan_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scan results" ON scan_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Make trimester_info publicly readable
CREATE POLICY "Trimester info is publicly readable" ON trimester_info FOR SELECT USING (true);
