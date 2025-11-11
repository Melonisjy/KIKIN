-- Team Notice Receipts table to track acknowledgements
CREATE TABLE IF NOT EXISTS team_notice_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notice_id UUID NOT NULL REFERENCES team_notices(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (notice_id, user_id)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_notice_receipts_notice_id ON team_notice_receipts(notice_id);
CREATE INDEX IF NOT EXISTS idx_notice_receipts_team_id ON team_notice_receipts(team_id);

-- Enable Row Level Security
ALTER TABLE team_notice_receipts ENABLE ROW LEVEL SECURITY;

-- Team members can view acknowledgement status
CREATE POLICY "Members can view notice receipts"
  ON team_notice_receipts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM members
      WHERE members.team_id = team_notice_receipts.team_id
        AND members.user_id = auth.uid()
    )
  );

-- Team members can mark notices as acknowledged
CREATE POLICY "Members can acknowledge notices"
  ON team_notice_receipts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM members
      WHERE members.team_id = team_notice_receipts.team_id
        AND members.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Allow users to retract their acknowledgement if needed
CREATE POLICY "Members can delete their own receipts"
  ON team_notice_receipts
  FOR DELETE
  USING (
    user_id = auth.uid()
  );

