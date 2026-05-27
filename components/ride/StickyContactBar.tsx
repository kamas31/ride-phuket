'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, Phone } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// StickyContactBar — mobile-only sticky CTA bar
//
// Appears when the user scrolls past the #sticky-contact-sentinel div.
// Shows price + direct contact CTAs. Hidden on desktop (lg+) where the
// contact card is always visible in the sidebar.
// ─────────────────────────────────────────────────────────────────────────────

interface StickyContactBarProps {
  scooterName: string
  pricePerDay: number
  scooterId:   string
  available?:  boolean
  shopWhatsapp?: string
  shopPhone?:    string
}

export function StickyContactBar({
  scooterName,
  pricePerDay,
  available = true,
  shopWhatsapp,
  shopPhone,
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

  const waUrl = shopWhatsapp
    ? `https://wa.me/${shopWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! I'm interested in the ${scooterName} I found on Koh Ride. Is it available?`)}`
    : null

  return (
    <div
      className={cn(
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

        {/* CTAs */}
        {available ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            {waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-5 py-3 bg-[#16a34a] text-white font-bold text-sm rounded-full hover:bg-[#15803d] transition-colors shadow-[0_4px_14px_rgba(22,163,74,0.35)] active:scale-[0.97]"
              >
                <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                Contact shop
              </a>
            ) : shopPhone ? (
              <a
                href={`tel:${shopPhone}`}
                className="flex items-center gap-1.5 px-5 py-3 bg-[#0f0f0e] text-white font-bold text-sm rounded-full hover:bg-[#2a2a28] transition-colors active:scale-[0.97]"
              >
                <Phone className="w-4 h-4" strokeWidth={1.5} />
                Call shop
              </a>
            ) : (
              <a
                href="#contact-rental-shop"
                className="flex items-center gap-1.5 px-5 py-3 bg-[#FF6B35] text-white font-bold text-sm rounded-full hover:bg-[#e85d29] transition-colors shadow-[0_4px_14px_rgba(255,107,53,0.35)] active:scale-[0.97]"
              >
                Contact shop
              </a>
            )}
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
