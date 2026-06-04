-- ================================================================
-- 035 — Add review tracking columns to message_reports
-- Allows admins to mark reports as reviewed and record actions taken.
-- ================================================================

alter table public.message_reports
  add column if not exists reviewed_at  timestamptz,
  add column if not exists action_taken text;
