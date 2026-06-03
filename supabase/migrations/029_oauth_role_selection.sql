-- Migration 029: OAuth role-selection flow
--
-- Changes handle_new_user to skip automatic profile creation for OAuth users
-- (Google, GitHub, etc.) who have no explicit 'role' in their signup metadata.
-- These users are redirected to /auth/select-role to choose Rider or Shop Owner
-- before the profile is created.
--
-- Email/password signups are unaffected — signUpWithEmail always sets
-- raw_user_meta_data.role via: signUp({ options: { data: { name, role } } })
--
-- Run in: Supabase Dashboard → SQL Editor

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  incoming_role TEXT;
  existing_role TEXT;
BEGIN
  -- Read role exactly as stored — NULL when not present (OAuth users).
  -- COALESCE(..., 'rider') was the old behavior that auto-assigned rider to
  -- everyone; removed here to allow the app to intercept OAuth signups.
  incoming_role := NEW.raw_user_meta_data->>'role';

  SELECT role INTO existing_role FROM public.profiles WHERE id = NEW.id;

  IF existing_role IS NULL THEN
    IF incoming_role IS NULL THEN
      -- OAuth user with no explicit role (Google, GitHub, etc.).
      -- Leave profile creation to the app: the callback detects the missing
      -- profile and redirects to /auth/select-role.
      RETURN NEW;
    END IF;

    -- Email/password user — role was explicitly set at signup.
    INSERT INTO public.profiles (id, name, role)
    VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        'User'
      ),
      incoming_role
    )
    ON CONFLICT (id) DO NOTHING;

  ELSIF existing_role = 'rider' AND incoming_role = 'shop_owner' THEN
    -- Legitimate upgrade path: rider → shop_owner.
    UPDATE public.profiles SET role = 'shop_owner' WHERE id = NEW.id;
  END IF;
  -- existing_role = 'shop_owner' and incoming = 'rider': DO NOTHING (preserve owner)

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The on_auth_user_created trigger is already registered from migration 007.
-- CREATE OR REPLACE on the function body is sufficient — no DROP/CREATE needed.
