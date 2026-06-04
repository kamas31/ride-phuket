-- ================================================================
-- 036 — Efficient inbox query via LATERAL joins
-- Replaces the unbounded messages join in getAllConversations with
-- an aggregated approach: one row per conversation with last_message
-- data and unread_count computed in SQL.
-- ================================================================

create or replace function public.get_inbox_conversations(p_user_id uuid)
returns table (
  id                  uuid,
  scooter_id          uuid,
  shop_id             uuid,
  client_id           uuid,
  owner_id            uuid,
  created_at          timestamptz,
  last_message        text,
  last_message_at     timestamptz,
  last_message_sender uuid,
  unread_count        bigint,
  scooter_name        text,
  scooter_image       text,
  scooter_price       numeric,
  shop_name           text,
  shop_slug           text,
  shop_logo           text
)
language sql
security definer
stable
as $$
  select
    c.id,
    c.scooter_id,
    c.shop_id,
    c.client_id,
    c.owner_id,
    c.created_at,
    lm.content        as last_message,
    lm.created_at     as last_message_at,
    lm.sender_id      as last_message_sender,
    coalesce(uc.cnt, 0) as unread_count,
    s.name            as scooter_name,
    s.cover_image     as scooter_image,
    s.price_per_day   as scooter_price,
    sh.name           as shop_name,
    sh.slug           as shop_slug,
    sh.logo_url       as shop_logo
  from conversations c
  left join scooters s  on s.id = c.scooter_id
  left join shops    sh on sh.id = c.shop_id
  -- Latest real message (excludes system events)
  left join lateral (
    select content, created_at, sender_id
    from   messages m
    where  m.conversation_id = c.id
      and  (m.type is null or m.type = 'message')
    order  by m.created_at desc
    limit  1
  ) lm on true
  -- Unread count: messages not sent by this user, not yet read
  left join lateral (
    select count(*) as cnt
    from   messages m
    where  m.conversation_id = c.id
      and  (m.type is null or m.type = 'message')
      and  (m.sender_id != p_user_id or m.sender_id is null)
      and  m.read_at is null
  ) uc on true
  where c.client_id = p_user_id
     or c.owner_id  = p_user_id
  order by coalesce(lm.created_at, c.created_at) desc
$$;

grant execute on function public.get_inbox_conversations(uuid) to authenticated, service_role;
