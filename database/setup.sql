-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_scenarios ENABLE ROW LEVEL SECURITY;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  company VARCHAR(255),
  role VARCHAR(255),
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  share_token VARCHAR(255) UNIQUE,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shared_scenarios table (renamed from shared_links to match queries)
CREATE TABLE IF NOT EXISTS shared_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
  share_token VARCHAR(255) UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT false,
  can_view BOOLEAN DEFAULT true,
  can_copy BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_profiles_updated_at_idx ON user_profiles(updated_at DESC);
CREATE INDEX IF NOT EXISTS scenarios_user_id_idx ON scenarios(user_id);
CREATE INDEX IF NOT EXISTS scenarios_share_token_idx ON scenarios(share_token);
CREATE INDEX IF NOT EXISTS scenarios_updated_at_idx ON scenarios(updated_at DESC);
CREATE INDEX IF NOT EXISTS shared_scenarios_token_idx ON shared_scenarios(share_token);
CREATE INDEX IF NOT EXISTS shared_scenarios_scenario_id_idx ON shared_scenarios(scenario_id);

-- RLS Policies for user_profiles table

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for scenarios table

-- Users can see their own scenarios
CREATE POLICY "Users can view their own scenarios" ON scenarios
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own scenarios
CREATE POLICY "Users can insert their own scenarios" ON scenarios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own scenarios
CREATE POLICY "Users can update their own scenarios" ON scenarios
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own scenarios
CREATE POLICY "Users can delete their own scenarios" ON scenarios
  FOR DELETE USING (auth.uid() = user_id);

-- Public scenarios can be viewed by anyone (for sharing)
CREATE POLICY "Public scenarios are viewable by anyone" ON scenarios
  FOR SELECT USING (is_public = true);

-- RLS Policies for shared_scenarios table

-- Users can view shared links for their scenarios
CREATE POLICY "Users can view shared links for their scenarios" ON shared_scenarios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scenarios 
      WHERE scenarios.id = shared_scenarios.scenario_id 
      AND scenarios.user_id = auth.uid()
    )
  );

-- Users can insert shared links for their scenarios
CREATE POLICY "Users can insert shared links for their scenarios" ON shared_scenarios
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM scenarios 
      WHERE scenarios.id = shared_scenarios.scenario_id 
      AND scenarios.user_id = auth.uid()
    )
  );

-- Users can update shared links for their scenarios
CREATE POLICY "Users can update shared links for their scenarios" ON shared_scenarios
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM scenarios 
      WHERE scenarios.id = shared_scenarios.scenario_id 
      AND scenarios.user_id = auth.uid()
    )
  );

-- Users can delete shared links for their scenarios
CREATE POLICY "Users can delete shared links for their scenarios" ON shared_scenarios
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM scenarios 
      WHERE scenarios.id = shared_scenarios.scenario_id 
      AND scenarios.user_id = auth.uid()
    )
  );

-- Anyone can view shared links (for accessing shared scenarios)
CREATE POLICY "Anyone can view shared links by token" ON shared_scenarios
  FOR SELECT USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenarios_updated_at 
  BEFORE UPDATE ON scenarios 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create a function to increment view count safely
CREATE OR REPLACE FUNCTION increment_view_count(link_token TEXT)
RETURNS void AS $$
BEGIN
  UPDATE shared_scenarios 
  SET view_count = view_count + 1 
  WHERE share_token = link_token;
END;
$$ language 'plpgsql' SECURITY DEFINER;
