// PostHog wrapper — internal product/marketing analytics ONLY.
//
// Completely separate from lib/analytics.ts (the business-facing Supabase
// `events` system that powers shop dashboards). Never merge the two: this
// file must never be imported by lib/analytics.ts or app/api/events/route.ts,
// and vice versa. Call sites that need both fire two explicit, independent
// calls — see app/scooter/[id]/WhatsAppButton.tsx for the pattern.
//
// Safe by construction:
//   - No-ops entirely if NEXT_PUBLIC_POSTHOG_KEY/HOST are not set.
//   - Every exported function is wrapped so a PostHog failure (network,
//     blocked script, malformed call) can never throw into calling code.
//   - Browser-only — every function is a no-op during SSR.

import posthog from 'posthog-js'
import { getAreaForLocation } from '@/constants/areas'

let initialized = false

function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_POSTHOG_KEY &&
    process.env.NEXT_PUBLIC_POSTHOG_HOST
  )
}

// ── Event taxonomy ──────────────────────────────────────────────────────────
// PostHog's own taxonomy — deliberately named/scoped differently from
// lib/analytics.ts's EventType. Keep this list to events with a real,
// identifiable implementation point (no speculative/unused names).
export type PostHogEventName =
  | 'homepage_viewed'
  | 'explore_viewed'
  | 'hero_cta_clicked'
  | 'partner_cta_clicked'
  | 'cta_clicked'
  | 'scooter_viewed'
  | 'shop_viewed'
  | 'search_performed'
  | 'filter_used'
  | 'gallery_image_changed'
  | 'whatsapp_clicked'
  | 'phone_clicked'
  | 'conversation_started'
  | 'signup_completed'
  | 'login_completed'
  | 'shop_creation_started'
  | 'shop_creation_completed'
  | 'first_listing_published'
  | 'partner_dashboard_opened'

/**
 * Initialize PostHog once. No-ops if env vars are missing or already
 * initialized, and never throws — call from a single client component
 * mounted near the root layout (see components/analytics/PostHogProvider.tsx).
 */
export function initPostHog(): void {
  if (typeof window === 'undefined' || initialized || !isConfigured()) return

  try {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST as string,
      // SPA route changes (Next.js App Router client-side navigation) —
      // posthog-js patches history.pushState/replaceState to fire $pageview
      // automatically. No manual route-change tracking code needed.
      capture_pageview: 'history_change',
      capture_pageleave: 'if_capture_pageview',
      // Anonymous visitors never get a full person profile — only created
      // once identify() is called post-signup/login. Reduces data footprint
      // for the large share of traffic that never converts.
      person_profiles: 'identified_only',
      autocapture: true,
      enable_heatmaps: true,
      session_recording: {
        maskAllInputs: true,
      },
      // Feature flags: capability left on (the default) so flags can be
      // created and used later with zero further integration work. None are
      // referenced anywhere in this codebase yet.
      loaded: () => {
        initialized = true
        // Routes with PII rendered as plain text (not just form inputs) or
        // private conversation content are excluded from recording entirely.
        // posthog-js's declarative session_recording.urlBlocklist is a
        // remote-config-only option in this SDK version (not settable at
        // init), so the exclusion is enforced imperatively instead — see
        // syncSessionRecordingForRoute, called here for the landing route and
        // again on every client-side navigation from PostHogProvider.
        syncSessionRecordingForRoute(window.location.pathname)
      },
    })
  } catch {
    // Silent — app must work identically whether PostHog loads or not.
  }
}

// Routes with PII rendered as plain text or private conversation content —
// recording is stopped entirely on these rather than relying on per-element
// masking. Keep in sync with any new pages that render phone numbers,
// WhatsApp numbers, emails, addresses, or message contents.
const SESSION_RECORDING_BLOCKED_ROUTES: RegExp[] = [
  /^\/messages/,
  /^\/profile/,
  /^\/partner\/shop/,
  /^\/partner\/dashboard/,
  /^\/partner\/bookings/,
  /^\/partner\/availability/,
  /^\/contact/,
]

/**
 * Starts/stops session recording based on the current pathname. Call on
 * initial load (handled internally by initPostHog) and on every client-side
 * route change (see PostHogProvider).
 */
export function syncSessionRecordingForRoute(pathname: string): void {
  if (typeof window === 'undefined' || !initialized) return
  try {
    const shouldBlock = SESSION_RECORDING_BLOCKED_ROUTES.some(re => re.test(pathname))
    const isRecording = posthog.sessionRecordingStarted()
    if (shouldBlock && isRecording) posthog.stopSessionRecording()
    else if (!shouldBlock && !isRecording) posthog.startSessionRecording()
  } catch {
    // Silent.
  }
}

/** Fire-and-forget event capture. Never throws, never blocks the caller. */
export function captureEvent(
  eventName: PostHogEventName,
  properties?: Record<string, unknown>
): void {
  if (typeof window === 'undefined' || !initialized) return
  try {
    posthog.capture(eventName, properties)
  } catch {
    // Silent — analytics must never break a user-facing action.
  }
}

/**
 * Attach properties to every event for the rest of this browser session
 * only (cleared on tab close / new session) — used for scooter/shop page
 * context so individual capture() calls don't need to repeat it.
 */
export function registerSessionProperties(properties: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !initialized) return
  try {
    posthog.register_for_session(properties)
  } catch {
    // Silent.
  }
}

/**
 * Attach properties to every event indefinitely (until reset()) — used for
 * platform/auth-state context that applies across the whole visit, not just
 * one page.
 */
export function registerSuperProperties(properties: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !initialized) return
  try {
    posthog.register(properties)
  } catch {
    // Silent.
  }
}

/**
 * Identify an authenticated user. Pass ONLY the internal Supabase UUID as
 * the distinct ID and non-PII properties — never email, phone, WhatsApp
 * number, or message content.
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !initialized) return
  try {
    posthog.identify(userId, properties)
  } catch {
    // Silent.
  }
}

/** Call on logout — clears PostHog's local identity so the next anonymous session starts clean. */
export function resetAnalytics(): void {
  if (typeof window === 'undefined' || !initialized) return
  try {
    posthog.reset()
  } catch {
    // Silent.
  }
}

// ── Shared event-property builders ──────────────────────────────────────────
// Centralizes the scooter/shop context shape so every capture() call site
// (TrackView, WhatsAppButton, MessageOwnerButton, gallery, etc.) attaches the
// same fields without re-deriving them.

export function scooterProperties(scooter: {
  id: string
  shopId: string
  brand: string
  model: string
  category: string
  location: string
  pricePerDay: number
  pricePerWeek?: number
  pricePerMonth?: number
}): Record<string, unknown> {
  return {
    scooter_id: scooter.id,
    shop_id: scooter.shopId,
    brand: scooter.brand,
    model: scooter.model,
    category: scooter.category,
    area: getAreaForLocation(scooter.location)?.name ?? scooter.location,
    price_per_day: scooter.pricePerDay,
    price_per_week: scooter.pricePerWeek,
    price_per_month: scooter.pricePerMonth,
  }
}

export function shopProperties(shop: { id: string; name?: string; location?: string }): Record<string, unknown> {
  return {
    shop_id: shop.id,
    shop_name: shop.name,
    area: shop.location ? (getAreaForLocation(shop.location)?.name ?? shop.location) : undefined,
  }
}
