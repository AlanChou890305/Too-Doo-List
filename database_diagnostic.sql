-- Database Diagnostic Script for Too-Doo-List
-- Run this in Supabase SQL Editor to diagnose the "Database error saving new user" issue

-- 1. Check if user_settings table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
ORDER BY ordinal_position;

-- 2. Check if RLS is enabled on user_settings table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_settings';

-- 3. Check existing RLS policies on user_settings table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_settings';

-- 4. Check if the handle_new_user function exists
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 5. Check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 6. Check table permissions for anon and authenticated roles
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'user_settings' 
AND grantee IN ('anon', 'authenticated');

-- 7. Check if there are any existing user_settings records
SELECT COUNT(*) as total_user_settings FROM user_settings;

-- 8. Check recent auth.users to see if they have corresponding user_settings
SELECT 
    au.id as user_id,
    au.email,
    au.created_at as user_created,
    us.id as settings_id,
    us.created_at as settings_created
FROM auth.users au
LEFT JOIN user_settings us ON au.id = us.user_id
ORDER BY au.created_at DESC
LIMIT 10;
