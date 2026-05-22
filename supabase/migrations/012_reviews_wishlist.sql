-- Migration 012 — Reviews gate + Wishlist schema
-- Run in Supabase SQL Editor

-- ── 1. Reviews — enforce booking-before-review constraint ────────────────────
-- The existing `reviews` table allows any user to post a review.
-- This migration adds a trigger that sets verified=FALSE unless a completed
-- booking exists for the same user + scooter.

CREATE OR REPLACE FUNCTION public.validate_review_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the rider has a completed booking for this scooter
  IF NEW.scooter_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.bookings
      WHERE user_id   = NEW.user_id
        AND scooter_id = NEW.scooter_id
        AND status     = 'completed'
    ) THEN
      -- Allow insert but mark as unverified (not suppressed, just tagged)
      NEW.verified := FALSE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_review ON public.reviews;
CREATE TRIGGER trg_validate_review
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_review_booking();

-- Index for fast review lookup per scooter
CREATE INDEX IF NOT EXISTS idx_reviews_scooter
  ON public.reviews (scooter_id, verified, created_at DESC);

-- ── 2. Saved scooters (wishlist) — future DB sync ─────────────────────────────
-- Currently the wishlist is localStorage-only (V1).
-- This table is ready for when we want to sync across devices.

CREATE TABLE IF NOT EXISTS public.saved_scooters (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  scooter_id  UUID        NOT NULL REFERENCES public.scooters(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, scooter_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_scooters_user ON public.saved_scooters (user_id, created_at DESC);

ALTER TABLE public.saved_scooters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved scooters"
  ON public.saved_scooters FOR ALL
  USING (auth.uid() = user_id);

GRANT ALL ON public.saved_scooters TO authenticated;
GRANT ALL ON public.saved_scooters TO service_role;
