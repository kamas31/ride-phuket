'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// StickyBookingBar — mobile-only sticky CTA bar
//
// Appears when the user scrolls past the #sticky-booking-sentinel div.
// Always shows price + "Reserve now" button without making user scroll back.
// Hidden on desktop (lg+) where the booking card is always visible.
// ─────────────────────────────────────────────────────────────────────────────

interface StickyBookingBarProps {
  scooterName: string
  pricePerDay: number
  scooterId: string
  available?: boolean
}

export function StickyBookingBar({
  scooterName,
  pricePerDay,
  scooterId,
  available = true,
}: StickyBookingBarProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const sentinel = document.getElementById('sticky-booking-sentinel')
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px -60px 0px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className={cn(
        // Mobile only — desktop has the persistent sidebar card
        'fixed bottom-0 left-0 right-0 z-[60] lg:hidden',
        'bg-white/95 backdrop-blur-md border-t border-[#e8e8e4]',
        'shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.10)]',
        'transition-transform duration-300 ease-out',
        visible ? 'translate-y-0' : 'translate-y-full',
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Price */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="text-[22px] font-bold text-[#0f0f0e] leading-none">
              {formatPrice(pricePerDay)}
            </span>
            <span className="text-[#9c9c98] text-sm">/day</span>
          </div>
          <p className="text-[10px] text-[#9c9c98] mt-0.5 truncate">{scooterName}</p>
        </div>

        {/* CTA */}
        {available ? (
          <Link
            href={`/checkout?scooterId=${scooterId}`}
            className="flex items-center gap-1.5 px-5 py-3 bg-[#FF6B35] text-white font-bold text-sm rounded-full hover:bg-[#e85d29] transition-colors shadow-[0_4px_14px_rgba(255,107,53,0.35)] active:scale-[0.97] flex-shrink-0"
          >
            Reserve now
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <span className="px-5 py-3 bg-[#f0f0ec] text-[#9c9c98] font-semibold text-sm rounded-full flex-shrink-0">
            Unavailable
          </span>
        )}
      </div>
    </div>
  )
}
