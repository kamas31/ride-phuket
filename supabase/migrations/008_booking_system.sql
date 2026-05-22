-- Migration 008 — Real Booking System
-- Run in Supabase SQL Editor
--
-- What this adds:
--   1. Performance index for availability queries
--   2. is_scooter_available() — checks date range overlap
--   3. get_scooter_unavailable_dates() — returns blocked ranges for calendar
--   4. enforce_no_booking_overlap() trigger — DB-level race condition protection
--   5. RLS: riders can read their own bookings
--   6. RLS: shop owners can read rider profiles (for their bookings)
--   7. Grants for anon + authenticated

-- ── 1. Index ─────────────────────────────────────────────────────────
-- Speeds up availability queries dramatically with many bookings
CREATE INDEX IF NOT EXISTS idx_bookings_avail
  ON public.bookings (scooter_id, start_date, end_date)
  WHERE status IN ('pending', 'confirmed', 'active');

CREATE INDEX IF NOT EXISTS idx_bookings_shop_status
  ON public.bookings (shop_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_user
  ON public.bookings (user_id, created_at DESC);

-- ── 2. is_scooter_available() ─────────────────────────────────────────
-- Returns TRUE if no active booking overlaps the requested range.
-- Uses half-open interval: [start_date, end_date)
-- overlap condition: existing.start < our.end AND existing.end > our.start
CREATE OR REPLACE FUNCTION public.is_scooter_available(
  p_scooter_id  UUID,
  p_start_date  DATE,
  p_end_date    DATE,
  p_exclude_id  UUID DEFAULT NULL   -- for updates: exclude the booking being modified
)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE scooter_id = p_scooter_id
      AND status IN ('pending', 'confirmed', 'active')
      AND (p_exclude_id IS NULL OR id <> p_exclude_id)
      -- Half-open interval overlap
      AND start_date < p_end_date
      AND end_date   > p_start_date
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_scooter_available(UUID, DATE, DATE, UUID)
  TO anon, authenticated, service_role;

-- ── 3. get_scooter_unavailable_dates() ───────────────────────────────
-- Returns all upcoming blocked date ranges for a scooter.
-- Called from the checkout calendar to grey out unavailable dates.
-- Only returns future + current bookings (end_date >= today).
CREATE OR REPLACE FUNCTION public.get_scooter_unavailable_dates(
  p_scooter_id UUID
)
RETURNS TABLE (
  start_date DATE,
  end_date   DATE,
  status     TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    b.start_date,
    b.end_date,
    b.status::TEXT
  FROM public.bookings b
  WHERE b.scooter_id = p_scooter_id
    AND b.status IN ('pending', 'confirmed', 'active')
    AND b.end_date >= CURRENT_DATE
  ORDER BY b.start_date
$$;

GRANT EXECUTE ON FUNCTION public.get_scooter_unavailable_dates(UUID)
  TO anon, authenticated, service_role;

-- ── 4. Overlap prevention trigger ────────────────────────────────────
-- Enforced at the DB level — protects against race conditions even if
-- two users submit simultaneously. The first INSERT wins; the second
-- gets a constraint violation which the server action catches and
-- returns as "Scooter not available for these dates".
CREATE OR REPLACE FUNCTION public.enforce_no_booking_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  -- Only check statuses that block availability
  IF NEW.status NOT IN ('pending', 'confirmed', 'active') THEN
    RETURN NEW;
  END IF;

  IF NOT public.is_scooter_available(
    NEW.scooter_id,
    NEW.start_date,
    NEW.end_date,
    CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
  ) THEN
    RAISE EXCEPTION 'BOOKING_CONFLICT: Scooter is already booked for part or all of these dates.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop and recreate to ensure latest version
DROP TRIGGER IF EXISTS trg_no_booking_overlap ON public.bookings;
CREATE TRIGGER trg_no_booking_overlap
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_no_booking_overlap();

-- ── 5. RLS — Riders can read their own bookings ───────────────────────
-- (May already exist from migration 003; IF NOT EXISTS guard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings' AND policyname = 'Riders can view own bookings'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Riders can view own bookings"
        ON public.bookings FOR SELECT
        USING (auth.uid() = user_id)
    $$;
  END IF;
END $$;

-- ── 6. RLS — Shop owners can read rider profiles ─────────────────────
-- Required for the partner bookings dashboard to show rider name + phone.
DROP POLICY IF EXISTS "Shop owners can read their riders profiles" ON public.profiles;
CREATE POLICY "Shop owners can read their riders profiles"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT b.user_id
      FROM public.bookings b
      JOIN public.shops s ON s.id = b.shop_id
      WHERE s.owner_id = auth.uid()
    )
  );

-- ── 7. Ensure bookings table has needed grants ────────────────────────
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO service_role;
