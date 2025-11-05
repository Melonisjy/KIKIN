-- Refresh Supabase schema cache
-- This forces PostgREST to reload the schema cache

-- Method 1: Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Method 2: Check if tables are accessible
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('teams', 'members', 'matches', 'match_participants', 'user_profiles');

-- Method 3: Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('teams', 'members', 'matches', 'match_participants', 'user_profiles');

-- Method 4: Check API access
-- This should return the teams table structure
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'teams'
ORDER BY ordinal_position;

