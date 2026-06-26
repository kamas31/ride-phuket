'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, MessageCircle, Check, X, Clock, Bike,
  ChevronRight, Calendar, MapPin, User,
} from 'lucide-react'
import { ScooterImage } from '@/components/ride/ScooterImage'
import { confirmBooking, cancelBooking } from '@/app/actions/booking-actions'
import { formatPrice, formatDateRange, getScooterCover } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ShopBookingRow } from '@/lib/supabase/queries'

// ── Status badge config ────────────────────────────────────────
const STATUS_CFG = {
  pending:   { label: 'New inquiry', cls: 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]' },
  confirmed: { label: 'Confirmed',   cls: 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]' },
  active:    { label: 'Active',      cls: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]' },
  completed: { label: 'Completed',   cls: 'bg-[#f8f8f6] text-[#9c9c98] border-[#e8e8e4]' },
  cancelled: { label: 'Declined',    cls: 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]' },
} as const

type StatusKey = keyof typeof STATUS_CFG

const STATUS_ORDER: StatusKey[] = ['pending', 'active', 'confirmed', 'completed', 'cancelled']

interface BookingsClientProps {
  bookings: ShopBookingRow[]
  shopId: string
}

export default function BookingsClient({ bookings: initial, shopId }: BookingsClientProps) {
  const [bookings, setBookings] = useState(initial)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [errorId, setErrorId]     = useState<string | null>(null)
  const [errorMsg, setErrorMsg]   = useState<string>('')
  const [filter, setFilter]       = useState<StatusKey | 'all'>('all')

  const filtered = useMemo(() =>
    filter === 'all' ? bookings : bookings.filter(b => b.status === filter),
    [bookings, filter]
  )

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => {
      const ai = STATUS_ORDER.indexOf(a.status as StatusKey)
      const bi = STATUS_ORDER.indexOf(b.status as StatusKey)
      return ai !== bi ? ai - bi : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }),
    [filtered]
  )

  const handleConfirm = useCallback(async (id: string) => {
    setLoadingId(id); setErrorId(null)
    const res = await confirmBooking(id)
    if (res.success) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' } : b))
    } else {
      setErrorId(id); setErrorMsg(res.error ?? 'Error')
    }
    setLoadingId(null)
  }, [])

  const handleCancel = useCallback(async (id: string) => {
    setLoadingId(id); setErrorId(null)
    const res = await cancelBooking(id, 'partner')
    if (res.success) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
    } else {
      setErrorId(id); setErrorMsg(res.error ?? 'Error')
    }
    setLoadingId(null)
  }, [])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    bookings.forEach(b => { c[b.status] = (c[b.status] ?? 0) + 1 })
    return c
  }, [bookings])

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e8e4]">
        <div className="max-w-2xl mx-auto px-4 pt-20 pb-5">
          <Link
            href="/partner/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-[#FF6B35] text-white hover:bg-[#e85d29] transition-all active:scale-95 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-[24px] font-bold text-[#0f0f0e] tracking-tight">Inquiries</h1>
              <p className="text-sm text-[#9c9c98] mt-0.5">{bookings.length} total</p>
            </div>
            {counts['pending'] > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fffbeb] border border-[#fde68a] rounded-full">
                <Clock className="w-3.5 h-3.5 text-[#d97706]" />
                <span className="text-xs font-bold text-[#d97706]">{counts['pending']} pending</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="bg-white border-b border-[#e8e8e4]">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2" style={{ scrollbarWidth: 'none' }}>
            {(['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap',
                  filter === s
                    ? 'bg-[#0f0f0e] text-white'
                    : 'bg-[#f8f8f6] text-[#5c5c58] hover:bg-[#f0f0ec]'
                )}
              >
                {s === 'all' ? 'All' : STATUS_CFG[s].label}
                {s !== 'all' && counts[s] > 0 && ` (${counts[s]})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {sorted.length === 0 && (
          <div className="text-center py-16">
            <Bike className="w-10 h-10 text-[#e8e8e4] mx-auto mb-3" />
            <p className="font-semibold text-[#0f0f0e] mb-1">No inquiries yet</p>
            <p className="text-sm text-[#9c9c98]">
              {filter === 'all'
                ? 'Inquiries will appear here once riders contact your shop.'
                : `No ${STATUS_CFG[filter as StatusKey]?.label.toLowerCase()} inquiries.`
              }
            </p>
          </div>
        )}

        {sorted.map(booking => {
          const cfg         = STATUS_CFG[booking.status as StatusKey] ?? STATUS_CFG.pending
          const scooterCover = getScooterCover({
            coverImage: booking.scooters?.cover_image,
            images:     booking.scooters?.images ?? [],
          })
          const waLink = booking.rider?.phone
            ? `https://wa.me/${booking.rider.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                `Hi ${booking.rider.name ?? 'rider'}! This is ${booking.scooters?.name ?? 'your scooter'} shop on Koh Ride regarding your booking from ${booking.start_date} to ${booking.end_date}.`
              )}`
            : null

          const isPending   = booking.status === 'pending'
          const isCancellable = ['pending', 'confirmed'].includes(booking.status)
          const isLoading   = loadingId === booking.id
          const hasError    = errorId === booking.id

          return (
            <div key={booking.id} className="bg-white rounded-[20px] border border-[#e8e8e4] overflow-hidden">
              {/* Status bar */}
              <div className={cn(
                'h-1',
                booking.status === 'pending'   && 'bg-[#f59e0b]',
                booking.status === 'confirmed' && 'bg-[#2563eb]',
                booking.status === 'active'    && 'bg-[#22c55e]',
                booking.status === 'completed' && 'bg-[#d0d0cc]',
                booking.status === 'cancelled' && 'bg-[#ef4444]',
              )} />

              <div className="p-4">
                {/* Top row */}
                <div className="flex items-start gap-3 mb-3">
                  {/* Scooter image */}
                  <ScooterImage
                    src={scooterCover || undefined}
                    alt={booking.scooters?.name ?? ''}
                    className="w-16 h-12 rounded-[10px] flex-shrink-0"
                    width={64}
                    height={48}
                  />
                  {/* Scooter + rider info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 justify-between">
                      <p className="font-bold text-sm text-[#0f0f0e] truncate">
                        {booking.scooters?.name ?? 'Scooter'}
                      </p>
                      <span className={cn(
                        'flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border',
                        cfg.cls
                      )}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#9c9c98] mt-0.5">
                      <User className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{booking.rider?.name ?? 'Rider'}</span>
                      {booking.rider?.phone && (
                        <span className="text-[#d0d0cc]">·</span>
                      )}
                      {booking.rider?.phone && (
                        <span className="text-[#9c9c98]">{booking.rider.phone}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details row */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="px-3 py-2 bg-[#f8f8f6] rounded-[10px]">
                    <p className="text-[9px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-0.5">Dates</p>
                    <div className="flex items-center gap-1 text-xs font-semibold text-[#0f0f0e]">
                      <Calendar className="w-3 h-3 text-[#9c9c98]" />
                      {booking.start_date} → {booking.end_date}
                    </div>
                  </div>
                  <div className="px-3 py-2 bg-[#f8f8f6] rounded-[10px]">
                    <p className="text-[9px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-0.5">Total</p>
                    <p className="text-xs font-bold text-[#0f0f0e]">{formatPrice(booking.total_amount)}</p>
                  </div>
                </div>

                {booking.delivery_address && (
                  <div className="flex items-start gap-1.5 text-xs text-[#5c5c58] mb-3">
                    <MapPin className="w-3.5 h-3.5 text-[#FF6B35] flex-shrink-0 mt-0.5" />
                    <span>{booking.delivery_address}</span>
                  </div>
                )}

                {/* Error */}
                {hasError && (
                  <p className="text-xs text-[#dc2626] bg-[#fef2f2] px-3 py-2 rounded-[8px] mb-3">
                    {errorMsg}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {isPending && (
                    <button
                      onClick={() => handleConfirm(booking.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FF6B35] text-white text-xs font-bold rounded-full hover:bg-[#e85d29] disabled:opacity-50 transition-colors flex-1 justify-center"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {isLoading ? 'Confirming…' : 'Confirm'}
                    </button>
                  )}
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-[#f0fdf4] border border-[#22c55e]/20 text-[#16a34a] text-xs font-bold rounded-full hover:bg-[#dcfce7] transition-colors flex-1 justify-center"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  )}
                  {isCancellable && !isPending && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-[#fef2f2] border border-[#fecaca]/50 text-[#dc2626] text-xs font-semibold rounded-full hover:bg-[#fee2e2] disabled:opacity-50 transition-colors flex-1 justify-center"
                    >
                      <X className="w-3.5 h-3.5" />
                      {isLoading ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                  {isPending && isCancellable && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      disabled={isLoading}
                      className="w-9 h-9 flex items-center justify-center bg-[#fef2f2] border border-[#fecaca]/50 text-[#dc2626] rounded-full hover:bg-[#fee2e2] disabled:opacity-50 transition-colors flex-shrink-0"
                      title="Decline request"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

