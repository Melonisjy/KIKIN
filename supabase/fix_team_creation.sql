-- Fix team creation RLS policy issue
-- The problem: Infinite recursion in members INSERT policy

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Team leaders can add members" ON members;
DROP POLICY IF EXISTS "Users can add themselves when creating team or leaders can add members" ON members;

-- Create a simpler policy that avoids recursion
-- Policy 1: Allow users to add themselves as first member when they created the team
CREATE POLICY "Users can add themselves as first member of their team"
  ON members FOR INSERT
  WITH CHECK (
    -- User is adding themselves
    user_id = auth.uid()
    AND
    -- User created the team (no need to check members table - avoids recursion)
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = members.team_id
      AND teams.created_by = auth.uid()
    )
    AND
    -- This is the first member (no other members exist yet)
    NOT EXISTS (
      SELECT 1 FROM members m
      WHERE m.team_id = members.team_id
      AND m.id != members.id
    )
  );

-- Policy 2: Allow team leaders to add other members (after first member exists)
CREATE POLICY "Team leaders can add other members"
  ON members FOR INSERT
  WITH CHECK (
    -- User is a leader of the team
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.team_id = members.team_id
      AND m.user_id = auth.uid()
      AND m.role = 'leader'
    )
    AND
    -- Adding someone else (not themselves)
    user_id != auth.uid()
  );

-- Also ensure teams SELECT policy allows creators to view their teams immediately
DROP POLICY IF EXISTS "Users can view teams they are members of" ON teams;
DROP POLICY IF EXISTS "Users can view teams they are members of or created" ON teams;

CREATE POLICY "Users can view teams they are members of or created"
  ON teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.team_id = teams.id
      AND members.user_id = auth.uid()
    )
    OR
    teams.created_by = auth.uid()
  );
