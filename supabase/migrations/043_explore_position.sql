-- Migration 043: Admin-controlled Explore position pin
--
-- Adds explore_position INTEGER (nullable) to scooters.
--
-- Semantics:
--   NULL    → unpinned; falls into normal score-based ordering
--   1, 2, 3 → pinned; sorted ascending before all unpinned scooters
--
-- Only affects the "Recommended" sort in Explore (sortByRecommended).
-- Price/rating sort modes are unaffected.
-- Writable only via the adminSetExplorePosition server action (is_admin check).

ALTER TABLE scooters
  ADD COLUMN IF NOT EXISTS explore_position INTEGER DEFAULT NULL;
