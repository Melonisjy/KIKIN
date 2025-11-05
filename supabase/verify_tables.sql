-- Verify that all required tables exist
-- Run this in Supabase SQL Editor to check

SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('teams', 'members', 'matches', 'match_participants', 'user_profiles')
    THEN '✅ Required'
    ELSE '⚠️ Optional'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check if teams table exists and has correct structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'teams'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('teams', 'members', 'matches', 'match_participants', 'user_profiles');

-- Check policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('teams', 'members', 'matches', 'match_participants')
ORDER BY tablename, policyname;

