-- Migration 010 — Inquiry system (internal pre-booking messaging)
-- Run in Supabase SQL Editor
--
-- Replaces direct WhatsApp links for pre-booking questions.
-- Riders submit questions → stored here → shop answers from dashboard.
-- Answered public inquiries become the scooter's FAQ section.

CREATE TABLE IF NOT EXISTS public.inquiries (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scooter_id      UUID        NOT NULL REFERENCES public.scooters(id)  ON DELETE CASCADE,
  shop_id         UUID        NOT NULL REFERENCES public.shops(id)     ON DELETE CASCADE,
  rider_id        UUID                 REFERENCES auth.users(id)       ON DELETE SET NULL,
  question_type   TEXT        NOT NULL,  -- 'ask_delivery' | 'ask_deposit' | ...
  question        TEXT        NOT NULL,
  answer          TEXT,
  answered_at     TIMESTAMPTZ,
  is_public       BOOLEAN     NOT NULL DEFAULT TRUE,  -- answered inquiries shown as FAQ
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_scooter  ON public.inquiries (scooter_id, is_public, answered_at);
CREATE INDEX IF NOT EXISTS idx_inquiries_shop     ON public.inquiries (shop_id, answered_at IS NULL, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_rider    ON public.inquiries (rider_id, created_at DESC);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- ── RLS policies ──────────────────────────────────────────────────────────────

-- Anyone (incl. anonymous) can read public answered inquiries (the FAQ)
CREATE POLICY "Public answered inquiries are visible"
  ON public.inquiries FOR SELECT
  USING (is_public = TRUE AND answer IS NOT NULL);

-- Riders can always read their own inquiries (including unanswered)
DROP POLICY IF EXISTS "Riders can read own inquiries" ON public.inquiries;
CREATE POLICY "Riders can read own inquiries"
  ON public.inquiries FOR SELECT
  USING (auth.uid() = rider_id);

-- Authenticated riders can submit
CREATE POLICY "Authenticated users can submit inquiries"
  ON public.inquiries FOR INSERT
  WITH CHECK (auth.uid() = rider_id OR rider_id IS NULL);

-- Shop owners can read + answer inquiries for their shop
DROP POLICY IF EXISTS "Shop owners manage inquiries" ON public.inquiries;
CREATE POLICY "Shop owners manage inquiries"
  ON public.inquiries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = shop_id AND s.owner_id = auth.uid()
    )
  );

GRANT SELECT, INSERT ON public.inquiries TO anon;
GRANT SELECT, INSERT, UPDATE ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;
