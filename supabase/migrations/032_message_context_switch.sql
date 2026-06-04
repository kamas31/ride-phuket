-- Migration 032 — System messages: scooter context-switch events
--
-- Adds a type discriminator and metadata payload to the messages table so the
-- timeline can carry system events (context_switch) alongside regular chat.
--
-- A context_switch row is inserted whenever a rider re-enters an existing
-- conversation from a different scooter. It is a sentinel — not a user message:
--   sender_id = NULL
--   content   = NULL
--   type      = 'context_switch'
--   metadata  = { "scooter_id": "...", "scooter_name": "..." }
--   read_at   = <insert timestamp>   ← pre-marked so it never counts as unread
--
-- Run in: Supabase Dashboard → SQL Editor

BEGIN;

-- content is currently NOT NULL.
-- context_switch events have no text; regular messages are unchanged.
ALTER TABLE public.messages
  ALTER COLUMN content DROP NOT NULL;

-- type discriminator with an allow-list constraint.
-- DEFAULT 'message' means all existing rows and new regular messages are correct
-- without any backfill.
ALTER TABLE public.messages
  ADD COLUMN type text NOT NULL DEFAULT 'message'
  CONSTRAINT messages_type_check CHECK (type IN ('message', 'context_switch'));

-- metadata for structured payloads on system events.
-- NULL on all regular messages.
ALTER TABLE public.messages
  ADD COLUMN metadata jsonb;

-- Partial index: fast lookup of the latest context_switch per conversation
-- (used by the idempotency check in insertContextSwitch).
CREATE INDEX messages_context_switch_idx
  ON public.messages(conversation_id, created_at DESC)
  WHERE type = 'context_switch';

COMMIT;
