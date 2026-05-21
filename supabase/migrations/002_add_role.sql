-- ============================================================
-- Migration 002 — Role-based auth system
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add role column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'rider'
  CONSTRAINT profiles_role_check CHECK (role IN ('rider', 'shop_owner'));

-- 2. Add shop_id (nullable — set when shop owner's shop is approved)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;

-- 3. Update handle_new_user trigger to capture role from signup metadata
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

-- 4. Ensure trigger still exists (re-create if needed)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. New RLS policies for role-based access

-- Riders can read their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Shop owners can manage scooters belonging to their shop
DROP POLICY IF EXISTS "Shop owners can manage their scooters" ON public.scooters;
CREATE POLICY "Shop owners can manage their scooters"
  ON public.scooters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shops s
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE s.id = scooters.shop_id
      AND s.owner_id = auth.uid()
      AND p.role = 'shop_owner'
    )
  );

-- Shop owners can view bookings for their shop
DROP POLICY IF EXISTS "Shops can view their bookings" ON public.bookings;
CREATE POLICY "Shops can view their bookings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shops s
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE s.id = bookings.shop_id
      AND s.owner_id = auth.uid()
      AND p.role = 'shop_owner'
    )
  );

-- Shop owners can update booking status
DROP POLICY IF EXISTS "Shops can update booking status" ON public.bookings;
CREATE POLICY "Shops can update booking status"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.shops s
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE s.id = bookings.shop_id
      AND s.owner_id = auth.uid()
      AND p.role = 'shop_owner'
    )
  );

-- 6. Helper function: get current user role (safe, no RLS bypass needed)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
