-- Migration 009 — Notification system
-- Run in Supabase SQL Editor
--
-- Minimal but extensible in-app notification table.
-- Designed to support push + email later without schema changes.
-- Currently used for: booking confirmations, cancellations.

CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL,  -- 'booking_confirmed' | 'booking_cancelled' | 'booking_received'
  title       TEXT        NOT NULL,
  body        TEXT,
  data        JSONB       NOT NULL DEFAULT '{}',  -- booking_id, scooter_name, etc.
  read        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast unread badge count
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, read, created_at DESC)
  WHERE read = FALSE;

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark own notifications as read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role creates notifications server-side (bypasses RLS safely)
GRANT ALL   ON public.notifications TO service_role;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
