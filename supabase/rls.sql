-- ============================================================
-- Koh Ride — Row Level Security Policies
-- ============================================================
-- Run AFTER schema.sql

-- Enable RLS on all tables
alter table public.profiles  enable row level security;
alter table public.shops      enable row level security;
alter table public.scooters   enable row level security;
alter table public.bookings   enable row level security;
alter table public.payments   enable row level security;
alter table public.reviews    enable row level security;

-- ============================================================
-- PROFILES
-- ============================================================
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup (via trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Rider'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- SHOPS
-- ============================================================
create policy "Anyone can view active shops"
  on public.shops for select
  using (active = true);

create policy "Shop owners can manage their shop"
  on public.shops for all
  using (auth.uid() = owner_id);

-- ============================================================
-- SCOOTERS
-- ============================================================
create policy "Anyone can view available scooters"
  on public.scooters for select
  using (available = true);

create policy "Shop owners can manage their scooters"
  on public.scooters for all
  using (
    exists (
      select 1 from public.shops
      where shops.id = scooters.shop_id
      and shops.owner_id = auth.uid()
    )
  );

-- ============================================================
-- BOOKINGS
-- ============================================================
create policy "Users can view their own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "Users can create bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their pending bookings"
  on public.bookings for update
  using (auth.uid() = user_id and status = 'pending');

create policy "Shops can view their bookings"
  on public.bookings for select
  using (
    exists (
      select 1 from public.shops
      where shops.id = bookings.shop_id
      and shops.owner_id = auth.uid()
    )
  );

create policy "Shops can update booking status"
  on public.bookings for update
  using (
    exists (
      select 1 from public.shops
      where shops.id = bookings.shop_id
      and shops.owner_id = auth.uid()
    )
  );

-- ============================================================
-- PAYMENTS
-- ============================================================
create policy "Users can view their payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- ============================================================
-- REVIEWS
-- ============================================================
create policy "Anyone can view reviews"
  on public.reviews for select
  using (true);

create policy "Users can create reviews for completed bookings"
  on public.reviews for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.bookings
      where bookings.id = reviews.booking_id
      and bookings.user_id = auth.uid()
      and bookings.status = 'completed'
    )
  );
