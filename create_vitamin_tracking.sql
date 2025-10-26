-- Create vitamin intake tracking system
-- Run this in your Supabase SQL Editor

-- Create vitamin_intake_logs table to track each vitamin intake
CREATE TABLE vitamin_intake_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  vitamin_name TEXT NOT NULL,
  vitamin_type TEXT, -- e.g., 'pill', 'gummy', 'liquid', 'powder'
  dosage TEXT, -- e.g., '100mg', '1 tablet', '2 gummies'
  intake_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  intake_time TIME, -- specific time of day taken
  notes TEXT, -- optional notes about the intake
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_vitamin_intake_logs_user_id ON vitamin_intake_logs(user_id);
CREATE INDEX idx_vitamin_intake_logs_vitamin_name ON vitamin_intake_logs(vitamin_name);
CREATE INDEX idx_vitamin_intake_logs_intake_date ON vitamin_intake_logs(intake_date);

-- Create a view for daily vitamin intake summary
CREATE VIEW daily_vitamin_summary AS
SELECT 
  user_id,
  vitamin_name,
  DATE(intake_date) as intake_date,
  COUNT(*) as times_taken,
  STRING_AGG(dosage, ', ') as dosages_taken,
  STRING_AGG(notes, '; ') as notes_summary
FROM vitamin_intake_logs
GROUP BY user_id, vitamin_name, DATE(intake_date)
ORDER BY intake_date DESC;

-- Create a view for weekly/monthly statistics
CREATE VIEW vitamin_intake_stats AS
SELECT 
  user_id,
  vitamin_name,
  DATE_TRUNC('week', intake_date) as week_start,
  DATE_TRUNC('month', intake_date) as month_start,
  COUNT(*) as total_intakes,
  COUNT(DISTINCT DATE(intake_date)) as days_taken,
  ROUND(COUNT(DISTINCT DATE(intake_date))::numeric / 
        GREATEST(EXTRACT(DAY FROM (CURRENT_DATE - DATE_TRUNC('week', intake_date))), 1) * 100, 2) as weekly_compliance_percentage,
  ROUND(COUNT(DISTINCT DATE(intake_date))::numeric / 
        GREATEST(EXTRACT(DAY FROM (CURRENT_DATE - DATE_TRUNC('month', intake_date))), 1) * 100, 2) as monthly_compliance_percentage
FROM vitamin_intake_logs
GROUP BY user_id, vitamin_name, DATE_TRUNC('week', intake_date), DATE_TRUNC('month', intake_date)
ORDER BY week_start DESC, month_start DESC;

-- Add comments
COMMENT ON TABLE vitamin_intake_logs IS 'Tracks each individual vitamin intake event';
COMMENT ON COLUMN vitamin_intake_logs.vitamin_name IS 'Name of the vitamin taken';
COMMENT ON COLUMN vitamin_intake_logs.dosage IS 'Amount/dosage taken';
COMMENT ON COLUMN vitamin_intake_logs.intake_time IS 'Time of day when taken';
COMMENT ON COLUMN vitamin_intake_logs.notes IS 'Optional notes about the intake';

-- Disable RLS for now (can be enabled later for security)
ALTER TABLE vitamin_intake_logs DISABLE ROW LEVEL SECURITY;

-- Verify the table was created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vitamin_intake_logs' 
ORDER BY ordinal_position;
