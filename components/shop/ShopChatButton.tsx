'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Loader2 } from 'lucide-react'
import { getOrCreateShopConversation } from '@/app/actions/shop-conversation'
import { cn } from '@/lib/utils'

interface ShopChatButtonProps {
  shopId: string
  shopName: string
  shopSlug: string
  className?: string
}

export function ShopChatButton({ shopId, shopName, shopSlug, className }: ShopChatButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    const result = await getOrCreateShopConversation(shopId)
    setLoading(false)

    if ('error' in result) {
      if (result.error === 'sign_in_required') {
        router.push(`/auth/login?redirect=/shop/${shopSlug}`)
        return
      }
      // no_scooters / other — button becomes a no-op; WA is the fallback
      return
    }

    router.push(`/messages/${result.conversationId}`)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'flex items-center justify-center gap-2 w-full py-3.5 rounded-full font-bold text-sm',
        'bg-[#FF6B35] text-white hover:bg-[#e85d29] active:scale-[0.98]',
        'transition-all shadow-[0_4px_16px_rgba(255,107,53,0.30)]',
        'disabled:opacity-70 disabled:cursor-not-allowed',
        className,
      )}
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <MessageCircle className="w-4 h-4" />
      }
      Chat with {shopName}
    </button>
  )
}
