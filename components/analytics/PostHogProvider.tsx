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
import { initPostHog, identifyUser, resetAnalytics, registerSuperProperties, syncSessionRecordingForRoute } from '@/lib/posthog'
import { captureAttribution, getAttributionProperties } from '@/lib/attribution'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useProfile()
  const pathname = usePathname()
  // undefined = not yet resolved this app load; null = resolved as anonymous.
  const prevProfileId = useRef<string | null | undefined>(undefined)

  // Re-evaluate the session-recording PII blocklist on every client-side
  // route change (initial load is handled inside initPostHog itself).
  useEffect(() => {
    syncSessionRecordingForRoute(pathname)
  }, [pathname])

  // Init + attribution + platform/session super properties — once per app load.
  useEffect(() => {
    initPostHog()
    captureAttribution()

    let mounted = true
    async function registerPlatform() {
      let platform: 'web' | 'ios_capacitor' = 'web'
      try {
        const { Capacitor } = await import('@capacitor/core')
        if (Capacitor.isNativePlatform()) platform = 'ios_capacitor'
      } catch {}
      if (!mounted) return
      registerSuperProperties({ platform, ...getAttributionProperties() })
    }
    registerPlatform()

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
      identifyUser(currentId, { role: profile?.role, is_admin: profile?.is_admin })
      registerSuperProperties({ auth_state: 'authenticated', role: profile?.role })
    } else {
      if (prevProfileId.current) resetAnalytics()
      registerSuperProperties({ auth_state: 'anonymous' })
    }
    prevProfileId.current = currentId
  }, [profile, loading])

  return <>{children}</>
}
