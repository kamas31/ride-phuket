-- Migration 005 — Shop premium fields
-- Run in Supabase SQL Editor

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS cover_image     TEXT,
  ADD COLUMN IF NOT EXISTS delivery_zones  TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS opening_hours   TEXT,
  ADD COLUMN IF NOT EXISTS instagram       TEXT,
  ADD COLUMN IF NOT EXISTS website         TEXT;

-- Ensure every shop has a valid SEO-friendly slug
-- (slug column already exists from the initial schema)
UPDATE public.shops
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'),
    '\s+', '-', 'g'
  )
)
WHERE slug IS NULL OR slug = '';

-- Guarantee slug uniqueness by appending part of the id if needed
DO $$
DECLARE
  r RECORD;
  base_slug TEXT;
  i INT;
BEGIN
  FOR r IN SELECT id, slug FROM public.shops ORDER BY created_at LOOP
    base_slug := r.slug;
    i := 2;
    WHILE EXISTS (SELECT 1 FROM public.shops WHERE slug = r.slug AND id <> r.id) LOOP
      UPDATE public.shops SET slug = base_slug || '-' || i WHERE id = r.id;
      i := i + 1;
    END LOOP;
  END LOOP;
END $$;
