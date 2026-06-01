-- Migration 022: add show_opening_hours flag to shops
-- Allows shop owners to hide opening hours from the public page
-- (useful for independent renters without fixed hours)

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS show_opening_hours boolean NOT NULL DEFAULT true;
