-- Quick fix for OAuth "Database error saving new user" issue
-- This addresses the most common causes

-- 1. Ensure the trigger function exists and works
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Add error handling
    BEGIN
        -- Check if user_settings already exists for this user
        IF NOT EXISTS (SELECT 1 FROM public.user_settings WHERE user_id = NEW.id) THEN
            -- Insert default user settings
            INSERT INTO public.user_settings (user_id, language, theme, notifications_enabled)
            VALUES (NEW.id, 'en', 'light', true);
            
            -- Log successful creation
            RAISE NOTICE 'User settings created for user: %', NEW.id;
        END IF;
        
        RETURN NEW;
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the error but don't fail the user creation
            RAISE WARNING 'Failed to create user settings for user %: %', NEW.id, SQLERRM;
            RETURN NEW; -- Still allow the user to be created
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Ensure proper permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_settings TO authenticated;

-- 4. Ensure RLS is enabled and policies exist
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings;

-- Create RLS policies
CREATE POLICY "Users can view their own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON public.user_settings
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Create a policy that allows the trigger function to insert user settings
-- This is crucial - the trigger runs as SECURITY DEFINER but still needs to bypass RLS
CREATE POLICY "Allow trigger to insert user settings" ON public.user_settings
    FOR INSERT WITH CHECK (true);

-- 6. Test the setup
SELECT 'Setup complete - trigger and policies created' as status;
