// TikTok Pixel wrapper — browser-only. No Events API (server-side) here.
// Completely independent from lib/posthog.ts and lib/analytics.ts: never
// imported by either, never receives PII, never touches PostHog/Supabase
// attribution state.
//
// Safe by construction:
//   - No-ops entirely if NEXT_PUBLIC_TIKTOK_PIXEL_ID is not set.
//   - No-ops during SSR (window undefined).
//   - No-ops if window.ttq hasn't loaded yet / failed to load.
//   - Every exported function is wrapped so a TikTok Pixel failure (network,
//     blocked script, malformed call) can never throw into calling code.
//
// PageView: only the base snippet's own ttq.page() call (see
// components/analytics/TikTokPixel.tsx) fires on initial load. There is no
// usePathname()-driven re-fire on client-side route changes — verified live
// (real script, real pixel ID) that TikTok's own HistoryObserver plugin
// already fires exactly one automatic Pageview per History API pushState,
// which is exactly the mechanism Next.js App Router uses for client-side
// navigation. Adding a manual re-fire here would double-count. See
// docs/DECISIONS.md for the captured network evidence.
//
// trackTikTokPageView() is still exported as a safe, reusable primitive for
// any genuinely manual future call site (e.g. a virtual page change that
// does NOT go through pushState) — it is intentionally not wired into any
// automatic hook today.

export interface TtqObject {
  page: () => void
  track: (event: string, properties?: Record<string, unknown>) => void
  [key: string]: unknown
}

declare global {
  interface Window {
    ttq?: TtqObject
  }
}

export const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID

function isConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID)
}

function getTtq(): TtqObject | null {
  if (typeof window === 'undefined' || !isConfigured()) return null
  return window.ttq ?? null
}

/** Safe wrapper around ttq.page(). Not called automatically on navigation — see file header. */
export function trackTikTokPageView(): void {
  const ttq = getTtq()
  if (!ttq) return
  try {
    ttq.page()
  } catch {
    // Silent — analytics must never break navigation.
  }
}

export interface TikTokViewContentParams {
  content_id: string
  content_name: string
}

/** Fires TikTok's standard ViewContent event. content_type is always 'scooter' — no PII. */
export function trackTikTokViewContent({ content_id, content_name }: TikTokViewContentParams): void {
  const ttq = getTtq()
  if (!ttq) return
  try {
    ttq.track('ViewContent', {
      content_id,
      content_name,
      content_type: 'scooter',
    })
  } catch {
    // Silent.
  }
}

export interface TikTokContactParams {
  scooter_id?: string
  shop_id?: string
  placement?: string
}

/**
 * Fires TikTok's standard Contact event. Never pass a phone number, email,
 * customer name, or message content here — metadata only.
 */
export function trackTikTokContact(params: TikTokContactParams = {}): void {
  const ttq = getTtq()
  if (!ttq) return
  try {
    ttq.track('Contact', { ...params })
  } catch {
    // Silent.
  }
}
