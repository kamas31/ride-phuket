-- Phase 2A: admin manual shop claim by owner email.
--
-- profiles has no email column (lives only in auth.users) — SECURITY
-- DEFINER lets this function read auth.users to resolve a profile id
-- (= auth.users.id, per the profiles.id FK) from an email address.
--
-- Only ever called via the service_role admin client from
-- adminClaimShopByEmail(), which already gates on isAdminUser() before
-- reaching this RPC. Mirrors the SECURITY DEFINER pattern of
-- check_email_registered (migration 025), but returns the id instead of
-- a boolean since the caller needs to link a real profile.
--
-- P1-2 security fix: Postgres grants EXECUTE on newly created functions
-- to PUBLIC by default, so without an explicit REVOKE any authenticated
-- (or anonymous) client could call this RPC directly and enumerate which
-- email addresses have an account, plus the corresponding profile id.
-- Revoking from PUBLIC/anon/authenticated and granting only to
-- service_role closes that without affecting adminClaimShopByEmail(),
-- which already calls it through the service_role admin client.
CREATE OR REPLACE FUNCTION public.find_profile_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT id FROM auth.users WHERE email = lower(p_email) LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.find_profile_id_by_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_profile_id_by_email(text) TO service_role;
