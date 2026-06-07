'use client'

import { useProfile } from '@/hooks/useProfile'
import { useAdminPanelVisible } from '@/hooks/useAdminPanelVisible'

export type PriceDuration = 'day' | 'week' | 'month'

interface Props {
  showContext: boolean
  onShowContext: (v: boolean) => void
  showTimestamps: boolean
  onShowTimestamps: (v: boolean) => void
  priceOverride: string
  onPriceOverride: (v: string) => void
  durationOverride: PriceDuration
  onDurationOverride: (v: PriceDuration) => void
}

export function AdminThreadControl({
  showContext, onShowContext,
  showTimestamps, onShowTimestamps,
  priceOverride, onPriceOverride,
  durationOverride, onDurationOverride,
}: Props) {
  const { isAdmin, loading } = useProfile()
  const [adminPanelVisible] = useAdminPanelVisible()

  if (loading || !isAdmin || !adminPanelVisible) return null

  const toggleCls = (active: boolean) => [
    'flex-1 text-xs font-semibold px-2 py-1.5 rounded-[8px] transition-colors',
    active
      ? 'bg-[#FF6B35] text-white'
      : 'bg-white/[0.08] text-white/60 hover:bg-white/[0.15] hover:text-white',
  ].join(' ')

  const inputCls = 'w-full bg-white/[0.08] text-white text-xs font-semibold rounded-[8px] px-2 py-1.5 outline-none focus:ring-1 focus:ring-[#FF6B35] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-white/30'

  return (
    <div className="fixed bottom-24 right-4 z-[9000] bg-[#0f0f0e] text-white rounded-[16px] p-3.5 shadow-2xl w-[160px] select-none">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9c9c98] mb-3">
        Admin · Thread
      </p>

      {/* Price override */}
      <div className="mb-2.5">
        <p className="text-[9px] text-[#9c9c98] uppercase tracking-widest mb-1">Price (฿)</p>
        <input
          type="number"
          min={0}
          value={priceOverride}
          onChange={e => onPriceOverride(e.target.value)}
          placeholder="auto"
          className={inputCls}
        />
      </div>

      {/* Duration */}
      <div className="mb-3 border-b border-white/10 pb-3">
        <p className="text-[9px] text-[#9c9c98] uppercase tracking-widest mb-1.5">Duration</p>
        <div className="flex gap-1">
          {(['day', 'week', 'month'] as PriceDuration[]).map(d => (
            <button
              key={d}
              onClick={() => onDurationOverride(d)}
              className={[
                'flex-1 text-[10px] font-semibold py-1.5 rounded-[8px] transition-colors capitalize',
                durationOverride === d
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-white/[0.08] text-white/60 hover:bg-white/[0.15] hover:text-white',
              ].join(' ')}
            >
              {d === 'day' ? 'Day' : d === 'week' ? 'Wk' : 'Mo'}
            </button>
          ))}
        </div>
      </div>

      {/* Context pills */}
      <div className="mb-2.5">
        <p className="text-[9px] text-[#9c9c98] uppercase tracking-widest mb-1.5">Context pills</p>
        <div className="flex gap-1.5">
          {([true, false] as const).map(v => (
            <button key={String(v)} onClick={() => onShowContext(v)} className={toggleCls(showContext === v)}>
              {v ? 'Show' : 'Hide'}
            </button>
          ))}
        </div>
      </div>

      {/* Timestamps + Seen */}
      <div>
        <p className="text-[9px] text-[#9c9c98] uppercase tracking-widest mb-1.5">Timestamps</p>
        <div className="flex gap-1.5">
          {([true, false] as const).map(v => (
            <button key={String(v)} onClick={() => onShowTimestamps(v)} className={toggleCls(showTimestamps === v)}>
              {v ? 'Show' : 'Hide'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
