-- Migration 027 — Contact messages table
-- Stores in-app contact submissions so users do not need a mail client.
-- Same RLS pattern as feedback: authenticated users insert with their id,
-- anon users insert with null. No public read — admin only via service_role.

BEGIN;

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  subject    TEXT        NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 200),
  message    TEXT        NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_insert_contact"
  ON public.contact_messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "anon_insert_contact"
  ON public.contact_messages FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

COMMIT;
