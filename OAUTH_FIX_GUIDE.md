# Google SSO Authentication Fix Guide

## Issue Summary

The error "Database error saving new user" occurs when new users try to sign in with Google SSO, particularly in incognito mode. This happens because the required database tables and policies are missing.

## Root Causes

1. **Missing RLS Policies**: Row Level Security policies are not configured properly
2. **Missing User Creation Trigger**: No automatic user settings creation when new users sign up
3. **Permission Issues**: anon/authenticated roles don't have proper permissions
4. **Incognito Mode Limitations**: Browser restrictions on localStorage and cookies

## Solution Steps

### Step 1: Diagnose the Issue

Since the `user_settings` table already exists, let's first diagnose what's causing the error:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database_diagnostic.sql` into the editor
4. Click **Run** to execute the diagnostic queries
5. Review the results to identify the specific issue

### Step 2: Apply the Minimal Fix

If the table exists but there are permission or policy issues:

1. In **SQL Editor**, copy and paste the contents of `minimal_fix.sql`
2. Click **Run** to execute the fix

This will:

- Ensure RLS policies are properly configured
- Create the missing trigger function for automatic user settings creation
- Fix permission issues for anon/authenticated roles
- Create user settings for existing users who don't have them

### Step 3: Full Database Setup (Only if needed)

If the diagnostic shows the table structure is incorrect or missing:

1. Copy and paste the contents of `database_setup.sql` into the editor
2. Click **Run** to execute the SQL commands

This will create:

- `user_settings` table with proper structure
- `tasks` table (if not already exists)
- Row Level Security (RLS) policies
- Automatic user settings creation trigger
- Performance indexes

### Step 2: Verify Database Setup

After running the SQL, verify the setup:

1. Go to **Table Editor** in Supabase Dashboard
2. Check that `user_settings` table exists
3. Check that `tasks` table exists
4. Go to **Authentication** > **Policies** to verify RLS policies are active

### Step 3: Test the Fix

1. Clear your browser cache and cookies
2. Try signing in with Google SSO in a regular browser window
3. Try signing in with Google SSO in incognito mode
4. Check the browser console for any remaining errors

### Step 4: Monitor for Issues

The updated code now includes:

- Better error handling for database creation failures
- Fallback mechanisms for session recovery
- Incognito mode detection and warnings
- Automatic retry mechanisms

## Code Changes Made

### 1. Enhanced OAuth Callback Handling

- Added graceful error handling for database creation failures
- Implemented manual user settings creation as fallback
- Added multiple retry mechanisms for session recovery

### 2. Incognito Mode Detection

- Added localStorage availability check
- User warning for incognito mode limitations
- Better error messages for users

### 3. Fallback Session Recovery

- Multiple attempts to recover session after OAuth callback
- Delayed retry mechanisms (2s and 5s)
- Better logging for debugging

## Testing Checklist

- [ ] Database schema created successfully
- [ ] RLS policies are active
- [ ] New user signup works in regular browser
- [ ] New user signup works in incognito mode (with warning)
- [ ] Existing user login works in both modes
- [ ] User settings are created automatically
- [ ] Tasks can be created and retrieved
- [ ] No console errors during authentication

## Troubleshooting

### If "Database error saving new user" still occurs:

1. Check that the SQL script ran completely without errors
2. Verify the `handle_new_user()` function exists in Supabase
3. Check that the trigger `on_auth_user_created` is active
4. Ensure RLS policies allow INSERT operations

### If incognito mode still fails:

1. This is expected behavior - incognito mode has limitations
2. The app now shows a warning to users
3. Users should use regular browser mode for best experience

### If session recovery fails:

1. Check browser console for detailed error messages
2. Verify Supabase environment variables are correct
3. Ensure redirect URLs are properly configured

## Environment Variables Check

Make sure these are set in your `.env` file:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Redirect URLs Configuration

In Supabase Dashboard > Authentication > URL Configuration:

- Site URL: `https://too-doo-list-app-20251005.netlify.app`
- Redirect URLs:
  - `https://too-doo-list-app-20251005.netlify.app/auth/callback`
  - `too-doo-list://auth/callback`

## Support

If issues persist after following this guide:

1. Check Supabase logs in the Dashboard
2. Review browser console for detailed error messages
3. Test with a different Google account
4. Try in a different browser or device
