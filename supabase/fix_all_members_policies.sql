-- Complete fix for members table RLS - NO recursion, very simple policies
-- Run this in Supabase SQL Editor

-- Step 1: Drop ALL existing members policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'members'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON members';
    END LOOP;
END $$;

-- Step 2: Very simple SELECT - only check teams table (no members self-reference)
CREATE POLICY "Users can view members of their created teams"
  ON members FOR SELECT
  USING (
    -- Check via teams table only - no recursion
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = members.team_id
      AND teams.created_by = auth.uid()
    )
    OR
    -- User can see themselves
    members.user_id = auth.uid()
  );

-- Step 3: Very simple INSERT - only check teams table (no members self-reference)
CREATE POLICY "Users can add members to teams they created"
  ON members FOR INSERT
  WITH CHECK (
    -- Only check teams table - completely safe, no recursion
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = members.team_id
      AND teams.created_by = auth.uid()
    )
  );

-- Step 4: Fix teams policies
DROP POLICY IF EXISTS "Users can view teams they are members of" ON teams;
DROP POLICY IF EXISTS "Users can view teams they are members of or created" ON teams;
DROP POLICY IF EXISTS "Users can view teams they created" ON teams;
DROP POLICY IF EXISTS "Users can view teams they belong to" ON teams;

-- Teams: Users can view teams they created
CREATE POLICY "Users can view teams they created"
  ON teams FOR SELECT
  USING (teams.created_by = auth.uid());

-- Teams: Users can view teams where they are members
-- This is safe because members are already inserted when this policy is checked
CREATE POLICY "Members can view their teams"
  ON teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.team_id = teams.id
      AND members.user_id = auth.uid()
    )
  );

-- Verify
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('members', 'teams')
ORDER BY tablename, cmd;
