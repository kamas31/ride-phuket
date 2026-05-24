import { cn } from '@/lib/utils'
import { ICON_REGISTRY } from '@/components/ui/AppIcon'
import type { TrustSignal, TrustTone } from '@/lib/trust-signals'

// ── Style tokens per tone ─────────────────────────────────────────────────────
// Deliberately low-contrast — Stripe/Linear style, not gamified

const TONE_CLS: Record<TrustTone, { pill: string; icon: string }> = {
  neutral:  { pill: 'bg-[#f8f8f6] text-[#5c5c58]',             icon: 'text-[#9c9c98]' },
  positive: { pill: 'bg-[#f0fdf4] text-[#16a34a]',             icon: 'text-[#22c55e]' },
  accent:   { pill: 'bg-[#fff4f0] text-[#c2410c]',             icon: 'text-[#FF6B35]' },
}

interface TrustSignalsProps {
  signals:    TrustSignal[]
  max?:       number           // default 5
  size?:      'xs' | 'sm'     // default 'xs'
  className?: string
  inline?:    boolean          // if true: horizontal wrap, if false: vertical stack
}

export function TrustSignals({
  signals,
  max = 5,
  size = 'xs',
  className,
  inline = true,
}: TrustSignalsProps) {
  const visible = signals.slice(0, max)
  const hidden  = signals.length - visible.length

  if (visible.length === 0) return null

  return (
    <div className={cn(inline ? 'flex flex-wrap gap-1.5' : 'flex flex-col gap-1.5', className)}>
      {visible.map(signal => {
        const { pill, icon: iconCls } = TONE_CLS[signal.tone]
        const IconComponent = ICON_REGISTRY[signal.icon as keyof typeof ICON_REGISTRY]

        return (
          <span
            key={signal.id}
            className={cn(
              'inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap',
              size === 'xs'
                ? 'px-2 py-0.5 text-[10px]'
                : 'px-2.5 py-1 text-xs',
              pill,
            )}
          >
            {IconComponent && (
              <IconComponent
                className={cn(
                  size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3',
                  'flex-shrink-0',
                  iconCls,
                )}
                strokeWidth={1.5}
                aria-hidden
              />
            )}
            {signal.label}
          </span>
        )
      })}
      {hidden > 0 && (
        <span className={cn(
          'inline-flex items-center rounded-full font-medium text-[#9c9c98] bg-[#f8f8f6]',
          size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        )}>
          +{hidden} more
        </span>
      )}
    </div>
  )
}
