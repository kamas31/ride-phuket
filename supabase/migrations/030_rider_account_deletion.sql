-- Migration 030 — Rider account deletion: FK changes for safe hard delete
--
-- Problem: admin.auth.admin.deleteUser() fails with "Database error deleting user"
-- because several tables reference auth.users / profiles with NO ACTION (default
-- RESTRICT), blocking the DELETE at the DB level.
--
-- Fix: change every blocking constraint to SET NULL so business records survive
-- with the user_id / sender_id / client_id column nulled out (anonymised).
--
-- Scope: rider self-serve deletion only.
-- Shop owners are blocked at the app layer and require a separate flow.
--
-- Run in: Supabase Dashboard → SQL Editor

BEGIN;

-- ── 1. bookings.user_id ── profiles(id)  NO ACTION → SET NULL ────────────────
-- Booking history is a financial record for the shop. Survives with user_id NULL.
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ── 2. payments.user_id ── profiles(id)  NO ACTION → SET NULL ────────────────
-- Financial audit trail must survive account deletion.
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ── 3. reviews.user_id ── profiles(id)  NO ACTION → SET NULL ─────────────────
-- Reviews contribute to shop ratings. Removing them would silently alter a
-- shop's public score. Review survives anonymised; update_shop_rating trigger
-- continues to operate correctly on the surviving row.
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ── 4. rental_photos.uploaded_by ── auth.users(id)  NO ACTION → SET NULL ─────
-- Condition-evidence photos are a shop asset. Column was NOT NULL — drop that
-- constraint first so SET NULL can be written to existing rows at delete time.
ALTER TABLE public.rental_photos
  ALTER COLUMN uploaded_by DROP NOT NULL;

ALTER TABLE public.rental_photos
  DROP CONSTRAINT IF EXISTS rental_photos_uploaded_by_fkey;

ALTER TABLE public.rental_photos
  ADD CONSTRAINT rental_photos_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── 5. conversations.client_id ── auth.users(id)  CASCADE → SET NULL ──────────
-- Previous CASCADE deleted the entire thread on rider deletion, wiping the
-- shop owner's inbox. SET NULL keeps the conversation row; the shop owner still
-- sees the thread because their owner_id satisfies the RLS policy.
ALTER TABLE public.conversations
  ALTER COLUMN client_id DROP NOT NULL;

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_client_id_fkey;

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── 6. conversations.owner_id ── auth.users(id)  CASCADE → SET NULL ───────────
-- Symmetric change: if a shop owner is eventually deleted, the rider's thread
-- should survive rather than vanishing from their inbox.
ALTER TABLE public.conversations
  ALTER COLUMN owner_id DROP NOT NULL;

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_owner_id_fkey;

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── 7. messages.sender_id ── auth.users(id)  CASCADE → SET NULL ───────────────
-- Required for "messages remain visible to the other party". Without this change,
-- every message sent by the deleted user is cascade-deleted, leaving the surviving
-- conversation thread empty. Messages now orphan with sender_id = NULL instead.
ALTER TABLE public.messages
  ALTER COLUMN sender_id DROP NOT NULL;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL;

COMMIT;
