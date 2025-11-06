-- Team Notices table
CREATE TABLE IF NOT EXISTS team_notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_team_notices_team_id ON team_notices(team_id);
CREATE INDEX IF NOT EXISTS idx_team_notices_created_at ON team_notices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_notices_is_pinned ON team_notices(is_pinned DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE team_notices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_notices
-- Team members can view notices of their teams
CREATE POLICY "Team members can view notices of their teams"
  ON team_notices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.team_id = team_notices.team_id
      AND members.user_id = auth.uid()
    )
  );

-- Team leaders can create notices
CREATE POLICY "Team leaders can create notices"
  ON team_notices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.team_id = team_notices.team_id
      AND members.user_id = auth.uid()
      AND members.role = 'leader'
    )
    AND created_by = auth.uid()
  );

-- Team leaders can update their own notices
CREATE POLICY "Team leaders can update their own notices"
  ON team_notices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.team_id = team_notices.team_id
      AND members.user_id = auth.uid()
      AND members.role = 'leader'
    )
    AND created_by = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.team_id = team_notices.team_id
      AND members.user_id = auth.uid()
      AND members.role = 'leader'
    )
    AND created_by = auth.uid()
  );

-- Team leaders can delete their own notices
CREATE POLICY "Team leaders can delete their own notices"
  ON team_notices FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.team_id = team_notices.team_id
      AND members.user_id = auth.uid()
      AND members.role = 'leader'
    )
    AND created_by = auth.uid()
  );

-- Trigger to auto-update updated_at
CREATE TRIGGER update_team_notices_updated_at
  BEFORE UPDATE ON team_notices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

