-- Migration: Revoke public EXECUTE on trigger-only functions
-- Date: 2026-07-10
-- Description: handle_new_user() and update_updated_at_column() are trigger
-- functions (SECURITY DEFINER) that were callable directly by anon/authenticated
-- roles via PostgREST RPC (/rest/v1/rpc/...). Revoking EXECUTE closes that
-- unintended entry point without affecting trigger firing, since triggers run
-- independent of role grants.

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
