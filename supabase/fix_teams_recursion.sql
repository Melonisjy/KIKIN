-- Fix infinite recursion in teams table policies
-- The issue: teams SELECT policy references members, creating circular dependency
-- Run this in Supabase SQL Editor

-- Step 1: Drop ALL existing teams policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'teams'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON teams';
    END LOOP;
END $$;

-- Step 2: Simple teams SELECT policy - only check created_by (no members reference)
CREATE POLICY "Users can view teams they created"
  ON teams FOR SELECT
  USING (teams.created_by = auth.uid());

-- Step 3: Simple teams INSERT policy
CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Step 4: Simple teams UPDATE policy - only check created_by (no members reference)
CREATE POLICY "Users can update teams they created"
  ON teams FOR UPDATE
  USING (teams.created_by = auth.uid())
  WITH CHECK (teams.created_by = auth.uid());

-- Step 5: Also fix members policies to avoid any recursion
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

-- Members SELECT: Only check teams table (no self-reference)
CREATE POLICY "Users can view members of teams they created"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = members.team_id
      AND teams.created_by = auth.uid()
    )
    OR
    members.user_id = auth.uid()
  );

-- Members INSERT: Only check teams table (no self-reference)
CREATE POLICY "Users can add members to teams they created"
  ON members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = members.team_id
      AND teams.created_by = auth.uid()
    )
  );

-- Verify - should show NO policies that reference both tables in a circular way
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

