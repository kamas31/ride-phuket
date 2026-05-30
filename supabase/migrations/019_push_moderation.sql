-- 019_push_moderation.sql
-- Push notification tokens, blocked users, message reports

-- ── push_tokens ────────────────────────────────────────────────────────────────

create table if not exists push_tokens (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  token       text        not null,
  platform    text        not null check (platform in ('ios', 'android')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, token)
);

alter table push_tokens enable row level security;

create policy "Users manage own push tokens"
  on push_tokens for all
  to authenticated
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── blocked_users ──────────────────────────────────────────────────────────────

create table if not exists blocked_users (
  id          uuid        primary key default gen_random_uuid(),
  blocker_id  uuid        not null references auth.users(id) on delete cascade,
  blocked_id  uuid        not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

alter table blocked_users enable row level security;

create policy "Users manage own blocks"
  on blocked_users for all
  to authenticated
  using  (blocker_id = auth.uid())
  with check (blocker_id = auth.uid());

-- ── message_reports ────────────────────────────────────────────────────────────

create table if not exists message_reports (
  id              uuid        primary key default gen_random_uuid(),
  reporter_id     uuid        not null references auth.users(id) on delete cascade,
  conversation_id uuid        not null references conversations(id) on delete cascade,
  reason          text        not null check (reason in ('spam', 'scam', 'harassment', 'other')),
  details         text,
  created_at      timestamptz not null default now()
);

alter table message_reports enable row level security;

create policy "Users submit own reports"
  on message_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());
