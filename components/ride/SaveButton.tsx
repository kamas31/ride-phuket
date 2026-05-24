'use client'

import { useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSaved } from '@/hooks/useSaved'
import { useAuth } from '@/hooks/useAuth'
import { saveRide, unsaveRide } from '@/app/actions/saved-rides'
import { trackEvent } from '@/lib/analytics'

// ─────────────────────────────────────────────────────────────────────────────
// SaveButton — soft bookmark toggle
//
// Optimistic: localStorage updates instantly (no flicker, no loading state).
// Persistent: server actions sync to DB in background when user is authenticated.
// Auth-gated: unauthenticated users are directed to login with a return path.
// ─────────────────────────────────────────────────────────────────────────────

interface SaveButtonProps {
  scooterId: string
  className?: string
  size?: 'sm' | 'md'
}

export function SaveButton({ scooterId, className, size = 'sm' }: SaveButtonProps) {
  const router      = useRouter()
  const pathname    = usePathname()
  const { user }    = useAuth()
  const { isSaved, toggle, hydrated } = useSaved()
  const saved       = hydrated && isSaved(scooterId)

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      router.push(`/auth/login?next=${encodeURIComponent(pathname)}`)
      return
    }

    // Optimistic: update localStorage immediately (instant UI response)
    toggle(scooterId)

    // Persistent: sync to DB in background — no await, never blocks UX
    if (saved) {
      unsaveRide(scooterId).catch(() => {})
      trackEvent({ eventType: 'ride_unsaved', scooterId })
    } else {
      saveRide(scooterId).catch(() => {})
      trackEvent({ eventType: 'ride_saved', scooterId })
    }
  }, [user, pathname, router, toggle, scooterId, saved])

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? 'Remove from saved rides' : 'Save ride'}
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
            ? 'fill-[#ef4444] text-[#ef4444]'
            : 'text-[#9c9c98] fill-transparent',
        )}
        strokeWidth={saved ? 0 : 1.5}
      />
    </button>
  )
}
