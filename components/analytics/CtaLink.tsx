'use client'

// Thin Link wrapper that fires a PostHog event on click before navigating.
// Exists because Server Components cannot pass inline event handlers to
// next/link directly — this is the one client boundary needed for that.
// Forwards every Link prop unchanged, so visuals/behavior are identical to a
// plain <Link>.

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { captureEvent, type PostHogEventName } from '@/lib/posthog'

interface CtaLinkProps extends ComponentProps<typeof Link> {
  posthogEvent: PostHogEventName
  posthogProperties?: Record<string, unknown>
}

export function CtaLink({ posthogEvent, posthogProperties, onClick, ...linkProps }: CtaLinkProps) {
  return (
    <Link
      {...linkProps}
      onClick={(e) => {
        captureEvent(posthogEvent, posthogProperties)
        onClick?.(e)
      }}
    />
  )
}
