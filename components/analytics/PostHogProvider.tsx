'use client'

// PostHogProvider — mounts once in the root layout, alongside CapacitorProvider.
// Responsible for the parts of the PostHog lifecycle that only make sense at
// the app root: init, attribution capture, session-wide super properties,
// and identify/reset on auth transitions.
//
// Renders nothing visible — children pass through unchanged. If PostHog is
// unconfigured or fails to load, every call here silently no-ops (see
// lib/posthog.ts) and the rest of the app behaves exactly as if this
// provider didn't exist.

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { initPostHog, identifyUser, resetAnalytics, registerSuperProperties, syncSessionRecordingForRoute } from '@/lib/posthog'
import { captureAttribution, getAttributionProperties } from '@/lib/attribution'

// Init + attribution + platform super property — run at module scope, NOT
// inside a useEffect. This module is imported near the app root (see the
// doc comment above), so this runs during client-bundle script evaluation,
// before React starts rendering/hydrating the tree — which is before any
// component's own effects can fire, including TrackView's (it lives deeper
// in the tree than this provider, and React fires child effects before
// parent effects on mount, so a useEffect here would NOT reliably win that
// race). Confirmed live via a diagnostic log: `captureEvent('homepage_viewed', ...)`
// fired with `initialized=false` while this logic still lived in a
// useEffect — meaning that event was silently dropped, not just missing
// first_touch_*. Running at module scope instead means every business event
// this app ever fires — TrackView's on mount, posthog-js's own automatic
// first $pageview, everything — is guaranteed to see attribution already
// registered.
if (typeof window !== 'undefined') {
  initPostHog()
  captureAttribution()
  registerSuperProperties({ platform: 'web', ...getAttributionProperties() })
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useProfile()
  const { user } = useAuth()
  const pathname = usePathname()
  // undefined = not yet resolved this app load; null = resolved as anonymous.
  const prevProfileId = useRef<string | null | undefined>(undefined)

  // Re-evaluate the session-recording PII blocklist on every client-side
  // route change (initial load is handled inside initPostHog itself).
  useEffect(() => {
    syncSessionRecordingForRoute(pathname)
  }, [pathname])

  // Native-platform detection is the only genuinely async part (dynamic
  // import), so it stays in an effect and is allowed to register late —
  // `platform` isn't part of the attribution chain, so a brief `web` default
  // before this resolves on a native app is harmless.
  useEffect(() => {
    let mounted = true
    async function detectNativePlatform() {
      try {
        const { Capacitor } = await import('@capacitor/core')
        if (mounted && Capacitor.isNativePlatform()) {
          registerSuperProperties({ platform: 'ios_capacitor' })
        }
      } catch {}
    }
    detectNativePlatform()

    return () => { mounted = false }
  }, [])

  // Identify/reset on auth transitions only — reset() is skipped on the very
  // first resolution (anonymous-on-load), since that would otherwise discard
  // the anonymous distinct ID PostHog uses to link pre-signup events to the
  // post-signup person.
  useEffect(() => {
    if (loading) return

    const currentId = profile?.id ?? null
    if (currentId === prevProfileId.current) return

    if (currentId) {
      identifyUser(currentId, { role: profile?.role, is_admin: profile?.is_admin }, user?.email)
      registerSuperProperties({ auth_state: 'authenticated', role: profile?.role })
    } else {
      if (prevProfileId.current) resetAnalytics()
      registerSuperProperties({ auth_state: 'anonymous' })
    }
    prevProfileId.current = currentId
  }, [profile, loading])

  return <>{children}</>
}
