-- Temporary diagnostic table for push notification debugging.
-- Allows anonymous inserts so events are recorded even when the user
-- session is unavailable or the server action layer is bypassed entirely.
-- Remove this table once the push token registration issue is resolved.

create table if not exists push_debug_log (
  id         bigint generated always as identity primary key,
  event      text        not null,
  data       text,
  created_at timestamptz not null default now()
);

alter table push_debug_log enable row level security;

-- Anyone (anon or authenticated) can insert — debug logging must work
-- regardless of auth state.
create policy "push_debug_insert"
  on push_debug_log for insert
  to anon, authenticated
  with check (true);

-- Only authenticated users can read (so the user can check in Supabase
-- Table Editor while logged in to the dashboard).
create policy "push_debug_select"
  on push_debug_log for select
  to authenticated, service_role
  using (true);
