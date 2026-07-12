-- Migration: Add "auto" theme option to user_settings
-- Date: 2026-02-06
-- Description: Update theme column to support "auto" value for following system appearance

-- ==========================================
-- Update user_settings table to support "auto" theme
-- ==========================================

-- If the theme column has a CHECK constraint, we need to update it
-- First, check if there's an existing constraint and drop it
DO $$
BEGIN
    -- Drop existing check constraint if it exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name LIKE '%theme%'
        AND table_name = 'user_settings'
        AND constraint_type = 'CHECK'
    ) THEN
        EXECUTE (
            SELECT 'ALTER TABLE user_settings DROP CONSTRAINT ' || constraint_name || ';'
            FROM information_schema.table_constraints
            WHERE constraint_name LIKE '%theme%'
            AND table_name = 'user_settings'
            AND constraint_type = 'CHECK'
            LIMIT 1
        );
    END IF;
END $$;

-- Add new CHECK constraint allowing 'light', 'dark', and 'auto'
ALTER TABLE user_settings
ADD CONSTRAINT user_settings_theme_check
CHECK (theme IN ('light', 'dark', 'auto'));

-- Update existing NULL or invalid theme values to 'auto' (default)
UPDATE user_settings
SET theme = 'auto'
WHERE theme IS NULL
   OR theme NOT IN ('light', 'dark', 'auto');

-- Set default value for theme column to 'auto'
ALTER TABLE user_settings
ALTER COLUMN theme SET DEFAULT 'auto';

-- Add comment for documentation
COMMENT ON COLUMN user_settings.theme IS 'User theme preference: light, dark, or auto (follows system)';
