-- Migration 020: add location_visibility to shops
-- Controls whether the public map shows exact pin or approximate zone

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS location_visibility text NOT NULL DEFAULT 'exact'
  CHECK (location_visibility IN ('exact', 'approximate'));
