-- Migration 015: event tracking table for first-party marketplace analytics

CREATE TABLE IF NOT EXISTS public.events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL    DEFAULT now(),
  event_type  TEXT        NOT NULL,
  session_id  TEXT,
  shop_id     UUID        REFERENCES public.shops(id)    ON DELETE SET NULL,
  scooter_id  UUID        REFERENCES public.scooters(id) ON DELETE SET NULL,
  metadata    JSONB       NOT NULL    DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS events_created_at_idx  ON public.events (created_at DESC);
CREATE INDEX IF NOT EXISTS events_shop_id_idx     ON public.events (shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS events_scooter_id_idx  ON public.events (scooter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS events_event_type_idx  ON public.events (event_type);
CREATE INDEX IF NOT EXISTS events_session_id_idx  ON public.events (session_id);

-- RLS: only service_role (admin client) can read/write.
-- All inserts go through the /api/events route which uses the admin client.
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.events IS
  'Marketplace intent signals. Writes via /api/events (admin client only).';
COMMENT ON COLUMN public.events.event_type IS
  'scooter_view | shop_view | whatsapp_click | phone_click | telegram_click | line_click | map_pin_click | search | filter_use';
