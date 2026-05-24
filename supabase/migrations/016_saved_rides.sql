-- Migration 016 — Saved Rides: add scooter_id index + analytics support
-- The saved_scooters table was created in 012 (IF NOT EXISTS).
-- This migration adds the missing index on scooter_id for analytics queries
-- (e.g., "which scooters are most saved?") and prepares future shop intelligence.

-- Product branding: "Saved Rides" — DB table stays saved_scooters for stability.

-- Index for scooter-side analytics: most saved, high-intent inventory
CREATE INDEX IF NOT EXISTS idx_saved_scooters_scooter
  ON public.saved_scooters (scooter_id, created_at DESC);

-- Index for time-based analytics queries (trending saves, save velocity)
CREATE INDEX IF NOT EXISTS idx_saved_scooters_created
  ON public.saved_scooters (created_at DESC);

-- Comment for future shop analytics queries:
-- SELECT scooter_id, COUNT(*) AS save_count
-- FROM saved_scooters
-- WHERE created_at > now() - interval '30 days'
-- GROUP BY scooter_id ORDER BY save_count DESC;
