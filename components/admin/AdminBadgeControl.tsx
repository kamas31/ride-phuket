'use client'

import { useState, useTransition } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { useAdminPanelVisible } from '@/hooks/useAdminPanelVisible'
import { adminSetNewListingBadge, adminSetExplorePosition } from '@/app/actions/admin-badge'

interface AdminBadgeControlProps {
  scooterId: string
  initial: boolean | null | undefined
  initialPosition: number | null | undefined
}

type BadgeState = boolean | null

const OPTIONS: { value: BadgeState; label: string }[] = [
  { value: null,  label: 'Auto' },
  { value: true,  label: 'Force On' },
  { value: false, label: 'Force Off' },
]

export function AdminBadgeControl({ scooterId, initial, initialPosition }: AdminBadgeControlProps) {
  const { isAdmin, loading } = useProfile()
  const [adminPanelVisible] = useAdminPanelVisible()
  const [current, setCurrent] = useState<BadgeState>(initial ?? null)
  const [isPending, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)

  const [posInput, setPosInput] = useState<string>(initialPosition != null ? String(initialPosition) : '')
  const [posIsPending, startPosTransition] = useTransition()
  const [posError, setPosError] = useState<string | null>(null)
  const [posSaved, setPosSaved] = useState(false)

  if (loading || !isAdmin || !adminPanelVisible) return null

  const handleChange = (next: BadgeState) => {
    if (next === current || isPending) return
    setSaveError(null)
    setCurrent(next)
    startTransition(async () => {
      const result = await adminSetNewListingBadge(scooterId, next)
      if (result.error) {
        setSaveError(result.error)
        setCurrent(current)
      }
    })
  }

  const handleSavePosition = () => {
    if (posIsPending) return
    setPosError(null)
    setPosSaved(false)
    const trimmed = posInput.trim()
    const value = trimmed === '' ? null : parseInt(trimmed, 10)
    if (trimmed !== '' && (isNaN(value!) || value! < 1)) {
      setPosError('Must be a positive integer or empty to unpin')
      return
    }
    startPosTransition(async () => {
      const result = await adminSetExplorePosition(scooterId, value)
      if (result.error) {
        setPosError(result.error)
      } else {
        setPosSaved(true)
      }
    })
  }

  return (
    <div className="fixed bottom-24 right-4 z-[9000] bg-[#0f0f0e] text-white rounded-[16px] p-3.5 shadow-2xl w-[148px] select-none">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9c9c98] mb-2.5">
        Admin · Badge
      </p>
      <div className="flex flex-col gap-1.5">
        {OPTIONS.map(({ value, label }) => (
          <button
            key={String(value)}
            onClick={() => handleChange(value)}
            disabled={isPending}
            className={[
              'text-xs font-semibold px-3 py-1.5 rounded-[9px] text-left transition-colors',
              current === value
                ? 'bg-[#FF6B35] text-white'
                : 'bg-white/[0.08] text-white/60 hover:bg-white/[0.15] hover:text-white',
              isPending ? 'opacity-50 cursor-not-allowed' : '',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>
      {saveError && (
        <p className="text-[9px] text-red-400 mt-2 leading-tight">{saveError}</p>
      )}

      <div className="border-t border-white/10 mt-3 pt-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9c9c98] mb-2">
          Explore Position
        </p>
        <div className="flex gap-1.5">
          <input
            type="number"
            min={1}
            value={posInput}
            onChange={e => { setPosInput(e.target.value); setPosSaved(false) }}
            placeholder="—"
            className="w-full bg-white/[0.08] text-white text-xs font-semibold rounded-[8px] px-2 py-1.5 outline-none focus:ring-1 focus:ring-[#FF6B35] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            onClick={handleSavePosition}
            disabled={posIsPending}
            className={[
              'text-xs font-semibold px-2.5 py-1.5 rounded-[8px] transition-colors shrink-0',
              posSaved
                ? 'bg-green-600 text-white'
                : 'bg-[#FF6B35] text-white hover:bg-[#e55a25]',
              posIsPending ? 'opacity-50 cursor-not-allowed' : '',
            ].join(' ')}
          >
            {posSaved ? '✓' : 'Save'}
          </button>
        </div>
        <p className="text-[9px] text-[#9c9c98] mt-1.5 leading-tight">Empty = unpinned</p>
        {posError && (
          <p className="text-[9px] text-red-400 mt-1 leading-tight">{posError}</p>
        )}
      </div>
    </div>
  )
}
