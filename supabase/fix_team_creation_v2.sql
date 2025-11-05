-- Fix infinite recursion in members INSERT policy
-- Solution: Simplify policies to avoid recursion

-- Drop all existing members INSERT policies
DROP POLICY IF EXISTS "Team leaders can add members" ON members;
DROP POLICY IF EXISTS "Users can add themselves when creating team or leaders can add members" ON members;
DROP POLICY IF EXISTS "Users can add themselves as first member of their team" ON members;
DROP POLICY IF EXISTS "Team leaders can add other members" ON members;

-- Policy 1: Allow user to add themselves if they created the team
-- No check for "first member" to avoid recursion - UNIQUE constraint will prevent duplicates
CREATE POLICY "Users can add themselves to teams they created"
  ON members FOR INSERT
  WITH CHECK (
    -- User is adding themselves
    user_id = auth.uid()
    AND
    -- User created the team (no members table check = no recursion)
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = members.team_id
      AND teams.created_by = auth.uid()
    )
  );

-- Policy 2: Allow team leaders to add other members
-- Only check if user is already a leader (members table exists at this point)
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
  );

-- Ensure teams SELECT policy allows creators to view their teams
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
