'use client'

import { useEffect, useState } from 'react'
import { cn, formatPrice } from '@/lib/utils'
import { MessageOwnerButton } from '@/app/scooter/[id]/MessageOwnerButton'

// ─────────────────────────────────────────────────────────────────────────────
// StickyContactBar — mobile-only sticky CTA bar
//
// Appears when the user scrolls past the #sticky-contact-sentinel div.
// Shows price + direct contact CTAs. Hidden on desktop (lg+) where the
// contact card is always visible in the sidebar.
// ─────────────────────────────────────────────────────────────────────────────

interface StickyContactBarProps {
  scooterName: string
  price:   number
  period:  'daily' | 'weekly' | 'monthly'
  scooterId:   string
  available?:  boolean
  shopWhatsapp?: string
  shopPhone?:    string
}

export function StickyContactBar({
  scooterName,
  price,
  period,
  scooterId,
  available = true,
}: StickyContactBarProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const sentinel = document.getElementById('sticky-contact-sentinel')
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px -60px 0px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  // 3.25rem = mobile bottom nav height (matches layout.tsx pb-[calc(3.25rem+…)])
  const NAV_H = '3.25rem'

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-[60] lg:hidden',
        'bg-white/95 backdrop-blur-md border-t border-[#e8e8e4]',
        'shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.10)]',
      )}
      style={{
        bottom: `calc(${NAV_H} + env(safe-area-inset-bottom, 0px))`,
        transform: visible
          ? 'translateY(0)'
          : `translateY(calc(100% + ${NAV_H} + env(safe-area-inset-bottom, 0px)))`,
        transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Price */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="text-[22px] font-bold text-[#0f0f0e] leading-none">
              {formatPrice(price)}
            </span>
            <span className="text-[#9c9c98] text-sm">
              {period === 'daily' ? '/day' : period === 'weekly' ? '/week' : '/month'}
            </span>
          </div>
          <p className="text-[10px] text-[#9c9c98] mt-0.5 truncate">{scooterName}</p>
        </div>

        {/* CTAs */}
        {available ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <MessageOwnerButton scooterId={scooterId} scooterName={scooterName} variant="sticky" />
          </div>
        ) : (
          <span className="px-5 py-3 bg-[#f0f0ec] text-[#9c9c98] font-semibold text-sm rounded-full flex-shrink-0">
            Unavailable
          </span>
        )}
      </div>
    </div>
  )
}
