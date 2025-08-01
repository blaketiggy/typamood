-- Create profiles table for user information
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create moodboards table
CREATE TABLE moodboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  canvas_data JSONB,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_public BOOLEAN DEFAULT TRUE
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE moodboards ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Moodboards policies
CREATE POLICY "Anyone can view public moodboards" 
  ON moodboards FOR SELECT 
  USING (is_public = true);

CREATE POLICY "Users can view their own moodboards" 
  ON moodboards FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own moodboards" 
  ON moodboards FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own moodboards" 
  ON moodboards FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own moodboards" 
  ON moodboards FOR DELETE 
  USING (auth.uid() = user_id);

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for moodboards updated_at
CREATE TRIGGER update_moodboards_updated_at
  BEFORE UPDATE ON moodboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_moodboards_slug ON moodboards(slug);
CREATE INDEX idx_moodboards_user_id ON moodboards(user_id);
CREATE INDEX idx_moodboards_public ON moodboards(is_public) WHERE is_public = true;
CREATE INDEX idx_moodboards_created_at ON moodboards(created_at DESC);

-- Insert some sample data (optional)
-- Note: This assumes you have users in your auth.users table
-- You can comment this out if you don't want sample data

-- Example moodboard (you'll need to replace the user_id with an actual user ID)
-- INSERT INTO moodboards (title, slug, description, image_urls, user_id, is_public) VALUES
-- (
--   'Cyber Dreams',
--   'cyber-dreams-abc123',
--   'A futuristic moodboard with neon vibes and retro aesthetics',
--   ARRAY[
--     'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
--     'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
--     'https://images.unsplash.com/photo-1441974231531-c6227db76b6e'
--   ],
--   'your-user-id-here',
--   true
-- );