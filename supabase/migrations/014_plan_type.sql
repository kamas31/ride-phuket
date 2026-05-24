-- Migration 014: shop plan system
-- Adds plan_type column. All existing shops default to 'founding_partner'
-- so no disruption to current partners.

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'founding_partner';

-- Backfill: any existing shops that somehow don't have a value get founding_partner
UPDATE public.shops SET plan_type = 'founding_partner' WHERE plan_type IS NULL;

COMMENT ON COLUMN public.shops.plan_type IS
  'Monetization tier: free | pro | premium | founding_partner';
