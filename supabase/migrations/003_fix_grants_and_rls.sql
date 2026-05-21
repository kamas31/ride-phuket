-- ============================================================
-- Migration 003 — Fix table grants + RLS + shop insert policy
-- Resolves: code 42501 "permission denied for table"
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. GRANT PRIVILEGES ────────────────────────────────────
-- Supabase requires explicit GRANT on each table for RLS to even run.
-- Without GRANT, you get "permission denied" (42501) before RLS is checked.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON public.profiles  TO anon, authenticated, service_role;
GRANT ALL ON public.shops     TO anon, authenticated, service_role;
GRANT ALL ON public.scooters  TO anon, authenticated, service_role;
GRANT ALL ON public.bookings  TO anon, authenticated, service_role;
GRANT ALL ON public.payments  TO anon, authenticated, service_role;
GRANT ALL ON public.reviews   TO anon, authenticated, service_role;

-- Grant on sequences (needed for uuid generation via uuid_generate_v4 fallback)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Grant execute on all functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ── 2. FIX RLS POLICIES FOR SHOPS ──────────────────────────
-- The old policy "FOR ALL USING (...)" does NOT cover INSERT.
-- In Postgres: FOR INSERT requires WITH CHECK, not USING.

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view active shops"    ON public.shops;
DROP POLICY IF EXISTS "Shop owners can manage their shop" ON public.shops;

-- New policies with proper INSERT/UPDATE/DELETE separation

-- Anyone (including anon) can read active shops (for explore page)
CREATE POLICY "Public can view active shops"
  ON public.shops FOR SELECT
  USING (active = true);

-- Authenticated users can INSERT their own shop (for partner registration)
-- The key: owner_id must equal auth.uid() at insert time
CREATE POLICY "Authenticated can create shop"
  ON public.shops FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    OR owner_id IS NULL  -- allows unauthenticated submissions via service_role
  );

-- Shop owners can UPDATE their own shop
CREATE POLICY "Owner can update own shop"
  ON public.shops FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Shop owners can DELETE their own shop
CREATE POLICY "Owner can delete own shop"
  ON public.shops FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Service_role (server-side admin) bypasses RLS entirely when using:
-- createClient(url, SERVICE_ROLE_KEY, { auth: { ... } })
-- No extra policy needed for service_role.

-- ── 3. FIX RLS FOR SCOOTERS ────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view available scooters"    ON public.scooters;
DROP POLICY IF EXISTS "Shop owners can manage their scooters" ON public.scooters;

CREATE POLICY "Public can view available scooters"
  ON public.scooters FOR SELECT
  USING (available = true);

CREATE POLICY "Shop owner can insert scooter"
  ON public.scooters FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = scooters.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Shop owner can update scooter"
  ON public.scooters FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = scooters.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Shop owner can delete scooter"
  ON public.scooters FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = scooters.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- ── 4. FIX BOOKINGS RLS ────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own bookings"      ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings"              ON public.bookings;
DROP POLICY IF EXISTS "Users can update their pending bookings" ON public.bookings;
DROP POLICY IF EXISTS "Shops can view their bookings"          ON public.bookings;
DROP POLICY IF EXISTS "Shops can update booking status"        ON public.bookings;

CREATE POLICY "Rider can view own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Rider can create booking"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Rider can cancel pending booking"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Shop can view bookings for their shop"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = bookings.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Shop can update booking status"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = bookings.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- ── 5. PROFILES ────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "User can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "User can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger function needs INSERT to create profile on signup
CREATE POLICY "Service can insert profile"
  ON public.profiles FOR INSERT
  WITH CHECK (true);  -- trigger runs as SECURITY DEFINER, but policy still checked

-- ── 6. REVIEWS ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view reviews"                          ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews for completed bookings"  ON public.reviews;

CREATE POLICY "Public can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Rider can create review for completed booking"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = reviews.booking_id
      AND bookings.user_id = auth.uid()
      AND bookings.status = 'completed'
    )
  );

-- ── 7. PAYMENTS ────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their payments" ON public.payments;

CREATE POLICY "User can view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ── 8. APPLY MIGRATION 002 if not already done ─────────────
-- (Idempotent — uses IF NOT EXISTS / ON CONFLICT)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'rider'
  CONSTRAINT profiles_role_check CHECK (role IN ('rider', 'shop_owner'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;

-- Update trigger to include role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Rider'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'rider')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    role = COALESCE(EXCLUDED.role, public.profiles.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Helper function for role check
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
