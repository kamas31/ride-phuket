-- Migration 007 — Role sync trigger and helpers
-- Run in Supabase SQL Editor
--
-- Problem this solves:
--   When a user's raw_user_meta_data.role is manually updated (or overwritten)
--   the profiles.role can get out of sync. This migration:
--   1. Makes handle_new_user smarter (don't overwrite shop_owner with rider)
--   2. Adds a manual sync function for emergency fixes
--   3. Adds a function to repair any existing desynced users

-- ── 1. Fix the handle_new_user trigger ──────────────────────────────
-- Previously: always wrote role from metadata, overwriting existing profiles
-- Now: only updates role if the incoming role is an upgrade (rider→shop_owner)
--      or if the profile doesn't exist yet
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  incoming_role TEXT;
  existing_role TEXT;
BEGIN
  incoming_role := COALESCE(NEW.raw_user_meta_data->>'role', 'rider');

  -- Check if profile already exists
  SELECT role INTO existing_role FROM public.profiles WHERE id = NEW.id;

  IF existing_role IS NULL THEN
    -- New user — create profile with incoming role
    INSERT INTO public.profiles (id, name, role)
    VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        'Rider'
      ),
      incoming_role
    )
    ON CONFLICT (id) DO NOTHING;
  ELSIF existing_role = 'rider' AND incoming_role = 'shop_owner' THEN
    -- Upgrade: rider → shop_owner (e.g. user signed up as partner)
    UPDATE public.profiles SET role = 'shop_owner' WHERE id = NEW.id;
  END IF;
  -- If existing_role = 'shop_owner' and incoming = 'rider': DO NOTHING (preserve owner)

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-register the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── 2. Also fire on UPDATE (e.g. when raw_user_meta_data is changed) ──
-- This is useful if an admin manually updates the user's metadata
CREATE OR REPLACE FUNCTION public.handle_user_updated()
RETURNS trigger AS $$
DECLARE
  incoming_role TEXT;
  existing_role TEXT;
BEGIN
  incoming_role := COALESCE(NEW.raw_user_meta_data->>'role', 'rider');
  SELECT role INTO existing_role FROM public.profiles WHERE id = NEW.id;

  -- Only update profile if role changed AND it's a legitimate upgrade
  IF existing_role IS NOT NULL AND incoming_role <> existing_role THEN
    -- Allow both upgrades and explicit shop_owner→rider demotions
    -- (an admin explicitly set a new role)
    UPDATE public.profiles SET role = incoming_role WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE PROCEDURE public.handle_user_updated();

-- ── 3. Emergency sync function ───────────────────────────────────────
-- Call this to repair any user whose profile.role got overwritten:
--   SELECT sync_role_for_user('<user_uuid>');
--
-- This function:
--   - Reads the manually-set role from raw_user_meta_data
--   - Writes it to profiles.role
CREATE OR REPLACE FUNCTION public.sync_role_for_user(target_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  meta_role TEXT;
  profile_role TEXT;
BEGIN
  SELECT raw_user_meta_data->>'role' INTO meta_role
  FROM auth.users WHERE id = target_user_id;

  SELECT role INTO profile_role
  FROM public.profiles WHERE id = target_user_id;

  IF meta_role IS NULL THEN
    RETURN 'user not found or no role in metadata';
  END IF;

  UPDATE public.profiles SET role = meta_role WHERE id = target_user_id;

  RETURN format('synced: profile.role set to "%s" (was "%s")', meta_role, COALESCE(profile_role, 'null'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.sync_role_for_user(UUID) TO service_role;

-- ── 4. One-time repair: sync any currently desynced profiles ─────────
-- Finds users whose raw_user_meta_data.role differs from profiles.role
-- and updates profiles.role to match metadata.
-- Only run this ONCE, carefully, after verifying the metadata values are correct.
--
-- To apply: uncomment and run the block below manually in SQL Editor:
--
-- DO $$
-- DECLARE
--   r RECORD;
-- BEGIN
--   FOR r IN
--     SELECT u.id, u.raw_user_meta_data->>'role' as meta_role, p.role as profile_role
--     FROM auth.users u
--     JOIN public.profiles p ON p.id = u.id
--     WHERE u.raw_user_meta_data->>'role' IS NOT NULL
--       AND u.raw_user_meta_data->>'role' <> p.role
--   LOOP
--     RAISE NOTICE 'Syncing user %: profile.role % → %', r.id, r.profile_role, r.meta_role;
--     UPDATE public.profiles SET role = r.meta_role WHERE id = r.id;
--   END LOOP;
-- END $$;
