'use client'

import { useState, useTransition } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { useAdminPanelVisible } from '@/hooks/useAdminPanelVisible'
import { adminSetShopOverrides } from '@/app/actions/admin-shop-overrides'

interface Props {
  shopId: string
  initialRating: number | null
  initialReviewCount: number | null
  initialScooterCount: number | null
  initialShowScooterCount: boolean
}

export function AdminShopControl({
  shopId,
  initialRating,
  initialReviewCount,
  initialScooterCount,
  initialShowScooterCount,
}: Props) {
  const { isAdmin, loading } = useProfile()
  const [adminPanelVisible] = useAdminPanelVisible()

  const [rating,       setRating]       = useState(initialRating       != null ? String(initialRating)       : '')
  const [reviewCount,  setReviewCount]  = useState(initialReviewCount  != null ? String(initialReviewCount)  : '')
  const [scooterCount, setScooterCount] = useState(initialScooterCount != null ? String(initialScooterCount) : '')
  const [showCount,    setShowCount]    = useState(initialShowScooterCount)

  const [isPending, startTransition] = useTransition()
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  if (loading || !isAdmin || !adminPanelVisible) return null

  const handleSave = () => {
    if (isPending) return
    setError(null)
    setSaved(false)
    const parsedRating  = rating.trim()       ? Number(rating)            : null
    const parsedReviews = reviewCount.trim()  ? parseInt(reviewCount, 10) : null
    const parsedCount   = scooterCount.trim() ? parseInt(scooterCount, 10): null
    if (parsedRating  != null && (isNaN(parsedRating)  || parsedRating  < 0 || parsedRating  > 5)) { setError('Rating must be 0–5'); return }
    if (parsedReviews != null && (isNaN(parsedReviews) || parsedReviews < 0))                       { setError('Reviews must be ≥ 0'); return }
    if (parsedCount   != null && (isNaN(parsedCount)   || parsedCount   < 0))                       { setError('Count must be ≥ 0'); return }
    startTransition(async () => {
      const result = await adminSetShopOverrides(shopId, {
        adminRating:        parsedRating,
        adminReviewCount:   parsedReviews,
        adminScooterCount:  parsedCount,
        showScooterCount:   showCount,
      })
      if (result.error) setError(result.error)
      else setSaved(true)
    })
  }

  const inputCls = 'w-full bg-white/[0.08] text-white text-xs font-semibold rounded-[8px] px-2 py-1.5 outline-none focus:ring-1 focus:ring-[#FF6B35] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-white/30'

  return (
    <div className="fixed bottom-24 right-4 z-[9000] bg-[#0f0f0e] text-white rounded-[16px] p-3.5 shadow-2xl w-[160px] select-none">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9c9c98] mb-3">
        Admin · Shop
      </p>

      {/* Rating */}
      <div className="mb-2.5">
        <p className="text-[9px] text-[#9c9c98] uppercase tracking-widest mb-1">Rating</p>
        <input
          type="number" min={0} max={5} step={0.1}
          value={rating}
          onChange={e => { setRating(e.target.value); setSaved(false) }}
          placeholder="auto"
          className={inputCls}
        />
      </div>

      {/* Reviews */}
      <div className="mb-2.5">
        <p className="text-[9px] text-[#9c9c98] uppercase tracking-widest mb-1">Reviews</p>
        <input
          type="number" min={0}
          value={reviewCount}
          onChange={e => { setReviewCount(e.target.value); setSaved(false) }}
          placeholder="auto"
          className={inputCls}
        />
      </div>

      {/* Scooter count */}
      <div className="mb-2">
        <p className="text-[9px] text-[#9c9c98] uppercase tracking-widest mb-1">Scooter count</p>
        <input
          type="number" min={0}
          value={scooterCount}
          onChange={e => { setScooterCount(e.target.value); setSaved(false) }}
          placeholder="auto"
          className={inputCls}
        />
        <p className="text-[8px] text-white/30 mt-1 leading-tight">Empty = live count</p>
      </div>

      {/* Show / hide scooter count label */}
      <div className="border-t border-white/10 pt-2.5 mb-3">
        <p className="text-[9px] text-[#9c9c98] uppercase tracking-widest mb-1.5">Count label</p>
        <div className="flex gap-1.5">
          {([true, false] as const).map(v => (
            <button
              key={String(v)}
              onClick={() => { setShowCount(v); setSaved(false) }}
              className={[
                'flex-1 text-xs font-semibold px-2 py-1.5 rounded-[8px] transition-colors',
                showCount === v
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-white/[0.08] text-white/60 hover:bg-white/[0.15] hover:text-white',
              ].join(' ')}
            >
              {v ? 'Show' : 'Hide'}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={isPending}
        className={[
          'w-full text-xs font-bold py-2 rounded-[9px] transition-colors',
          saved    ? 'bg-green-600 text-white'      : 'bg-[#FF6B35] text-white hover:bg-[#e55a25]',
          isPending ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
      >
        {isPending ? '…' : saved ? '✓ Saved' : 'Save'}
      </button>

      {error && <p className="text-[9px] text-red-400 mt-2 leading-tight">{error}</p>}
    </div>
  )
}
