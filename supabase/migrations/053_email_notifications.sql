-- Migration 053 — Email notification preferences + WhatsApp lead tracking
-- Run in Supabase SQL Editor (copy everything below into the editor and run).
--
-- Adds two independent per-user email toggles (both ON by default), placed on
-- EVERY profile so the infrastructure is ready the moment an unclaimed shop is
-- claimed. Also adds a small whatsapp_leads table used to (a) de-duplicate the
-- WhatsApp-lead email so one visitor clicking repeatedly can't spam a shop, and
-- (b) give shops a real record of Koh Ride leads later.

-- ── 1. Two email toggles on profiles (default ON) ────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_notif_messages       BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_notif_whatsapp_leads BOOLEAN NOT NULL DEFAULT TRUE;

-- ── 2. WhatsApp lead tracking (dedup + future analytics) ─────────────────────
CREATE TABLE IF NOT EXISTS public.whatsapp_leads (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id     UUID        NOT NULL REFERENCES public.shops(id)    ON DELETE CASCADE,
  scooter_id  UUID                 REFERENCES public.scooters(id) ON DELETE SET NULL,
  rider_id    UUID                 REFERENCES auth.users(id)      ON DELETE SET NULL,  -- null when the visitor is anonymous
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast "did this shop already get a lead very recently?" dedup lookups.
CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_shop_recent
  ON public.whatsapp_leads (shop_id, created_at DESC);

-- ── 3. RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.whatsapp_leads ENABLE ROW LEVEL SECURITY;

-- Shop owners can read the leads for shops they own (for a future "leads" view).
CREATE POLICY "Shop owners read own leads"
  ON public.whatsapp_leads FOR SELECT
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

-- The server action writes leads via the service_role admin client (bypasses RLS).
GRANT ALL    ON public.whatsapp_leads TO service_role;
GRANT SELECT ON public.whatsapp_leads TO authenticated;
