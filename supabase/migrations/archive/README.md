# Archived Migrations

This directory contains historical SQL files that have been applied or superseded.

## Files

### ✅ Applied Migrations

#### `supabase_migration_add_version_tracking.sql`
- **Date**: 2026-01-31
- **Purpose**: Adds `app_version` and `app_build_number` columns to `user_settings` table
- **Status**: ✅ Applied to production
- **Keep for**: Historical record of schema changes

#### `supabase_migration_create_user_feedback.sql`
- **Date**: 2026-01-31
- **Purpose**: Creates `user_feedback` table for storing user submissions
- **Status**: ⚠️ **OUTDATED** - RLS policies superseded by `20260206_fix_rls_performance.sql`
- **Note**: This file uses old RLS syntax (`auth.uid()` instead of `(select auth.uid())`)
- **Keep for**: Historical record (do not reapply as-is)

### 🔧 Security Fixes (Applied)

#### `supabase_fix_function_final_fixed.sql`
- **Date**: 2026-02-06
- **Purpose**: Fix duplicate `update_updated_at_column()` function, add SECURITY DEFINER
- **Status**: ✅ Applied
- **Keep for**: Reference for function security patterns

#### `supabase_security_fix_final.sql`
- **Date**: 2026-02-06
- **Purpose**: Clean up redundant RLS policies on `app_versions` table
- **Status**: ✅ Applied (later superseded by combined policy in `20260206_fix_rls_performance.sql`)
- **Keep for**: Historical context

### 🛠️ Helper Scripts

#### `supabase_helper_insert_version.sql`
- **Date**: 2026-01-31
- **Purpose**: Template for inserting new app versions to `app_versions` table
- **Status**: 🔄 **REUSABLE**
- **Keep for**: Operational use when releasing new app versions
- **Usage**: Update version number, build number, and release notes before running

## Migration History Timeline

```
2026-01-31: Create user_feedback table (with basic RLS)
2026-01-31: Add version tracking to user_settings
2026-02-06: Fix function security (SECURITY DEFINER + search_path)
2026-02-06: Clean up redundant RLS policies
2026-02-06: Optimize RLS performance (see ../20260206_fix_rls_performance.sql)
```

## Notes

- All fixes have been consolidated into the main migrations directory
- For current migrations, see parent directory (`supabase/migrations/`)
- Do not reapply files from archive without reviewing current schema first
