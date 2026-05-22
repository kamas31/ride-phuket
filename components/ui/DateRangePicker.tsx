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

export interface BlockedRange {
  startDate: string  // YYYY-MM-DD
  endDate:   string  // YYYY-MM-DD
}

interface DateRangePickerProps {
  startDate: string    // 'YYYY-MM-DD'
  endDate:   string    // 'YYYY-MM-DD'
  onStartChange: (v: string) => void
  onEndChange:   (v: string) => void
  minDate?: string     // defaults to tomorrow
  blockedRanges?: BlockedRange[]  // dates that are already booked
}

// ── Component ────────────────────────────────────────────────────

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  minDate,
  blockedRanges = [],
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

  // Check if a single day falls within any blocked range
  const isDayBlocked = useCallback((day: Date): boolean => {
    return blockedRanges.some(r => {
      const bs = fromISO(r.startDate)
      const be = fromISO(r.endDate)
      return day >= bs && day < be
    })
  }, [blockedRanges])

  // Check if a range [start, end) contains any blocked day
  const isRangeBlocked = useCallback((start: Date, end: Date): boolean => {
    return blockedRanges.some(r => {
      const bs = fromISO(r.startDate)
      const be = fromISO(r.endDate)
      // Overlap: start < be AND end > bs
      return start < be && end > bs
    })
  }, [blockedRanges])

  // Max selectable end date: the day before the next blocked start
  const maxEndDate = useMemo((): Date | null => {
    if (!startD) return null
    const future = blockedRanges
      .map(r => fromISO(r.startDate))
      .filter(bs => bs > startD)
      .sort((a, b) => a.getTime() - b.getTime())
    return future[0] ?? null  // null = no restriction
  }, [startD, blockedRanges])

  const handleDayClick = useCallback((day: Date) => {
    if (day < min) return
    if (isDayBlocked(day)) return  // blocked — do nothing

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
      } else if (maxEndDate && day >= maxEndDate) {
        // Would cross a blocked range — don't allow
        return
      } else if (isRangeBlocked(startD, addDays(day, 1))) {
        // Range would span a blocked period
        return
      } else {
        onEndChange(toISO(day))
      }
    }
  }, [phase, startD, min, maxEndDate, isDayBlocked, isRangeBlocked, onStartChange, onEndChange])

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

          const isPast     = day < min
          const isBlocked  = isDayBlocked(day)
          const isStart    = startD && sameDay(day, startD)
          const isEnd      = endD   && sameDay(day, endD)
          const inRange    = startD && rangeEnd && day > startD && day < rangeEnd
          const isToday    = sameDay(day, today)
          const isHovered  = hovered && sameDay(day, hovered) && !isPast && !isBlocked
          const isDisabled = isPast || isBlocked
          const isMaxEnd   = maxEndDate && sameDay(day, maxEndDate) && !isBlocked && phase === 'end'

          return (
            <div
              key={day.getTime()}
              className={cn(
                'flex items-center justify-center h-11 text-sm transition-colors',
                isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
                // Range background
                inRange && !isBlocked && 'bg-[#fff4f0]',
                isStart && endD && 'rounded-l-full bg-[#fff4f0]',
                isEnd && startD && 'rounded-r-full bg-[#fff4f0]',
                // Blocked style: diagonal lines pattern hint
                isBlocked && 'relative',
              )}
              onClick={() => !isDisabled && handleDayClick(day)}
              onMouseEnter={() => !isDisabled && phase === 'end' && setHovered(day)}
            >
              <div className={cn(
                'w-9 h-9 flex items-center justify-center rounded-full transition-all text-sm relative',
                isPast   && 'text-[#d0d0cc]',
                isBlocked && 'text-[#d0d0cc]',
                !isDisabled && !isStart && !isEnd && !isHovered && 'hover:bg-[#f0f0ec]',
                (isStart || isEnd) && 'bg-[#FF6B35] text-white font-bold shadow-[0_2px_8px_rgba(255,107,53,0.4)]',
                isHovered && !isStart && !isEnd && 'bg-[#FF6B35]/20 text-[#FF6B35]',
                isToday && !isStart && !isEnd && !isBlocked && 'font-bold text-[#FF6B35]',
                !isDisabled && !isStart && !isEnd && !isHovered && !isToday && 'text-[#0f0f0e]',
                isMaxEnd && 'ring-1 ring-[#FF6B35]/30',
              )}>
                {day.getDate()}
                {/* Strikethrough line for blocked days */}
                {isBlocked && (
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="absolute w-7 h-px bg-[#d0d0cc] rotate-45" />
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Hint text */}
      <p className="text-[11px] text-[#9c9c98] text-center mt-3">
        {!startD
          ? 'Tap a date to set check-in'
          : !endD
          ? `Now tap check-out date${maxEndDate ? ` (max ${MONTHS[maxEndDate.getMonth()]} ${maxEndDate.getDate() - 1})` : ''}`
          : null
        }
      </p>
      {blockedRanges.length > 0 && (
        <p className="text-[10px] text-[#9c9c98] text-center mt-1.5 flex items-center justify-center gap-1">
          <span className="inline-block w-4 h-px bg-[#d0d0cc] rotate-45 translate-y-px" />
          Crossed dates already booked
        </p>
      )}
    </div>
  )
}
