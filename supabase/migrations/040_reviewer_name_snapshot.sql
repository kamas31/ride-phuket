-- Migration 040: Snapshot reviewer display name on reviews
--
-- Problem: reviews.user_id joined to profiles.name at query time means that
-- changing a profile name retroactively renames all historical reviews.
--
-- Fix: store the display name at insert time in reviewer_name.
-- Display layer prefers this column; live profiles.name is fallback only.
--
-- Backfill note: existing reviews are populated with the CURRENT profiles.name.
-- There is no historical name log, so this is the best available approximation.
-- Reviews where the user has since been deleted will have reviewer_name = NULL
-- and will fall back to 'Anonymous' in the display layer.

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS reviewer_name TEXT;

-- Backfill existing reviews from current profile names
UPDATE public.reviews r
SET reviewer_name = p.name
FROM public.profiles p
WHERE r.user_id = p.id
  AND r.reviewer_name IS NULL;
