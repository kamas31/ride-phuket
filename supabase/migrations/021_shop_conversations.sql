-- ================================================================
-- 021 — Shop-level conversations (no scooter required)
-- Run in: Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Add shop_id FK — lets conversations reference the shop directly
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE SET NULL;

-- 2. Backfill shop_id from scooters for all existing conversations
UPDATE conversations c
SET shop_id = s.shop_id
FROM scooters s
WHERE c.scooter_id = s.id AND c.shop_id IS NULL;

-- 3. Make scooter_id nullable (shop-level conversations have no scooter)
ALTER TABLE conversations
  ALTER COLUMN scooter_id DROP NOT NULL;

-- 4. Drop old unique constraint (required scooter_id NOT NULL)
ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_scooter_client_unique;

-- 5. Partial unique index for scooter conversations (existing behaviour)
CREATE UNIQUE INDEX IF NOT EXISTS conversations_scooter_client_idx
  ON conversations(scooter_id, client_id)
  WHERE scooter_id IS NOT NULL;

-- 6. Partial unique index for shop conversations (new)
CREATE UNIQUE INDEX IF NOT EXISTS conversations_shop_client_idx
  ON conversations(shop_id, client_id)
  WHERE scooter_id IS NULL;

-- 7. Index on shop_id for fast lookups
CREATE INDEX IF NOT EXISTS conversations_shop_id_idx
  ON conversations(shop_id);
