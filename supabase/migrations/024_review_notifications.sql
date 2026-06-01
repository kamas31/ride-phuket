-- Migration 024 — Review notification read state
-- Adds a timestamp per shop tracking when the owner last viewed their reviews.
-- Any review with created_at > reviews_last_seen_at counts as "unread."

BEGIN;

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS reviews_last_seen_at TIMESTAMPTZ;

COMMIT;
