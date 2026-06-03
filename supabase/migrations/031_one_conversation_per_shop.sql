-- Migration 031 — One conversation per Rider↔Shop
--
-- Goal: enforce a single conversation between a rider and a shop owner
-- regardless of which scooter or page the conversation was started from.
-- Uniqueness key changes from:
--   (scooter_id, client_id)  [scooter conversations]
--   (shop_id, client_id)     [shop conversations]
-- to:
--   (client_id, owner_id)    [one thread per rider↔shop pair]
--
-- PREFLIGHT CHECK — run before applying to verify no existing duplicates:
--
--   SELECT client_id, owner_id, count(*) AS n
--   FROM conversations
--   WHERE client_id IS NOT NULL AND owner_id IS NOT NULL
--   GROUP BY client_id, owner_id
--   HAVING count(*) > 1;
--
-- If this returns rows, existing duplicate conversations must be resolved
-- before this migration can be applied (CREATE UNIQUE INDEX will fail).
--
-- Run in: Supabase Dashboard → SQL Editor

BEGIN;

-- Drop the two old partial unique indexes
DROP INDEX IF EXISTS conversations_scooter_client_idx;
DROP INDEX IF EXISTS conversations_shop_client_idx;

-- New: one conversation per (client, owner) pair.
-- Partial WHERE keeps deleted-user rows (NULL ids) outside the constraint.
CREATE UNIQUE INDEX conversations_client_owner_unique
  ON public.conversations(client_id, owner_id)
  WHERE client_id IS NOT NULL AND owner_id IS NOT NULL;

COMMIT;
