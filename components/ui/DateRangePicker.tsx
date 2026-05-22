'use client'

import { useState, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const DAYS  = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Helpers ─────────────────────────────────────────────────────

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

function fromISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate()
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

// ── Props ────────────────────────────────────────────────────────

interface DateRangePickerProps {
  startDate: string    // 'YYYY-MM-DD'
  endDate:   string    // 'YYYY-MM-DD'
  onStartChange: (v: string) => void
  onEndChange:   (v: string) => void
  minDate?: string     // defaults to tomorrow
}

// ── Component ────────────────────────────────────────────────────

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  minDate,
}: DateRangePickerProps) {
  const today = startOfDay(new Date())
  const min   = minDate ? fromISO(minDate) : addDays(today, 1)

  // View month: defaults to the month of minDate
  const [viewYear,  setViewYear]  = useState(min.getFullYear())
  const [viewMonth, setViewMonth] = useState(min.getMonth())
  // Hover tracking for range preview while picking end date
  const [hovered, setHovered] = useState<Date | null>(null)

  const startD = startDate ? fromISO(startDate) : null
  const endD   = endDate   ? fromISO(endDate)   : null

  // Which date is the user currently picking?
  const phase: 'start' | 'end' = startD && !endD ? 'end' : 'start'

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const handleDayClick = useCallback((day: Date) => {
    if (day < min) return

    if (phase === 'start') {
      onStartChange(toISO(day))
      onEndChange('')
    } else {
      // phase === 'end'
      if (!startD) return
      if (day < startD) {
        // Picked before start → reset as new start
        onStartChange(toISO(day))
        onEndChange('')
      } else if (sameDay(day, startD)) {
        // Tapped same day → clear selection
        onStartChange('')
        onEndChange('')
      } else {
        onEndChange(toISO(day))
      }
    }
  }, [phase, startD, min, onStartChange, onEndChange])

  // Days grid for current view month
  const days = useMemo<(Date | null)[]>(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay() // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const cells: (Date | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d))
    }
    // Pad to complete the last week row
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [viewYear, viewMonth])

  // Effective range end for visual highlight (hover preview while picking end)
  const rangeEnd = endD ?? (phase === 'end' && hovered ? hovered : null)

  return (
    <div className="select-none" onMouseLeave={() => setHovered(null)}>
      {/* Month header */}
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={prevMonth}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#f0f0ec] active:bg-[#e8e8e4] transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[#5c5c58]" />
        </button>
        <span className="font-bold text-[15px] text-[#0f0f0e]">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#f0f0ec] active:bg-[#e8e8e4] transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-[#5c5c58]" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-[#9c9c98] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid — 44px touch target height per row */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />

          const isPast    = day < min
          const isStart   = startD && sameDay(day, startD)
          const isEnd     = endD   && sameDay(day, endD)
          const inRange   = startD && rangeEnd && day > startD && day < rangeEnd
          const isToday   = sameDay(day, today)
          const isHovered = hovered && sameDay(day, hovered) && !isPast

          return (
            <div
              key={day.getTime()}
              className={cn(
                'flex items-center justify-center h-11 text-sm cursor-pointer transition-colors',
                // Range background — extend across full cell
                inRange && 'bg-[#fff4f0]',
                // Left edge of range
                isStart && endD && 'rounded-l-full bg-[#fff4f0]',
                // Right edge of range
                isEnd && startD && 'rounded-r-full bg-[#fff4f0]',
              )}
              onClick={() => !isPast && handleDayClick(day)}
              onMouseEnter={() => !isPast && phase === 'end' && setHovered(day)}
            >
              <div className={cn(
                'w-9 h-9 flex items-center justify-center rounded-full transition-all text-sm',
                isPast  && 'text-[#d0d0cc] cursor-not-allowed',
                !isPast && !isStart && !isEnd && !isHovered && 'hover:bg-[#f0f0ec]',
                (isStart || isEnd) && 'bg-[#FF6B35] text-white font-bold shadow-[0_2px_8px_rgba(255,107,53,0.4)]',
                isHovered && !isStart && !isEnd && 'bg-[#FF6B35]/20 text-[#FF6B35]',
                isToday && !isStart && !isEnd && 'font-bold text-[#FF6B35]',
                !isPast && !isStart && !isEnd && !isHovered && !isToday && 'text-[#0f0f0e]',
              )}>
                {day.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Hint text */}
      <p className="text-[11px] text-[#9c9c98] text-center mt-3">
        {!startD
          ? 'Select check-in date'
          : !endD
          ? 'Now select check-out date'
          : null
        }
      </p>
    </div>
  )
}
