'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn, formatPrice } from '@/lib/utils'
import { MessageOwnerButton } from '@/app/scooter/[id]/MessageOwnerButton'

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
  const [visible, setVisible]       = useState(false)
  const [portalEl, setPortalEl]     = useState<Element | null>(null)

  // Find the portal slot rendered inside MobileBottomNav.
  useEffect(() => {
    setPortalEl(document.getElementById('sticky-bar-portal'))
  }, [])

  useEffect(() => {
    const sentinel = document.getElementById('sticky-contact-sentinel')
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px -60px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  if (!portalEl) return null

  // Rendered inside the same fixed container as MobileBottomNav (flex-col).
  // max-height animates 0 ↔ 120px so the bar collapses flush against the nav
  // with no gap — no pixel calculations required.
  return createPortal(
    <div
      style={{
        maxHeight: visible ? '120px' : '0px',
        overflow: 'hidden',
        transition: 'max-height 300ms cubic-bezier(0.22, 1, 0.36, 1)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div className={cn(
        'bg-white/95 backdrop-blur-md border-t border-[#e8e8e4]',
        'shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.10)]',
      )}>
        <div className="flex items-center gap-3 px-4 py-3">
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
    </div>,
    portalEl,
  )
}
