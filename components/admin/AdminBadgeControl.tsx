'use client'

import { useState, useTransition } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { adminSetNewListingBadge } from '@/app/actions/admin-badge'

interface AdminBadgeControlProps {
  scooterId: string
  initial: boolean | null | undefined
}

type BadgeState = boolean | null

const OPTIONS: { value: BadgeState; label: string }[] = [
  { value: null,  label: 'Auto' },
  { value: true,  label: 'Force On' },
  { value: false, label: 'Force Off' },
]

export function AdminBadgeControl({ scooterId, initial }: AdminBadgeControlProps) {
  const { isAdmin, loading } = useProfile()
  const [current, setCurrent] = useState<BadgeState>(initial ?? null)
  const [isPending, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)

  if (loading || !isAdmin) return null

  const handleChange = (next: BadgeState) => {
    if (next === current || isPending) return
    setSaveError(null)
    setCurrent(next)
    startTransition(async () => {
      const result = await adminSetNewListingBadge(scooterId, next)
      if (result.error) {
        setSaveError(result.error)
        setCurrent(current) // revert on error
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
    </div>
  )
}
