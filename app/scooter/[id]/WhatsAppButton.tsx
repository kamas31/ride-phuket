'use client'

import { trackEvent } from '@/lib/analytics'
import { captureEvent } from '@/lib/posthog'
import { notifyWhatsAppLead } from '@/app/actions/whatsapp-lead'

interface WhatsAppButtonProps {
  href: string
  shopId: string
  scooterId: string
  className?: string
  children: React.ReactNode
}

export function WhatsAppButton({ href, shopId, scooterId, className, children }: WhatsAppButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        trackEvent({ eventType: 'whatsapp_click', shopId, scooterId })
        captureEvent('whatsapp_clicked', { shop_id: shopId, scooter_id: scooterId })
        // Fire-and-forget — never await, so opening WhatsApp is never delayed.
        void notifyWhatsAppLead(shopId, scooterId)
      }}
      className={className}
    >
      {children}
    </a>
  )
}
