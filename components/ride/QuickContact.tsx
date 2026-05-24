'use client'

import { MessageCircle, Phone, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildWAUrl, WA_LABELS, type WATemplate, type WAContext } from '@/lib/whatsapp'
import { trackEvent } from '@/lib/analytics'

// ─────────────────────────────────────────────────────────────────────────────
// QuickContact — WhatsApp-first contact module
//
// Usage (scooter page):
//   <QuickContact shop={shop} context={{ scooterName: scooter.name }} />
//
// Usage (bookings page — with booking ref):
//   <QuickContact shop={shop} context={{ scooterName, bookingRef }} questions={['ask_extension']} />
// ─────────────────────────────────────────────────────────────────────────────

interface QuickContactProps {
  whatsapp?: string
  phone?: string
  shopName: string
  shopId?: string
  scooterId?: string
  responseTime?: string
  context?: WAContext
  /** Which quick-question chips to show. Defaults to a sensible set. */
  questions?: WATemplate[]
  /** 'compact' = WA button only. 'full' = WA button + question chips */
  variant?: 'compact' | 'full'
  className?: string
}

const DEFAULT_QUESTIONS: WATemplate[] = [
  'ask_delivery',
  'ask_deposit',
  'ask_license',
  'ask_availability',
  'ask_monthly',
]

export function QuickContact({
  whatsapp,
  phone,
  shopId,
  scooterId,
  shopName,
  responseTime,
  context = {},
  questions = DEFAULT_QUESTIONS,
  variant = 'full',
  className,
}: QuickContactProps) {
  const ctx: WAContext = { shopName, ...context }

  if (!whatsapp && !phone) return null

  return (
    <div className={cn('space-y-3', className)}>
      {/* Response time signal — only shown if real data exists */}
      {responseTime && (
        <div className="flex items-center gap-1.5 text-xs text-[#9c9c98]">
          <Zap className="w-3 h-3 text-[#22c55e]" />
          <span>Usually replies <strong className="text-[#0f0f0e]">{responseTime}</strong></span>
        </div>
      )}

      {/* Primary WhatsApp CTA */}
      {whatsapp && (
        <a
          href={buildWAUrl(whatsapp, 'general_inquiry', ctx)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent({ eventType: 'whatsapp_click', shopId, scooterId, metadata: ctx.scooterName ? { scooterName: ctx.scooterName } : {} })}
          className="flex items-center justify-center gap-2 w-full py-3 bg-[#f0fdf4] border border-[#22c55e]/20 text-[#16a34a] font-bold text-sm rounded-full hover:bg-[#dcfce7] transition-colors active:scale-[0.98]"
        >
          <MessageCircle className="w-4 h-4" />
          Message {shopName} on WhatsApp
        </a>
      )}

      {/* Phone fallback */}
      {!whatsapp && phone && (
        <a
          href={`tel:${phone}`}
          onClick={() => trackEvent({ eventType: 'phone_click', shopId, scooterId })}
          className="flex items-center justify-center gap-2 w-full py-3 border border-[#e8e8e4] text-[#5c5c58] font-semibold text-sm rounded-full hover:bg-[#f8f8f6] transition-colors"
        >
          <Phone className="w-4 h-4" />
          Call {shopName}
        </a>
      )}

      {/* Quick question chips */}
      {variant === 'full' && whatsapp && questions.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2">
            Quick questions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {questions.map(q => (
              <a
                key={q}
                href={buildWAUrl(whatsapp, q, ctx)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent({ eventType: 'whatsapp_click', shopId, scooterId, metadata: { template: q, ...(ctx.scooterName ? { scooterName: ctx.scooterName } : {}) } })}
                className="px-3 py-1.5 bg-[#f8f8f6] border border-[#e8e8e4] text-[11px] font-medium text-[#5c5c58] rounded-full hover:border-[#FF6B35]/40 hover:text-[#FF6B35] hover:bg-[#fff4f0] transition-colors active:scale-[0.97]"
              >
                {WA_LABELS[q]}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
