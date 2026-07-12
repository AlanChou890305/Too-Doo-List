-- Security Fix FINAL: Precise cleanup based on actual policy names
-- Created: 2026-02-06
-- Purpose: Remove duplicate policies, keep optimal configuration

-- ============================================================================
-- Current State Analysis
-- ============================================================================
-- We have 5 policies:
-- 1. "Allow service role full access to app_versions" (ALL, service_role) ✅ KEEP
-- 2. "Allow anonymous read access to app_versions" (SELECT, anon) ❌ REMOVE (redundant)
-- 3. "Allow authenticated read access to app_versions" (SELECT, authenticated) ❌ REMOVE (redundant)
-- 4. "select_active_versions_public" (SELECT, public) ✅ KEEP (our new secure policy)
-- 5. "select_all_versions_authenticated" (SELECT, authenticated) ✅ KEEP (our new secure policy)
--
-- Goal: Remove policies 2 and 3 (old redundant policies)
-- Keep: 1, 4, 5 (service role + our new secure policies)

-- ============================================================================
-- Step 1: Remove redundant old policies
-- ============================================================================

-- Remove old anonymous read policy (redundant with select_active_versions_public)
DROP POLICY IF EXISTS "Allow anonymous read access to app_versions" ON public.app_versions;

-- Remove old authenticated read policy (redundant with select_all_versions_authenticated)
DROP POLICY IF EXISTS "Allow authenticated read access to app_versions" ON public.app_versions;

-- ============================================================================
-- Step 2: Verify policy count (should be 3 now)
-- ============================================================================
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'app_versions';

-- Expected: 3

-- ============================================================================
-- Step 3: List remaining policies
-- ============================================================================
SELECT
  policyname,
  cmd,
  roles::text,
  CASE
    WHEN cmd = 'ALL' THEN '✅ Service role (admin access)'
    WHEN policyname = 'select_active_versions_public' THEN '✅ Public can view active versions'
    WHEN policyname = 'select_all_versions_authenticated' THEN '✅ Authenticated can view all versions'
    ELSE 'Other'
  END as description
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'app_versions'
ORDER BY cmd DESC, policyname;

-- Expected output (3 policies):
-- policyname                                  | cmd    | roles            | description
-- Allow service role full access...           | ALL    | {service_role}   | ✅ Service role (admin access)
-- select_active_versions_public               | SELECT | {public}         | ✅ Public can view active versions
-- select_all_versions_authenticated           | SELECT | {authenticated}  | ✅ Authenticated can view all versions

-- ============================================================================
-- Step 4: Verify no INSERT/UPDATE policies exist for regular users
-- ============================================================================
SELECT
  policyname,
  cmd,
  roles::text
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'app_versions'
  AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
  AND roles::text NOT LIKE '%service_role%';

-- Expected: No rows (only service_role should have INSERT/UPDATE/DELETE)

-- ============================================================================
-- Step 5: Final Security Checklist
-- ============================================================================

-- Check 1: RLS is enabled
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'app_versions';
-- Expected: rls_enabled = t

-- Check 2: Function has secure search_path
SELECT
  proname,
  proconfig
FROM pg_proc
WHERE proname = 'update_updated_at_column';
-- Expected: proconfig = {search_path=public,pg_temp}

-- Check 3: Summary of security posture
SELECT
  '✅ RLS Enabled' as check_item,
  CASE WHEN rowsecurity THEN 'PASS' ELSE 'FAIL' END as status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'app_versions'

UNION ALL

SELECT
  '✅ Policy Count = 3' as check_item,
  CASE WHEN COUNT(*) = 3 THEN 'PASS' ELSE 'FAIL (count=' || COUNT(*) || ')' END as status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'app_versions'

UNION ALL

SELECT
  '✅ No unsafe INSERT policies' as check_item,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS'
    ELSE 'FAIL (found ' || COUNT(*) || ')'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'app_versions'
  AND cmd = 'INSERT'
  AND roles::text NOT LIKE '%service_role%'

UNION ALL

SELECT
  '✅ No unsafe UPDATE policies' as check_item,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS'
    ELSE 'FAIL (found ' || COUNT(*) || ')'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'app_versions'
  AND cmd = 'UPDATE'
  AND roles::text NOT LIKE '%service_role%'

UNION ALL

SELECT
  '✅ Function search_path secure' as check_item,
  CASE
    WHEN proconfig::text LIKE '%search_path%' THEN 'PASS'
    ELSE 'FAIL'
  END as status
FROM pg_proc
WHERE proname = 'update_updated_at_column';

-- ============================================================================
-- Expected Final State
-- ============================================================================
-- ✅ 3 policies total:
--    1. service_role: ALL (admin access)
--    2. public: SELECT active versions only
--    3. authenticated: SELECT all versions
-- ✅ No INSERT/UPDATE policies for regular users
-- ✅ Function has secure search_path
-- ✅ RLS enabled

-- ============================================================================
-- What This Fixes
-- ============================================================================
-- ✅ Removes redundant policies (cleaner configuration)
-- ✅ No unsafe INSERT/UPDATE access for regular users
-- ✅ Service role retains full admin access
-- ✅ Users can still check for updates (read-only)
-- ✅ Function secured against search_path injection
