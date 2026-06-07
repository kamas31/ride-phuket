-- Migration 044: Add mobile_banner column to shops
--
-- Stores a separate 16:9 banner image optimised for mobile screens.
-- cover_image remains the desktop banner (4:1, 1600×400).
--
-- Fallback semantics (enforced at application layer, not DB):
--   Desktop: cover_image  → fallback to mobile_banner
--   Mobile:  mobile_banner → fallback to cover_image

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS mobile_banner TEXT DEFAULT NULL;
