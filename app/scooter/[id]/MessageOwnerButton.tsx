'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { getOrCreateConversation } from '@/app/actions/messaging'
import { cn } from '@/lib/utils'

interface MessageOwnerButtonProps {
  scooterId: string
  scooterName: string
  variant?: 'primary' | 'sticky'
  className?: string
}

export function MessageOwnerButton({
  scooterId,
  variant = 'primary',
  className,
}: MessageOwnerButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await getOrCreateConversation(scooterId)

      if ('error' in result) {
        if (result.error === 'sign_in_required') {
          router.push(`/auth/login?next=/scooter/${scooterId}`)
          return
        }
        if (result.error === 'own_listing') {
          setError('This is your own listing.')
          return
        }
        setError(result.error)
        return
      }

      router.push(`/messages/${result.conversationId}`)
    })
  }

  if (variant === 'sticky') {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          'flex items-center gap-1.5 px-5 py-3 font-bold text-sm rounded-full transition-colors active:scale-[0.97]',
          'bg-[#FF6B35] text-white shadow-[0_4px_14px_rgba(255,107,53,0.35)] hover:bg-[#e85d29]',
          isPending && 'opacity-70',
          className,
        )}
      >
        <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
        {isPending ? 'Opening…' : 'Message owner'}
      </button>
    )
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          'flex items-center justify-center gap-2.5 w-full py-4 font-bold rounded-full transition-all text-base',
          'bg-[#FF6B35] text-white hover:bg-[#e85d29] shadow-sm hover:shadow-[0_8px_24px_rgba(255,107,53,0.35)] hover:scale-[1.01] active:scale-[0.99]',
          isPending && 'opacity-70',
          className,
        )}
      >
        <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
        {isPending ? 'Opening…' : 'Message owner'}
      </button>
      {error && (
        <p className="text-center text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
