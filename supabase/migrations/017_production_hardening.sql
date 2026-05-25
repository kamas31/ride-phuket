-- Migration 017 — Production Hardening: NOT NULL constraints on critical fields
--
-- Strategy: backfill all NULLs with safe defaults FIRST, then add constraints.
-- This is safe to run on live data — no rows are deleted, no data is lost.
--
-- Run order: backfill → constraint → index. Wrap in a transaction for atomicity.

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- SCOOTERS — backfill NULLs then constrain
-- ─────────────────────────────────────────────────────────────

-- 1. name
UPDATE public.scooters SET name = 'Scooter' WHERE name IS NULL OR name = '';

-- 2. price_per_day — 0 means "contact for price"; safe default
UPDATE public.scooters SET price_per_day = 0 WHERE price_per_day IS NULL;

-- 3. images — empty JSON array
UPDATE public.scooters SET images = '[]'::jsonb WHERE images IS NULL;

-- 4. available — default false (safer than true for unknown rows)
UPDATE public.scooters SET available = false WHERE available IS NULL;

-- 5. category
UPDATE public.scooters SET category = 'automatic' WHERE category IS NULL OR category NOT IN ('automatic', 'manual', 'electric');

-- 6. features
UPDATE public.scooters SET features = '[]'::jsonb WHERE features IS NULL;

-- 7. specs
UPDATE public.scooters SET specs = '{}'::jsonb WHERE specs IS NULL;

-- 8. delivery_available
UPDATE public.scooters SET delivery_available = false WHERE delivery_available IS NULL;

-- 9. delivery_fee
UPDATE public.scooters SET delivery_fee = 0 WHERE delivery_fee IS NULL;

-- 10. helmet_included
UPDATE public.scooters SET helmet_included = false WHERE helmet_included IS NULL;

-- 11. insurance_included
UPDATE public.scooters SET insurance_included = false WHERE insurance_included IS NULL;

-- 12. min_rental_days
UPDATE public.scooters SET min_rental_days = 1 WHERE min_rental_days IS NULL OR min_rental_days < 1;

-- 13. passport_required / passport_copy_allowed / is_premium_bike
UPDATE public.scooters SET passport_required   = false WHERE passport_required IS NULL;
UPDATE public.scooters SET passport_copy_allowed = true WHERE passport_copy_allowed IS NULL;
UPDATE public.scooters SET is_premium_bike      = false WHERE is_premium_bike IS NULL;

-- Now add NOT NULL constraints
ALTER TABLE public.scooters
  ALTER COLUMN name             SET NOT NULL,
  ALTER COLUMN name             SET DEFAULT 'Scooter',
  ALTER COLUMN price_per_day    SET NOT NULL,
  ALTER COLUMN price_per_day    SET DEFAULT 0,
  ALTER COLUMN images           SET NOT NULL,
  ALTER COLUMN images           SET DEFAULT '[]'::jsonb,
  ALTER COLUMN available        SET NOT NULL,
  ALTER COLUMN available        SET DEFAULT false,
  ALTER COLUMN category         SET NOT NULL,
  ALTER COLUMN category         SET DEFAULT 'automatic',
  ALTER COLUMN features         SET NOT NULL,
  ALTER COLUMN features         SET DEFAULT '[]'::jsonb,
  ALTER COLUMN specs            SET NOT NULL,
  ALTER COLUMN specs            SET DEFAULT '{}'::jsonb,
  ALTER COLUMN delivery_available  SET NOT NULL,
  ALTER COLUMN delivery_available  SET DEFAULT false,
  ALTER COLUMN delivery_fee        SET NOT NULL,
  ALTER COLUMN delivery_fee        SET DEFAULT 0,
  ALTER COLUMN helmet_included     SET NOT NULL,
  ALTER COLUMN helmet_included     SET DEFAULT false,
  ALTER COLUMN insurance_included  SET NOT NULL,
  ALTER COLUMN insurance_included  SET DEFAULT false,
  ALTER COLUMN min_rental_days     SET NOT NULL,
  ALTER COLUMN min_rental_days     SET DEFAULT 1,
  ALTER COLUMN passport_required   SET NOT NULL,
  ALTER COLUMN passport_required   SET DEFAULT false,
  ALTER COLUMN passport_copy_allowed SET NOT NULL,
  ALTER COLUMN passport_copy_allowed SET DEFAULT true,
  ALTER COLUMN is_premium_bike     SET NOT NULL,
  ALTER COLUMN is_premium_bike     SET DEFAULT false;

-- ─────────────────────────────────────────────────────────────
-- SHOPS — backfill NULLs then constrain
-- ─────────────────────────────────────────────────────────────

UPDATE public.shops SET name        = 'Shop'  WHERE name IS NULL OR name = '';
UPDATE public.shops SET verified    = false   WHERE verified IS NULL;
UPDATE public.shops SET description = ''      WHERE description IS NULL;
UPDATE public.shops SET address     = ''      WHERE address IS NULL;
UPDATE public.shops SET phone       = ''      WHERE phone IS NULL;
UPDATE public.shops SET gallery     = '[]'::jsonb WHERE gallery IS NULL;
UPDATE public.shops SET delivery_zones = '[]'::jsonb WHERE delivery_zones IS NULL;
UPDATE public.shops SET deposit_protected_member = false WHERE deposit_protected_member IS NULL;

ALTER TABLE public.shops
  ALTER COLUMN name        SET NOT NULL,
  ALTER COLUMN name        SET DEFAULT 'Shop',
  ALTER COLUMN verified    SET NOT NULL,
  ALTER COLUMN verified    SET DEFAULT false,
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN description SET DEFAULT '',
  ALTER COLUMN address     SET NOT NULL,
  ALTER COLUMN address     SET DEFAULT '',
  ALTER COLUMN phone       SET NOT NULL,
  ALTER COLUMN phone       SET DEFAULT '',
  ALTER COLUMN deposit_protected_member SET NOT NULL,
  ALTER COLUMN deposit_protected_member SET DEFAULT false;

-- ─────────────────────────────────────────────────────────────
-- CATEGORY CHECK CONSTRAINT — reject invalid enum values at DB level
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'scooters_category_check'
      AND table_name = 'scooters'
  ) THEN
    ALTER TABLE public.scooters
      ADD CONSTRAINT scooters_category_check
      CHECK (category IN ('automatic', 'manual', 'electric'));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- INDEX: speed up orphan detection queries
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_scooters_shop_id
  ON public.scooters (shop_id);

CREATE INDEX IF NOT EXISTS idx_scooters_available_location
  ON public.scooters (available, location)
  WHERE available = true;

COMMIT;
