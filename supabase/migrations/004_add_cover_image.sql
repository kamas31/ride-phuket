-- ============================================================
-- Migration 004 — Add cover_image to scooters
-- Run in: Supabase Dashboard → SQL Editor
-- Backward compatible: nullable, falls back to images[0] in app
-- ============================================================

ALTER TABLE public.scooters
  ADD COLUMN IF NOT EXISTS cover_image TEXT;

COMMENT ON COLUMN public.scooters.cover_image IS
  'Explicit cover/hero image URL. Falls back to images[0] when NULL.';
