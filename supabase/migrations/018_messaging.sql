-- ================================================================
-- 018 — In-App Messaging System (Phase 1)
-- Run in: Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. conversations: one per rider-scooter pair (idempotent via unique constraint)
create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  scooter_id  uuid references public.scooters(id) on delete cascade not null,
  client_id   uuid references auth.users(id) on delete cascade not null,
  owner_id    uuid references auth.users(id) on delete cascade not null,
  created_at  timestamptz default now() not null,
  constraint conversations_scooter_client_unique unique (scooter_id, client_id)
);

-- 2. messages: each message in a conversation
create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid references public.conversations(id) on delete cascade not null,
  sender_id        uuid references auth.users(id) on delete cascade not null,
  content          text not null,
  read_at          timestamptz,
  created_at       timestamptz default now() not null,
  constraint messages_content_length check (char_length(content) between 1 and 1000)
);

-- 3. Indexes
create index conversations_client_id_idx  on public.conversations(client_id);
create index conversations_owner_id_idx   on public.conversations(owner_id);
create index messages_conversation_id_idx on public.messages(conversation_id);
create index messages_created_at_idx      on public.messages(conversation_id, created_at asc);

-- 4. Enable RLS
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

-- 5. conversations RLS
create policy "parties can view own conversations"
  on public.conversations for select
  using (auth.uid() = client_id or auth.uid() = owner_id);

create policy "rider can start a conversation"
  on public.conversations for insert
  with check (auth.uid() = client_id);

-- 6. messages RLS
create policy "parties can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.client_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

create policy "parties can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.client_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

create policy "parties can mark messages read"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.client_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

-- 7. Grant table access to authenticated users
grant select, insert        on public.conversations to authenticated;
grant select, insert, update on public.messages     to authenticated;

-- 8. Enable Realtime on messages table
alter publication supabase_realtime add table public.messages;
