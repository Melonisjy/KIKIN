-- Add DELETE policies for teams and matches
-- Run this in Supabase SQL Editor

-- Teams DELETE: Only team creators can delete their teams
CREATE POLICY "Users can delete teams they created"
  ON teams FOR DELETE
  USING (teams.created_by = auth.uid());

-- Matches DELETE: Only team leaders can delete matches
CREATE POLICY "Team leaders can delete matches"
  ON matches FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = matches.team_id
      AND teams.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM members
      WHERE members.team_id = matches.team_id
      AND members.user_id = auth.uid()
      AND members.role = 'leader'
    )
  );

-- Verify policies
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('teams', 'matches')
AND cmd = 'DELETE'
ORDER BY tablename;

