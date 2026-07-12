-- Migration: Add version tracking to user_settings table
-- Created: 2026-01-31
-- Purpose: Track user's current app version and build number

-- Add version tracking columns to user_settings table
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS app_version varchar,
ADD COLUMN IF NOT EXISTS app_build_number varchar;

-- Add comments for documentation
COMMENT ON COLUMN public.user_settings.app_version IS 'User''s current app version (e.g., 1.2.3)';
COMMENT ON COLUMN public.user_settings.app_build_number IS 'User''s current build number (e.g., 11)';

-- Create index for version queries (optional but recommended for performance)
CREATE INDEX IF NOT EXISTS idx_user_settings_app_version
ON public.user_settings(app_version, platform);

-- Verify the changes
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_settings'
  AND column_name IN ('app_version', 'app_build_number')
ORDER BY column_name;
