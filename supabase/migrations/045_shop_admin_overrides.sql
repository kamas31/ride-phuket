-- Migration 045: Admin display overrides for shop public page
--
-- Adds nullable override columns so admins can control what rating,
-- review count, and scooter count are displayed without touching
-- the real computed values.
--
-- Semantics (enforced at application layer):
--   admin_rating        → NULL = show real rating
--   admin_review_count  → NULL = show real review count
--   admin_scooter_count → NULL = show live scooter count
--   show_scooter_count  → false = hide all "X scooters available" labels

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS admin_rating        NUMERIC  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS admin_review_count  INTEGER  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS admin_scooter_count INTEGER  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS show_scooter_count  BOOLEAN  DEFAULT TRUE;
