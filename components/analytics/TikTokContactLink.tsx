'use client'

// Thin <a> wrapper that fires a TikTok Contact event on click before the
// browser navigates. Exists because Server Components cannot pass inline
// event handlers to a plain <a> — same rationale as CtaLink.tsx for
// next/link. Forwards every anchor prop unchanged; visuals/behavior are
// identical to a plain <a>. TikTok-only — fires no PostHog/business event.

import type { ComponentProps } from 'react'
import { trackTikTokContact, type TikTokContactParams } from '@/lib/analytics/tiktok'

interface TikTokContactLinkProps extends ComponentProps<'a'> {
  tiktokContact: TikTokContactParams
}

export function TikTokContactLink({ tiktokContact, onClick, ...anchorProps }: TikTokContactLinkProps) {
  return (
    <a
      {...anchorProps}
      onClick={(e) => {
        trackTikTokContact(tiktokContact)
        onClick?.(e)
      }}
    />
  )
}
