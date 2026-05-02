-- ============================================================
-- Ride Phuket — Supabase Schema v1
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis"; -- for geospatial queries

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text not null,
  avatar_url   text,
  phone        text,
  nationality  text,
  passport_number text,
  license_number  text,
  verified     boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ============================================================
-- SHOPS
-- ============================================================
create table public.shops (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid references public.profiles(id),
  name          text not null,
  slug          text unique not null,
  description   text,
  logo_url      text,
  location      text not null,
  address       text,
  lat           decimal(9,6),
  lng           decimal(9,6),
  phone         text,
  whatsapp      text,
  verified      boolean default false,
  active        boolean default true,
  response_time text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index shops_location_idx on public.shops(location);
create index shops_verified_idx on public.shops(verified);

-- ============================================================
-- SCOOTERS
-- ============================================================
create table public.scooters (
  id                  uuid primary key default uuid_generate_v4(),
  shop_id             uuid references public.shops(id) on delete cascade,
  name                text not null,
  brand               text not null,
  model               text not null,
  year                int,
  category            text check (category in ('automatic', 'manual', 'electric')),
  images              text[] default '{}',

  -- Pricing (in THB)
  price_per_day       int not null,
  price_per_week      int,
  price_per_month     int,

  -- Location
  location            text,
  lat                 decimal(9,6),
  lng                 decimal(9,6),

  -- Specs (JSONB for flexibility)
  specs               jsonb default '{}',

  -- Features
  features            text[] default '{}',
  delivery_available  boolean default false,
  delivery_fee        int default 0,
  helmet_included     boolean default true,
  insurance_included  boolean default true,
  min_rental_days     int default 1,

  -- Status
  available           boolean default true,
  description         text,

  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index scooters_shop_idx     on public.scooters(shop_id);
create index scooters_location_idx on public.scooters(location);
create index scooters_category_idx on public.scooters(category);
create index scooters_available_idx on public.scooters(available);
create index scooters_price_idx    on public.scooters(price_per_day);

-- ============================================================
-- BOOKINGS
-- ============================================================
create table public.bookings (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references public.profiles(id),
  scooter_id       uuid references public.scooters(id),
  shop_id          uuid references public.shops(id),

  status           text default 'pending'
                   check (status in ('pending', 'confirmed', 'active', 'completed', 'cancelled')),

  start_date       date not null,
  end_date         date not null,
  total_days       int generated always as (end_date - start_date) stored,

  daily_rate       int not null,
  delivery_fee     int default 0,
  total_amount     int not null,

  delivery_method  text check (delivery_method in ('delivery', 'pickup')),
  delivery_address text,
  pickup_location  text,

  payment_status   text default 'pending'
                   check (payment_status in ('pending', 'paid', 'refunded')),
  payment_method   text,

  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index bookings_user_idx      on public.bookings(user_id);
create index bookings_scooter_idx   on public.bookings(scooter_id);
create index bookings_shop_idx      on public.bookings(shop_id);
create index bookings_status_idx    on public.bookings(status);
create index bookings_dates_idx     on public.bookings(start_date, end_date);

-- ============================================================
-- PAYMENTS
-- ============================================================
create table public.payments (
  id             uuid primary key default uuid_generate_v4(),
  booking_id     uuid references public.bookings(id),
  user_id        uuid references public.profiles(id),
  amount         int not null,
  currency       text default 'THB',
  method         text, -- 'cash', 'stripe', 'promptpay', 'transfer'
  status         text default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  reference      text,
  created_at     timestamptz default now()
);

create index payments_booking_idx on public.payments(booking_id);

-- ============================================================
-- REVIEWS
-- ============================================================
create table public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id),
  booking_id  uuid references public.bookings(id),
  scooter_id  uuid references public.scooters(id),
  shop_id     uuid references public.shops(id),
  rating      int check (rating >= 1 and rating <= 5),
  comment     text,
  verified    boolean default false, -- true if booking exists
  created_at  timestamptz default now()
);

create index reviews_scooter_idx on public.reviews(scooter_id);
create index reviews_shop_idx    on public.reviews(shop_id);

-- ============================================================
-- COMPUTED: SCOOTER RATINGS (materialized view)
-- ============================================================
create materialized view public.scooter_ratings as
  select
    scooter_id,
    round(avg(rating)::numeric, 1) as avg_rating,
    count(*) as review_count
  from public.reviews
  where scooter_id is not null
  group by scooter_id;

create unique index on public.scooter_ratings(scooter_id);

-- ============================================================
-- STORAGE BUCKETS (run via Supabase dashboard or CLI)
-- ============================================================
-- bucket: avatars          (public: true,  max: 5MB,  types: image/*)
-- bucket: scooter-images   (public: true,  max: 10MB, types: image/*)
-- bucket: documents        (public: false, max: 20MB, types: image/*, application/pdf)
