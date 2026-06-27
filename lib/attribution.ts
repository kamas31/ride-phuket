// Marketing attribution capture — UTM/referrer/click-ID, first-touch +
// last-touch. PostHog-only concern: never read by lib/analytics.ts or the
// business `events` table.
//
// First-touch (localStorage, write-once): "how did this device ever
// discover Koh Ride" — never overwritten once set.
// Last-touch (sessionStorage, written on every fresh app load): "what
// brought them back this time" — recomputed every session, defaults to
// 'direct' when no UTM/referrer is present.
//
// TikTok organic note: only the shared bio link can be tagged (one utm_source
// value for ALL videos) — there is no per-video attribution possible here or
// anywhere else; this module is intentionally generic and works identically
// for any channel that can attach UTM params to a link (paid ads, influencer
// links, QR codes, dedicated landing pages) with zero changes required later.

interface AttributionBundle {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  gclid?: string
  fbclid?: string
  ttclid?: string
  referrer: string
  landing_page: string
}

const FIRST_TOUCH_KEY = 'rp_first_touch'
const LAST_TOUCH_KEY  = 'rp_last_touch'

function readCurrentTouch(): AttributionBundle {
  const params = new URLSearchParams(window.location.search)
  const bundle: AttributionBundle = {
    referrer: document.referrer || 'direct',
    landing_page: window.location.pathname,
  }

  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
  for (const key of utmKeys) {
    const value = params.get(key)
    if (value) bundle[key] = value
  }

  const clickIds = ['gclid', 'fbclid', 'ttclid'] as const
  for (const key of clickIds) {
    const value = params.get(key)
    if (value) bundle[key] = value
  }

  return bundle
}

/**
 * Call once per app load (see PostHogProvider). Persists first-touch
 * (write-once) and last-touch (every load), never throws.
 */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return

  try {
    const current = readCurrentTouch()

    try { sessionStorage.setItem(LAST_TOUCH_KEY, JSON.stringify(current)) } catch {}

    try {
      if (!localStorage.getItem(FIRST_TOUCH_KEY)) {
        localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(current))
      }
    } catch {}
  } catch {
    // Silent — attribution must never block app startup.
  }
}

/**
 * Returns the merged first/last-touch bundle as flat, prefixed properties
 * ready to register as PostHog super properties. Safe to call repeatedly;
 * returns {} if nothing has been captured yet or storage is unavailable.
 */
export function getAttributionProperties(): Record<string, unknown> {
  if (typeof window === 'undefined') return {}

  const out: Record<string, unknown> = {}

  try {
    const firstRaw = localStorage.getItem(FIRST_TOUCH_KEY)
    if (firstRaw) {
      const first = JSON.parse(firstRaw) as AttributionBundle
      for (const [k, v] of Object.entries(first)) out[`first_touch_${k}`] = v
    }
  } catch {}

  try {
    const lastRaw = sessionStorage.getItem(LAST_TOUCH_KEY)
    if (lastRaw) {
      const last = JSON.parse(lastRaw) as AttributionBundle
      for (const [k, v] of Object.entries(last)) out[`last_touch_${k}`] = v
    }
  } catch {}

  return out
}
