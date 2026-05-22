'use client'

import { useCallback } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSaved } from '@/hooks/useSaved'

// ─────────────────────────────────────────────────────────────────────────────
// SaveButton — heart wishlist toggle
//
// Renders a heart icon that fills with a spring animation on save.
// Used on ScooterCard images and the scooter detail page.
// State is shared via useSaved (localStorage-backed).
// ─────────────────────────────────────────────────────────────────────────────

interface SaveButtonProps {
  scooterId: string
  className?: string
  size?: 'sm' | 'md'
}

export function SaveButton({ scooterId, className, size = 'sm' }: SaveButtonProps) {
  const { isSaved, toggle, hydrated } = useSaved()
  const saved = hydrated && isSaved(scooterId)

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()   // don't trigger Link navigation when on a card
    e.stopPropagation()
    toggle(scooterId)
  }, [toggle, scooterId])

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? 'Remove from saved' : 'Save scooter'}
      className={cn(
        'flex items-center justify-center rounded-full transition-all duration-200',
        'active:scale-[0.85]',
        size === 'sm'
          ? 'w-8 h-8 bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white'
          : 'w-10 h-10 bg-white border border-[#e8e8e4] shadow-sm hover:border-[#d0d0cc]',
        className
      )}
    >
      <Heart
        className={cn(
          'transition-all duration-200',
          size === 'sm' ? 'w-4 h-4' : 'w-5 h-5',
          saved
            ? 'fill-[#ef4444] text-[#ef4444] scale-110'
            : 'text-[#5c5c58] fill-transparent'
        )}
        strokeWidth={saved ? 0 : 2}
      />
    </button>
  )
}
