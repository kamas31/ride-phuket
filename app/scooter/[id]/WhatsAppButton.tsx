'use client'

import { trackEvent } from '@/lib/analytics'
import { captureEvent } from '@/lib/posthog'
import { trackTikTokContact } from '@/lib/analytics/tiktok'
import { notifyWhatsAppLead } from '@/app/actions/whatsapp-lead'

interface WhatsAppButtonProps {
  href: string
  shopId: string
  scooterId: string
  // Where this button is rendered — forwarded to TikTok's Contact event only.
  placement?: string
  className?: string
  children: React.ReactNode
}

export function WhatsAppButton({ href, shopId, scooterId, placement, className, children }: WhatsAppButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        trackEvent({ eventType: 'whatsapp_click', shopId, scooterId })
        captureEvent('whatsapp_clicked', { shop_id: shopId, scooter_id: scooterId })
        trackTikTokContact({ scooter_id: scooterId, shop_id: shopId, placement })
        // Fire-and-forget — never await, so opening WhatsApp is never delayed.
        void notifyWhatsAppLead(shopId, scooterId)
      }}
      className={className}
    >
      {children}
    </a>
  )
}
