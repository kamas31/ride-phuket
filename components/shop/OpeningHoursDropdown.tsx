'use client'

import { useState } from 'react'
import { Clock, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OpeningHoursSchedule } from '@/types'

const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'] as const
type DayKey = typeof DAYS[number]

// Display order: Monday first (like Google Maps)
const DISPLAY_ORDER: DayKey[] = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

const DAY_SHORT: Record<DayKey, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}

function getTodayStatus(hours: OpeningHoursSchedule): {
  todayKey: DayKey
  isOpen: boolean
  label: string
} {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
  const todayKey = DAYS[now.getDay()]
  const day = hours[todayKey]

  if (!day?.enabled) return { todayKey, isOpen: false, label: 'Closed today' }
  if (!day.open || !day.close) return { todayKey, isOpen: false, label: 'See shop for hours' }

  const cur = now.getHours() * 60 + now.getMinutes()
  const [oh, om] = day.open.split(':').map(Number)
  const [ch, cm] = day.close.split(':').map(Number)
  const openMin = oh * 60 + om
  const closeMin = ch * 60 + cm

  if (cur < openMin) return { todayKey, isOpen: false, label: `Opens at ${day.open}` }
  if (cur < closeMin) return { todayKey, isOpen: true, label: `Open · Closes at ${day.close}` }

  for (let i = 1; i <= 7; i++) {
    const nextKey = DAYS[(now.getDay() + i) % 7]
    const next = hours[nextKey]
    if (next?.enabled && next.open) {
      const nextName = i === 1 ? 'Tomorrow' : DAY_SHORT[nextKey]
      return { todayKey, isOpen: false, label: `Closed · Opens ${nextName} at ${next.open}` }
    }
  }
  return { todayKey, isOpen: false, label: 'Closed' }
}

interface Props {
  hours: OpeningHoursSchedule
  className?: string
  /** 'default' = clock icon row (used in shop contact card)
   *  'dot'     = colored dot row (used in scooter shop card) */
  variant?: 'default' | 'dot'
}

export function OpeningHoursDropdown({ hours, className, variant = 'default' }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { todayKey, isOpen, label } = getTodayStatus(hours)

  return (
    <div className={cn('', className)}>
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setExpanded(v => !v) }}
        className="flex items-center gap-1 text-left w-full group"
      >
        {variant === 'default' && (
          <Clock className="w-3 h-3 text-[#0ea5e9] flex-shrink-0" />
        )}
        {variant === 'dot' && (
          <span className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            isOpen ? 'bg-[#22c55e]' : 'bg-[#d0d0cc]',
          )} />
        )}
        <span className={cn(
          'font-medium',
          variant === 'default' ? 'text-[11px]' : 'text-xs',
          isOpen ? 'text-[#16a34a]' : 'text-[#5c5c58]',
        )}>
          {label}
        </span>
        <ChevronDown className={cn(
          'w-3 h-3 text-[#9c9c98] flex-shrink-0 transition-transform duration-200',
          expanded && 'rotate-180',
        )} />
      </button>

      {expanded && (
        <div className="mt-1.5 space-y-[3px] pl-4 border-l border-[#f0f0ec]">
          {DISPLAY_ORDER.map(day => {
            const d = hours[day]
            const isToday = day === todayKey
            return (
              <div
                key={day}
                className={cn(
                  'flex items-center justify-between gap-4 text-[10px]',
                  isToday ? 'font-bold text-[#0f0f0e]' : 'text-[#9c9c98]',
                )}
              >
                <span className="w-7 shrink-0">{DAY_SHORT[day]}</span>
                <span>
                  {!d?.enabled
                    ? 'Closed'
                    : d.open && d.close
                      ? `${d.open}–${d.close}`
                      : 'See shop'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
