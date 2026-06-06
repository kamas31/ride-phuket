-- Migration 041: Separate admin privileges from business role
--
-- Problem: role='admin' caused shop owners to lose all partner access because
--          every shop-owner guard does an exact role = 'shop_owner' check.
--
-- Solution: Add is_admin BOOLEAN column. Admin privileges are now tracked
--           separately from the business role (rider | shop_owner).
--
-- After this migration:
--   profiles.role     → 'rider' | 'shop_owner'   (business role only)
--   profiles.is_admin → true | false              (admin privileges, default false)
--
-- Existing admin accounts are migrated automatically:
--   role='admin' + shop_id IS NOT NULL → role='shop_owner', is_admin=true
--   role='admin' + shop_id IS NULL     → role='rider',      is_admin=true

-- ── Step 1: Add is_admin column ────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- ── Step 2: Audit — log every affected row before touching it ──────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, role, shop_id
    FROM profiles
    WHERE role = 'admin'
    ORDER BY id
  LOOP
    RAISE NOTICE 'Migrating admin user %: shop_id=%, new role will be "%", is_admin=true',
      r.id,
      COALESCE(r.shop_id::text, 'NULL'),
      CASE WHEN r.shop_id IS NOT NULL THEN 'shop_owner' ELSE 'rider' END;
  END LOOP;

  IF NOT FOUND THEN
    RAISE NOTICE 'No accounts with role=admin found — nothing to migrate.';
  END IF;
END $$;

-- ── Step 3: Migrate existing admin accounts ────────────────────────────────────
UPDATE profiles
SET
  is_admin = true,
  role = CASE
    WHEN shop_id IS NOT NULL THEN 'shop_owner'
    ELSE 'rider'
  END
WHERE role = 'admin';

-- ── Step 4: Tighten the CHECK constraint ───────────────────────────────────────
-- Safe because Step 3 guarantees no rows with role='admin' remain.
-- This permanently prevents 'admin' from being set as a role value.
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('rider', 'shop_owner'));

-- ── Step 5: Verify ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  remaining_admin_count INT;
  new_admin_count INT;
BEGIN
  SELECT COUNT(*) INTO remaining_admin_count FROM profiles WHERE role = 'admin';
  SELECT COUNT(*) INTO new_admin_count FROM profiles WHERE is_admin = true;

  IF remaining_admin_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % row(s) still have role=admin', remaining_admin_count;
  END IF;

  RAISE NOTICE 'Migration complete. is_admin=true accounts: %', new_admin_count;
END $$;

-- ── Notes ──────────────────────────────────────────────────────────────────────
-- RLS policies are unaffected — they check role = 'shop_owner' which still works.
-- Application code that reads is_admin must select it explicitly (not via *).
-- The JWT user_metadata.role field may still contain 'admin' until re-login;
-- the middleware ignores it for admin checking (admin is not a middleware concern).
