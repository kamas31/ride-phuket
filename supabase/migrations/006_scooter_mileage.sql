-- Migration 006 — Scooter mileage range
-- Run in Supabase SQL Editor

ALTER TABLE public.scooters
  ADD COLUMN IF NOT EXISTS mileage_range TEXT;

-- Allowed values: '0-10000' | '10000-20000' | '20000-30000' | '30000-50000' | '50000+'
-- Stored as enum-like text — no hard CHECK constraint to keep migrations simple.
