'use client'

import { useEffect } from 'react'
import { trackEvent, type EventType } from '@/lib/analytics'

interface TrackViewProps {
  eventType: EventType
  shopId?: string
  scooterId?: string
  metadata?: Record<string, unknown>
}

// Drop-in component for server pages: renders nothing, fires one tracking event on mount.
export function TrackView({ eventType, shopId, scooterId, metadata }: TrackViewProps) {
  useEffect(() => {
    trackEvent({ eventType, shopId, scooterId, metadata })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
