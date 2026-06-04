-- ================================================================
-- 033 — Preserve conversations when a scooter is deleted
-- Change conversations.scooter_id FK from ON DELETE CASCADE
-- to ON DELETE SET NULL so conversation history is retained.
-- ================================================================

-- Step 1: Drop the existing FK constraint (name from 018_messaging.sql)
alter table public.conversations
  drop constraint if exists conversations_scooter_id_fkey;

-- Step 2: Make the column nullable so SET NULL can work
alter table public.conversations
  alter column scooter_id drop not null;

-- Step 3: Re-add FK with ON DELETE SET NULL
alter table public.conversations
  add constraint conversations_scooter_id_fkey
  foreign key (scooter_id)
  references public.scooters(id)
  on delete set null;
