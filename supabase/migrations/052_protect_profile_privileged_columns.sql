-- P0-1 / P0-2 remediation: prevent client-side self-escalation of
-- profiles.is_admin and profiles.shop_id.
--
-- Root cause: RLS policies on public.profiles restrict which ROW a user
-- may write (auth.uid() = id), not which COLUMNS. The table also has
-- GRANT ALL to authenticated, and the INSERT policy ("Service can insert
-- profile") has no TO clause, so it applies to PUBLIC. Together this lets
-- any authenticated user UPDATE their own row (or INSERT a fresh one) and
-- set is_admin = true and/or shop_id to an arbitrary shop, directly from
-- the client (e.g. via the Supabase JS client), with no app code involved.
--
-- Fix: a BEFORE INSERT OR UPDATE trigger that resets these two columns to
-- a safe value whenever the write is not performed by service_role.
-- service_role is exempted because every legitimate write to is_admin/
-- shop_id in this codebase already goes through createAdminClient()
-- (completeOAuthProfile, createShop, adminClaimShopByEmail) -- see
-- docs/DECISIONS.md ADR-054 for the full analysis.
--
-- Columns are silently reverted rather than raising an exception so that
-- a normal profile update (name/phone/avatar) that happens to include the
-- existing is_admin/shop_id values unchanged is never blocked.

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_admin := false;
    NEW.shop_id  := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.is_admin := OLD.is_admin;
    NEW.shop_id  := OLD.shop_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns_trigger ON public.profiles;

CREATE TRIGGER protect_profile_privileged_columns_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_columns();
