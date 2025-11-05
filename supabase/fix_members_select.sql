-- Fix members SELECT policy to remove circular reference
-- Run this in Supabase SQL Editor

-- Drop the problematic SELECT policy
DROP POLICY IF EXISTS "Users can view members of teams they created" ON members;

-- Create a simpler SELECT policy that doesn't cause recursion
-- Strategy: Only check if user created the team OR if user is the member themselves
CREATE POLICY "Users can view members of teams they created"
  ON members FOR SELECT
  USING (
    -- User can see themselves
    members.user_id = auth.uid()
    OR
    -- User can see members of teams they created (check teams table only, no members reference)
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = members.team_id
      AND teams.created_by = auth.uid()
    )
  );

-- Verify the policy
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual::text LIKE '%members%' AND tablename = 'teams' THEN '⚠️ CIRCULAR'
        WHEN qual::text LIKE '%teams%' AND tablename = 'members' THEN '⚠️ CIRCULAR'
        ELSE '✅ SAFE'
    END as status
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('members', 'teams')
ORDER BY tablename, cmd;

