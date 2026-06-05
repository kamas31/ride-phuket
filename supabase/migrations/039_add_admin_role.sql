-- Migration 039: Add 'admin' role to profiles
--
-- Expands the profiles_role_check constraint to allow 'admin' in addition
-- to 'rider' and 'shop_owner'. Admin users can access the zone calibration
-- tool (?debugPins=1) and any future admin-only features.

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('rider', 'shop_owner', 'admin'));
