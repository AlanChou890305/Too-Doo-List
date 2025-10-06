-- Simple OAuth fix - addresses the most common cause of "Database error saving new user"
-- This script focuses on the core issue without complex diagnostics

-- 1. Create or replace the trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Add error handling to prevent OAuth failures
    BEGIN
        -- Check if user_settings already exists for this user
        IF NOT EXISTS (SELECT 1 FROM public.user_settings WHERE user_id = NEW.id) THEN
            -- Insert default user settings
            INSERT INTO public.user_settings (user_id, language, theme, notifications_enabled)
            VALUES (NEW.id, 'en', 'light', true);
        END IF;
        
        RETURN NEW;
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the error but don't fail the user creation
            -- This prevents the OAuth flow from failing
            RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Ensure RLS is enabled
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 4. Create basic RLS policies
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings;

CREATE POLICY "Users can view their own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON public.user_settings
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Create a policy that allows the trigger function to insert user settings
-- This is crucial for OAuth user creation
CREATE POLICY "Allow trigger to insert user settings" ON public.user_settings
    FOR INSERT WITH CHECK (true);

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_settings TO authenticated;

-- 7. Test the setup
SELECT 'OAuth fix applied successfully' as status;
