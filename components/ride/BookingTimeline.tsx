import { Check, Clock, Bike, Flag, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// BookingTimeline — visual progress of a booking
//
// Pending   → Confirmed   → Active   → Completed
//   ●           ○              ○          ○
// ─────────────────────────────────────────────────────────────────────────────

interface BookingTimelineProps {
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
  startDate?: string
  endDate?: string
  className?: string
}

const STEPS = [
  { key: 'pending',   icon: Clock,  label: 'Requested',          sub: 'Awaiting shop confirmation' },
  { key: 'confirmed', icon: Check,  label: 'Confirmed',           sub: 'Shop confirmed your booking' },
  { key: 'active',    icon: Bike,   label: 'Rental active',       sub: 'Enjoy your ride!' },
  { key: 'completed', icon: Flag,   label: 'Completed',           sub: 'Rental finished' },
] as const

const STATUS_RANK: Record<string, number> = {
  pending: 0, confirmed: 1, active: 2, completed: 3,
}

export function BookingTimeline({ status, startDate, endDate, className }: BookingTimelineProps) {
  if (status === 'cancelled') {
    return (
      <div className={cn('flex items-center gap-2.5 px-3 py-2.5 bg-[#fef2f2] rounded-[10px] border border-[#fecaca]/50', className)}>
        <div className="w-6 h-6 rounded-full bg-[#dc2626] flex items-center justify-center flex-shrink-0">
          <X className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#dc2626]">Booking cancelled</p>
          {startDate && (
            <p className="text-[10px] text-[#9c9c98] mt-0.5">
              Was scheduled {startDate}{endDate ? ` → ${endDate}` : ''}
            </p>
          )}
        </div>
      </div>
    )
  }

  const currentRank = STATUS_RANK[status] ?? 0

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-start gap-0">
        {STEPS.map((step, i) => {
          const stepRank = STATUS_RANK[step.key]
          const isDone    = stepRank < currentRank
          const isActive  = stepRank === currentRank
          const isPending = stepRank > currentRank
          const isLast    = i === STEPS.length - 1
          const Icon = step.icon

          return (
            <div key={step.key} className="flex items-start flex-1 min-w-0">
              <div className="flex flex-col items-center flex-shrink-0">
                {/* Circle */}
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center transition-all',
                  isDone   && 'bg-[#22c55e]',
                  isActive && 'bg-[#FF6B35] shadow-[0_0_0_3px_rgba(255,107,53,0.18)]',
                  isPending && 'bg-[#f0f0ec] border-2 border-[#e8e8e4]',
                )}>
                  <Icon className={cn(
                    'w-3.5 h-3.5',
                    (isDone || isActive) ? 'text-white' : 'text-[#c8c8c4]',
                  )} />
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className={cn(
                  'flex-1 h-0.5 mt-3.5 mx-1 transition-colors',
                  isDone ? 'bg-[#22c55e]' : 'bg-[#e8e8e4]',
                )} />
              )}
            </div>
          )
        })}
      </div>

      {/* Labels row */}
      <div className="flex mt-2">
        {STEPS.map((step, i) => {
          const stepRank = STATUS_RANK[step.key]
          const isDone    = stepRank < currentRank
          const isActive  = stepRank === currentRank
          const isLast    = i === STEPS.length - 1

          return (
            <div
              key={step.key}
              className={cn(
                'min-w-0 text-center',
                isLast ? 'flex-shrink-0' : 'flex-1',
              )}
            >
              <p className={cn(
                'text-[9px] font-bold leading-tight',
                isActive  && 'text-[#FF6B35]',
                isDone    && 'text-[#22c55e]',
                !isActive && !isDone && 'text-[#c8c8c4]',
              )}>
                {step.label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
