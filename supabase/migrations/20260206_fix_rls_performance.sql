-- Migration: Fix RLS Performance Issues
-- Date: 2026-02-06
-- Description: Optimize RLS policies to prevent unnecessary re-evaluation of auth functions

-- ==========================================
-- Fix 1: user_feedback table - Optimize auth.uid() calls
-- ==========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.user_feedback;

-- Recreate with optimized auth function calls
CREATE POLICY "Users can view their own feedback"
ON public.user_feedback
FOR SELECT
USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own feedback"
ON public.user_feedback
FOR INSERT
WITH CHECK (user_id = (select auth.uid()));

-- ==========================================
-- Fix 2: app_versions table - Combine multiple permissive policies
-- ==========================================

-- Drop existing policies
DROP POLICY IF EXISTS "select_active_versions_public" ON public.app_versions;
DROP POLICY IF EXISTS "select_all_versions_authenticated" ON public.app_versions;

-- Create single combined policy with OR logic
CREATE POLICY "select_app_versions"
ON public.app_versions
FOR SELECT
USING (
  -- Allow public to view active versions
  (is_active = true)
  OR
  -- Allow authenticated users to view all versions
  ((select auth.uid()) IS NOT NULL)
);
