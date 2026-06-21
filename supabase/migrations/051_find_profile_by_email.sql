-- Phase 2A: admin manual shop claim by owner email.
--
-- profiles has no email column (lives only in auth.users) — SECURITY
-- DEFINER lets this function read auth.users to resolve a profile id
-- (= auth.users.id, per the profiles.id FK) from an email address.
--
-- Not granted to anon/authenticated: only ever called via the service_role
-- admin client from adminClaimShopByEmail(), which already gates on
-- isAdminUser() before reaching this RPC. Mirrors the SECURITY DEFINER
-- pattern of check_email_registered (migration 025), but returns the id
-- instead of a boolean since the caller needs to link a real profile.
CREATE OR REPLACE FUNCTION public.find_profile_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT id FROM auth.users WHERE email = lower(p_email) LIMIT 1;
$$;
