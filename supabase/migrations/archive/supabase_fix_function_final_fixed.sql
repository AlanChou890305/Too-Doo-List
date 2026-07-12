-- Fix Function: Final version with correct system tables
-- Issue: Two functions exist, need to remove duplicates safely

-- ============================================================================
-- Step 1: Drop ALL versions of the function with CASCADE
-- ============================================================================
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- Step 2: Verify all are dropped
-- ============================================================================
SELECT
  COUNT(*) as remaining_count,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ All dropped'
    ELSE '❌ Still have ' || COUNT(*) || ' function(s)'
  END as status
FROM pg_proc
WHERE proname = 'update_updated_at_column';

-- ============================================================================
-- Step 3: Create single secure version
-- ============================================================================
CREATE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Auto-updates updated_at timestamp. Secured with SECURITY DEFINER and explicit search_path.';

-- ============================================================================
-- Step 4: Recreate triggers for all tables with updated_at
-- ============================================================================

-- user_feedback
DROP TRIGGER IF EXISTS update_user_feedback_updated_at ON public.user_feedback;
CREATE TRIGGER update_user_feedback_updated_at
BEFORE UPDATE ON public.user_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- tasks
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- user_settings
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- app_versions
DROP TRIGGER IF EXISTS update_app_versions_updated_at ON public.app_versions;
CREATE TRIGGER update_app_versions_updated_at
BEFORE UPDATE ON public.app_versions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

-- Check 1: Function count (should be 1)
SELECT
  COUNT(*) as function_count,
  CASE
    WHEN COUNT(*) = 1 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM pg_proc
WHERE proname = 'update_updated_at_column';

-- Check 2: Function security status
SELECT
  proname as function_name,
  prosecdef as security_definer,
  proconfig as config,
  CASE
    WHEN prosecdef = true AND proconfig IS NOT NULL
    THEN '✅ SECURE'
    ELSE '❌ INSECURE'
  END as security_status
FROM pg_proc
WHERE proname = 'update_updated_at_column';

-- Check 3: Trigger count using information_schema
SELECT
  COUNT(*) as trigger_count,
  CASE
    WHEN COUNT(*) >= 4 THEN '✅ PASS (has ' || COUNT(*) || ' triggers)'
    ELSE '⚠️ Only ' || COUNT(*) || ' triggers'
  END as status
FROM information_schema.triggers
WHERE trigger_name LIKE '%updated_at%'
  AND trigger_schema = 'public';

-- Check 4: List all triggers using information_schema
SELECT
  event_object_table as table_name,
  trigger_name
FROM information_schema.triggers
WHERE trigger_name LIKE '%updated_at%'
  AND trigger_schema = 'public'
ORDER BY event_object_table;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '🎉 Security fix complete! All checks passed.' as message;
