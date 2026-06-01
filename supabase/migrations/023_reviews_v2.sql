-- Migration 023 — Reviews V2
-- Upgrades the review system:
--   • Drops the booking-required INSERT restriction (open reviews for any authenticated user)
--   • Adds UPDATE policy (riders can edit their own reviews)
--   • Adds owner_reply, updated_at to reviews
--   • Adds rating/review_count aggregates to shops
--   • Adds one-review-per-shop-per-user unique index
--   • Creates review_reports table
--   • Creates trigger to maintain shop rating/count aggregates

BEGIN;

-- ── 1. Add missing columns to reviews ────────────────────────────────────────

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS updated_at             TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS owner_reply            TEXT,
  ADD COLUMN IF NOT EXISTS owner_reply_created_at TIMESTAMPTZ;

-- ── 2. Add aggregate columns to shops ────────────────────────────────────────

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS rating       NUMERIC(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count INTEGER      NOT NULL DEFAULT 0;

-- ── 3. Unique partial index — one review per user per shop ───────────────────

CREATE UNIQUE INDEX IF NOT EXISTS reviews_shop_user_unique
  ON public.reviews (shop_id, user_id)
  WHERE shop_id IS NOT NULL;

-- ── 4. Update RLS on reviews ─────────────────────────────────────────────────

-- Drop old restrictive INSERT policy (required a completed booking)
DROP POLICY IF EXISTS "Rider can create review for completed booking" ON public.reviews;

-- Any authenticated user can leave a review (open platform model)
CREATE POLICY "Authenticated can create review"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Riders can edit their own reviews
CREATE POLICY "Rider can update own review"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 5. review_reports table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.review_reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   UUID        NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  shop_id     UUID        NOT NULL REFERENCES public.shops(id)   ON DELETE CASCADE,
  reporter_id UUID        NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  reason      TEXT        NOT NULL
    CHECK (reason IN ('never_rented','fake_review','harassment','spam','other')),
  details     TEXT,
  status      TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','reviewed','dismissed','removed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (review_id, reporter_id)
);

ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

-- Shop owners can file reports (server action validates they own the shop)
CREATE POLICY "Authenticated can report review"
  ON public.review_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Only service_role reads/updates reports (admin moderation)
GRANT ALL ON public.review_reports TO service_role;
GRANT INSERT ON public.review_reports TO authenticated;

-- ── 6. Trigger: maintain shops.rating and shops.review_count ─────────────────

CREATE OR REPLACE FUNCTION public.update_shop_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_shop_id UUID;
BEGIN
  -- Determine which shop was affected
  IF TG_OP = 'DELETE' THEN
    target_shop_id := OLD.shop_id;
  ELSE
    target_shop_id := NEW.shop_id;
  END IF;

  -- Only act when a shop_id is present (skip scooter-only reviews)
  IF target_shop_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  UPDATE public.shops
  SET
    rating       = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM public.reviews
      WHERE shop_id = target_shop_id
    ), 0),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE shop_id = target_shop_id
    )
  WHERE id = target_shop_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_update_shop_rating ON public.reviews;
CREATE TRIGGER trg_update_shop_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shop_rating();

-- ── 7. Backfill: compute current aggregates for all shops ────────────────────

UPDATE public.shops s
SET
  rating = COALESCE((
    SELECT ROUND(AVG(r.rating)::numeric, 2)
    FROM public.reviews r
    WHERE r.shop_id = s.id
  ), 0),
  review_count = COALESCE((
    SELECT COUNT(*)
    FROM public.reviews r
    WHERE r.shop_id = s.id
  ), 0);

-- ── 8. Index for fast review queries per shop ─────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_reviews_shop_id
  ON public.reviews (shop_id, created_at DESC)
  WHERE shop_id IS NOT NULL;

COMMIT;
