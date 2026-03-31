-- Migration: Add user_id to all tables and enable RLS
-- IMPORTANT: Before running this, get Guy's UID from Supabase dashboard → Authentication → Users
-- Replace 'YOUR_GUY_UID_HERE' with the actual UID

-- Add user_id columns
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE revisions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE keyword_analysis ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add indexes
CREATE INDEX IF NOT EXISTS cvs_user_id_idx ON cvs(user_id);
CREATE INDEX IF NOT EXISTS jobs_user_id_idx ON jobs(user_id);
CREATE INDEX IF NOT EXISTS revisions_user_id_idx ON revisions(user_id);
CREATE INDEX IF NOT EXISTS keyword_analysis_user_id_idx ON keyword_analysis(user_id);

-- Enable RLS
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_analysis ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only see/modify their own data
CREATE POLICY "cvs_owner" ON cvs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "jobs_owner" ON jobs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "revisions_owner" ON revisions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "keyword_analysis_owner" ON keyword_analysis FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Assign existing data to Guy (replace 'YOUR_GUY_UID_HERE' with actual UID first!)
UPDATE cvs SET user_id = 'YOUR_GUY_UID_HERE' WHERE user_id IS NULL;
UPDATE jobs SET user_id = 'YOUR_GUY_UID_HERE' WHERE user_id IS NULL;
UPDATE revisions SET user_id = 'YOUR_GUY_UID_HERE' WHERE user_id IS NULL;
UPDATE keyword_analysis SET user_id = 'YOUR_GUY_UID_HERE' WHERE user_id IS NULL;
