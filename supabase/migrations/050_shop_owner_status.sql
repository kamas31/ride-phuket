-- Migration 050: Admin-created unclaimed shops (Phase 1)
--
-- Allows an admin to create and manage a shop before its real owner has
-- an account. shops.owner_id was already nullable (schema.sql) — these
-- columns track *why* it's null and audit who created/invited/claimed it.
-- Owner invite/claim flow itself is NOT implemented in this migration —
-- only the columns needed to support it later.
--
-- Existing shops all have a real owner_id already, so they backfill to
-- owner_status = 'claimed' automatically via the DEFAULT — no separate
-- UPDATE statement needed.

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS owner_status TEXT NOT NULL DEFAULT 'claimed',
  ADD COLUMN IF NOT EXISTS invited_owner_email TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES profiles(id) DEFAULT NULL;

ALTER TABLE shops
  DROP CONSTRAINT IF EXISTS shops_owner_status_check;

ALTER TABLE shops
  ADD CONSTRAINT shops_owner_status_check
    CHECK (owner_status IN ('unclaimed', 'invited', 'claimed'));

-- ── Harden shops INSERT policy ──────────────────────────────────────────────
-- The previous policy (migration 003) allowed owner_id IS NULL for ANY
-- authenticated user — a latent gap, never exercised by app code, since no
-- UI ever submitted owner_id = NULL. Unclaimed-shop creation now goes
-- exclusively through the adminCreateShop server action using the
-- service_role client, which bypasses RLS entirely. Normal authenticated
-- users no longer need (or get) the owner_id IS NULL branch.
DROP POLICY IF EXISTS "Authenticated can create shop" ON public.shops;

CREATE POLICY "Authenticated can create own shop"
  ON public.shops FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());
