# Supabase Setup Guide for VitaMom

This guide will help you set up Supabase for user data storage in the VitaMom app.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `vitamom-app`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users
6. Click "Create new project"

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to Settings → API
2. Copy the following values:
   - Project URL
   - Anon public key

## 3. Update Your App Configuration

Open `services/supabase.ts` and replace the placeholder values:

```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your Project URL
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Anon public key
```

## 4. Create Database Tables

In your Supabase dashboard, go to the SQL Editor and run the following SQL to create the required tables:

```sql
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
```

## 5. Set Up Authentication (Optional)

If you want to add user authentication:

1. Go to Authentication → Settings in your Supabase dashboard
2. Configure your authentication providers (email, Google, etc.)
3. Update the app to use Supabase Auth instead of AsyncStorage

## 6. Test Your Setup

1. Run your app: `npm start`
2. Complete the questionnaire
3. Check your Supabase dashboard to see if data is being saved

## 7. Environment Variables (Recommended)

For production, use environment variables instead of hardcoding credentials:

1. Create a `.env` file in your project root:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Update `services/supabase.ts`:
```typescript
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
```

## Troubleshooting

- **Connection issues**: Check your internet connection and Supabase project status
- **Permission errors**: Ensure RLS policies are set up correctly
- **Data not saving**: Check browser console for error messages
- **Authentication issues**: Verify your Supabase credentials are correct

## Next Steps

- Set up real-time subscriptions for live data updates
- Add data backup and recovery procedures
- Implement user data export functionality
- Add analytics and usage tracking
