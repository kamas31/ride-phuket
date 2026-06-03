-- Migration 026 — Feedback table
-- Stores MVP user feedback. user_id is nullable to allow anonymous submissions
-- from the footer (unauthenticated visitors). Admin reads via service_role only.

BEGIN;

CREATE TABLE IF NOT EXISTS public.feedback (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  type       TEXT        NOT NULL CHECK (type IN ('bug_report', 'feature_request', 'general')),
  message    TEXT        NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Authenticated users can submit feedback tied to their account
CREATE POLICY "authenticated_insert_feedback"
  ON public.feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Anon users can submit feedback (user_id must be null)
CREATE POLICY "anon_insert_feedback"
  ON public.feedback FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- No SELECT policy — feedback is read-only via service_role (admin)

COMMIT;
