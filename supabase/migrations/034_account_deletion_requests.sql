-- ================================================================
-- 034 — Shop account deletion requests
-- Provides a self-service deletion request workflow for shop owners.
-- Immediate: deactivates all scooters. Reviewed within 30 days.
-- ================================================================

create table public.account_deletion_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  shop_id     uuid references public.shops(id) on delete set null,
  requested_at timestamptz default now() not null,
  processed_at timestamptz,
  notes       text
);

-- Only admins (service_role) may read/process deletion requests
alter table public.account_deletion_requests enable row level security;

-- Users can insert their own request (checked in server action via admin client)
-- No SELECT policy — users do not need to read this table back
