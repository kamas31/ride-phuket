'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getOrCreateShopConversation } from '@/app/actions/shop-conversation'
import { buildWAMessage, WA_LABELS, type WATemplate, type WAContext } from '@/lib/whatsapp'

interface ShopQuickQuestionsProps {
  shopId: string
  shopSlug: string
  questions: WATemplate[]
  waContext: WAContext
  className?: string
}

export function ShopQuickQuestions({
  shopId,
  shopSlug,
  questions,
  waContext,
  className,
}: ShopQuickQuestionsProps) {
  const router = useRouter()
  const [loadingTemplate, setLoadingTemplate] = useState<WATemplate | null>(null)

  async function handleChip(template: WATemplate) {
    if (loadingTemplate) return
    setLoadingTemplate(template)

    const result = await getOrCreateShopConversation(shopId)

    if ('error' in result) {
      if (result.error === 'sign_in_required') {
        router.push(`/auth/login?redirect=/shop/${shopSlug}`)
        return
      }
      setLoadingTemplate(null)
      return
    }

    const prefill = encodeURIComponent(buildWAMessage(template, waContext))
    router.push(`/messages/${result.conversationId}?prefill=${prefill}`)
  }

  return (
    <div className={className}>
      <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2">
        Quick questions
      </p>
      <div className="flex flex-wrap gap-1.5">
        {questions.map(template => (
          <button
            key={template}
            onClick={() => handleChip(template)}
            disabled={loadingTemplate !== null}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#e8e8e4] bg-[#f8f8f6] text-[12px] text-[#5c5c58] font-medium hover:border-[#FF6B35]/40 hover:bg-[#fff4f0] hover:text-[#FF6B35] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingTemplate === template && <Loader2 className="w-3 h-3 animate-spin" />}
            {WA_LABELS[template]}
          </button>
        ))}
      </div>
    </div>
  )
}
