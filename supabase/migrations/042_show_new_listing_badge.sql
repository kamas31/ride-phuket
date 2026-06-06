-- Migration 042: Manual New Listing badge override
--
-- Adds show_new_listing_badge BOOLEAN (nullable) to scooters.
--
-- Tri-state semantics:
--   NULL  → automatic (use createdAt < 7-day threshold — unchanged behaviour)
--   TRUE  → force show badge regardless of age
--   FALSE → force hide badge regardless of age
--
-- Default NULL means zero impact on existing rows.

ALTER TABLE scooters
  ADD COLUMN IF NOT EXISTS show_new_listing_badge BOOLEAN DEFAULT NULL;
