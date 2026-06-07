-- Migration 046: Shop-level toggle to hide "New listing" badge on scooter cards
--
-- When false, the New listing badge is suppressed for every scooter card
-- shown on that shop's public page. Per-scooter admin_new_listing_badge
-- overrides (from AdminBadgeControl) are unaffected.

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS show_new_listing_badges BOOLEAN DEFAULT TRUE;
