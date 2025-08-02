// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-supabase-url'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key'

// Database schema for moodboards
const MOODBOARD_SCHEMA = `
-- Create moodboards table
CREATE TABLE IF NOT EXISTS moodboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  image_url TEXT,
  products JSONB DEFAULT '[]',
  canvas_size JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  public_url TEXT,
  is_public BOOLEAN DEFAULT false
);

-- Create RLS policies
ALTER TABLE moodboards ENABLE ROW LEVEL SECURITY;

-- Users can only see their own moodboards
CREATE POLICY "Users can view own moodboards" ON moodboards
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own moodboards
CREATE POLICY "Users can insert own moodboards" ON moodboards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own moodboards
CREATE POLICY "Users can update own moodboards" ON moodboards
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own moodboards
CREATE POLICY "Users can delete own moodboards" ON moodboards
  FOR DELETE USING (auth.uid() = user_id);

-- Anonymous users can insert moodboards (user_id is null)
CREATE POLICY "Anonymous users can insert moodboards" ON moodboards
  FOR INSERT WITH CHECK (user_id IS NULL);

-- Anonymous users can view their own moodboards (user_id is null)
CREATE POLICY "Anonymous users can view own moodboards" ON moodboards
  FOR SELECT USING (user_id IS NULL);

-- Anonymous users can delete their own moodboards (user_id is null)
CREATE POLICY "Anonymous users can delete own moodboards" ON moodboards
  FOR DELETE USING (user_id IS NULL);

-- Public moodboards can be viewed by everyone
CREATE POLICY "Public moodboards are viewable by everyone" ON moodboards
  FOR SELECT USING (is_public = true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_moodboards_updated_at 
  BEFORE UPDATE ON moodboards 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
`

module.exports = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  MOODBOARD_SCHEMA
} 