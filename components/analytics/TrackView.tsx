'use client'

import { useEffect } from 'react'
import { trackEvent, type EventType } from '@/lib/analytics'
import { captureEvent, registerSessionProperties, type PostHogEventName } from '@/lib/posthog'

interface TrackViewProps {
  // Omit on pages that have no business-facing event (e.g. the homepage) —
  // only the PostHog side fires in that case.
  eventType?: EventType
  shopId?: string
  scooterId?: string
  metadata?: Record<string, unknown>
  // Optional PostHog dual-dispatch — independent event name/properties, since
  // PostHog's taxonomy and the business `events` table don't always share a
  // shape. Omit on call sites that only need the business-facing event.
  posthogEvent?: PostHogEventName
  posthogProperties?: Record<string, unknown>
  // When true, posthogProperties is also registered as session properties so
  // other components on the same page (e.g. ImageGallery) automatically tag
  // their own events with this scooter/shop context — without re-deriving it.
  registerAsSessionProperties?: boolean
}

// Drop-in component for server pages: renders nothing, fires one tracking event on mount.
export function TrackView({ eventType, shopId, scooterId, metadata, posthogEvent, posthogProperties, registerAsSessionProperties }: TrackViewProps) {
  useEffect(() => {
    if (eventType) trackEvent({ eventType, shopId, scooterId, metadata })
    if (posthogEvent) captureEvent(posthogEvent, posthogProperties)
    if (registerAsSessionProperties && posthogProperties) registerSessionProperties(posthogProperties)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
