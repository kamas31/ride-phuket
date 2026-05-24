-- Migration 013 — Extended shop fields for Shop Settings dashboard
-- Run in Supabase SQL Editor

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS line_id          TEXT,
  ADD COLUMN IF NOT EXISTS telegram         TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_link TEXT,
  ADD COLUMN IF NOT EXISTS gallery          TEXT[] DEFAULT '{}';

-- Note: opening_hours (TEXT) stores a JSON string — no type change needed.
-- The app layer JSON.parse / JSON.stringify around this column.
