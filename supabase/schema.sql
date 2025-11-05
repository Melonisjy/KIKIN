-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, team_id)
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location VARCHAR(255) NOT NULL,
  note TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match participants table
CREATE TABLE IF NOT EXISTS match_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'maybe' CHECK (status IN ('going', 'not_going', 'maybe')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_team_id ON members(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_team_id ON matches(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
CREATE INDEX IF NOT EXISTS idx_match_participants_match_id ON match_participants(match_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_user_id ON match_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);

-- Enable Row Level Security (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Users can view teams they are members of"
  ON teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.team_id = teams.id
      AND members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team leaders can update their teams"
  ON teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.team_id = teams.id
      AND members.user_id = auth.uid()
      AND members.role = 'leader'
    )
  );

-- RLS Policies for members
CREATE POLICY "Users can view members of their teams"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.team_id = members.team_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Team leaders can add members"
  ON members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.team_id = members.team_id
      AND m.user_id = auth.uid()
      AND m.role = 'leader'
    )
  );

CREATE POLICY "Users can update their own membership"
  ON members FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for matches
CREATE POLICY "Team members can view matches of their teams"
  ON matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.team_id = matches.team_id
      AND members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team leaders can create matches"
  ON matches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.team_id = matches.team_id
      AND members.user_id = auth.uid()
      AND members.role = 'leader'
    )
  );

CREATE POLICY "Team leaders can update matches"
  ON matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.team_id = matches.team_id
      AND members.user_id = auth.uid()
      AND members.role = 'leader'
    )
  );

-- RLS Policies for match_participants
CREATE POLICY "Team members can view participants of their team matches"
  ON match_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      JOIN members mem ON m.team_id = mem.team_id
      WHERE m.id = match_participants.match_id
      AND mem.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can manage their own participation"
  ON match_participants FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_participants_updated_at
  BEFORE UPDATE ON match_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

