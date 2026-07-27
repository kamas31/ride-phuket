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
// PageView: ttq.page() and TikTok's Standard Event "PageView" are two
// unrelated signals — verified live (real script, real pixel ID) that
// ttq.page()'s automatic HistoryObserver re-fire on client-side route
// changes only ever reproduces ttq.page()'s own internal analytics events
// ("Pageview"/"LandingPageView"/"EngagedSession"), never the Standard Event
// "PageView" that Test Events / Ads Manager conversion tooling reads. See
// ADR-067 (original, since-corrected conclusion) and ADR-068 (the
// correction + evidence) in docs/DECISIONS.md.
//
// trackTikTokPageView() therefore calls ttq.track('PageView') explicitly —
// there is no automatic equivalent for the Standard Event. It is wired to a
// usePathname()-driven tracker in components/analytics/TikTokPixel.tsx that
// skips the very first mount (the base snippet's own ttq.track('PageView')
// call already covers initial load), so it fires exactly once per route
// change — same single-source-of-truth guarantee as ViewContent/Contact.
// ttq.page() itself is kept in the base snippet: without it, the SDK never
// sends any beacon at all (verified in ADR-067), so it remains required
// "arming" even though it's no longer what drives PageView reporting.

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

/** Fires TikTok's Standard Event "PageView" — see file header for why this is ttq.track(), not ttq.page(). */
export function trackTikTokPageView(): void {
  const ttq = getTtq()
  if (!ttq) return
  try {
    ttq.track('PageView')
  } catch {
    // Silent — analytics must never break navigation.
  }
}

export interface TikTokViewContentParams {
  content_id: string
  content_name: string
}

/**
 * Fires TikTok's standard ViewContent event. content_type is always
 * 'product' — TikTok only accepts 'product' or 'product_group' here; it
 * rejected 'scooter' with "Content type is invalid in your event." No PII.
 */
export function trackTikTokViewContent({ content_id, content_name }: TikTokViewContentParams): void {
  const ttq = getTtq()
  if (!ttq) return
  try {
    ttq.track('ViewContent', {
      content_id,
      content_name,
      content_type: 'product',
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
