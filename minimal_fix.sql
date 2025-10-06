-- Minimal Fix for "Database error saving new user" issue
-- Run this ONLY if user_settings table already exists
-- This script addresses common issues without recreating existing tables

-- 1. Ensure RLS is enabled (if not already)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies if they don't exist (using IF NOT EXISTS equivalent)
-- First, drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON user_settings;

-- Then create the policies
CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON user_settings
    FOR DELETE USING (auth.uid() = user_id);

-- 3. Ensure proper permissions for anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON user_settings TO anon, authenticated;

-- 4. Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user_settings already exists for this user
    IF NOT EXISTS (SELECT 1 FROM public.user_settings WHERE user_id = NEW.id) THEN
        INSERT INTO public.user_settings (user_id, language, theme, notifications_enabled)
        VALUES (NEW.id, 'en', 'light', true);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create or replace the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Create missing user_settings for existing users who don't have them
INSERT INTO public.user_settings (user_id, language, theme, notifications_enabled)
SELECT 
    au.id,
    'en',
    'light',
    true
FROM auth.users au
LEFT JOIN public.user_settings us ON au.id = us.user_id
WHERE us.user_id IS NULL;

-- 7. Add unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_settings_user_id_key' 
        AND table_name = 'user_settings'
    ) THEN
        ALTER TABLE user_settings ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);
    END IF;
END $$;
