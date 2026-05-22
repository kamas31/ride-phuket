-- Migration 011 — Trust Layer: Deposit Protection + Rental Photos + Disputes
-- Run in Supabase SQL Editor
--
-- Adds:
--   1. Deposit fields on scooters (amount, type, passport rules, premium flag)
--   2. Deposit protection membership on shops
--   3. rental_photos table (check-in / check-out evidence)
--   4. disputes table (damage / charge disputes with evidence)

-- ── 1. Scooter deposit fields ─────────────────────────────────────────────────

ALTER TABLE public.scooters
  ADD COLUMN IF NOT EXISTS deposit_amount       INTEGER,       -- THB, NULL = not specified
  ADD COLUMN IF NOT EXISTS deposit_type         TEXT,          -- 'cash' | 'card_hold' | 'flexible' | 'none'
  ADD COLUMN IF NOT EXISTS passport_required    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS passport_copy_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_premium_bike      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deposit_notes        TEXT;          -- free-text for custom info

-- ── 2. Shop deposit protection membership ──────────────────────────────────────

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS deposit_protected_member BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dp_enrolled_at           DATE;

-- ── 3. rental_photos table ─────────────────────────────────────────────────────
-- Stores pre-rental and post-rental condition photos.
-- Used as evidence in disputes. Uploaded by shop owner.

CREATE TABLE IF NOT EXISTS public.rental_photos (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id   UUID        NOT NULL REFERENCES public.bookings(id)  ON DELETE CASCADE,
  shop_id      UUID        NOT NULL REFERENCES public.shops(id)     ON DELETE CASCADE,
  phase        TEXT        NOT NULL,     -- 'check_in' | 'check_out'
  photo_urls   TEXT[]      NOT NULL DEFAULT '{}',
  notes        TEXT,
  uploaded_by  UUID        NOT NULL REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_photos_booking ON public.rental_photos (booking_id, phase);

ALTER TABLE public.rental_photos ENABLE ROW LEVEL SECURITY;

-- Shop owners can manage their rental photos
CREATE POLICY "Shop owners manage rental photos"
  ON public.rental_photos FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid())
  );

-- Riders with a booking can read photos for their booking
CREATE POLICY "Riders can view their booking photos"
  ON public.rental_photos FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.user_id = auth.uid())
  );

GRANT SELECT ON public.rental_photos TO authenticated;
GRANT ALL    ON public.rental_photos TO service_role;

-- ── 4. disputes table ─────────────────────────────────────────────────────────
-- Rider-opened damage / charge disputes with evidence photos.
-- Flow: open → under_review → resolved / dismissed

CREATE TABLE IF NOT EXISTS public.disputes (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id      UUID        NOT NULL REFERENCES public.bookings(id)  ON DELETE CASCADE,
  rider_id        UUID        NOT NULL REFERENCES auth.users(id)        ON DELETE CASCADE,
  shop_id         UUID        NOT NULL REFERENCES public.shops(id)      ON DELETE CASCADE,
  reason          TEXT        NOT NULL,  -- 'unfair_charge' | 'damage_claim' | 'other'
  description     TEXT        NOT NULL,
  evidence_urls   TEXT[]      NOT NULL DEFAULT '{}',
  status          TEXT        NOT NULL DEFAULT 'open',
  -- 'open' | 'under_review' | 'resolved_rider' | 'resolved_shop' | 'dismissed'
  resolution_note TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_booking ON public.disputes (booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_rider   ON public.disputes (rider_id, status);
CREATE INDEX IF NOT EXISTS idx_disputes_shop    ON public.disputes (shop_id, status);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Riders can create + view their own disputes
CREATE POLICY "Riders manage own disputes"
  ON public.disputes FOR ALL
  USING (auth.uid() = rider_id);

-- Shop owners can read disputes for their shop
CREATE POLICY "Shop owners view their disputes"
  ON public.disputes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid())
  );

GRANT SELECT, INSERT ON public.disputes TO authenticated;
GRANT ALL             ON public.disputes TO service_role;
