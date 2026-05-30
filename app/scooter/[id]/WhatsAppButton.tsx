'use client'

import { trackEvent } from '@/lib/analytics'

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
      onClick={() => trackEvent({ eventType: 'whatsapp_click', shopId, scooterId })}
      className={className}
    >
      {children}
    </a>
  )
}
