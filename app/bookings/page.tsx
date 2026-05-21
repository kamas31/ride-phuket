'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Star, ArrowRight, CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react'
import { ScooterImage } from '@/components/ride/ScooterImage'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { useBookings } from '@/hooks/useBookings'
import { formatPrice, formatDateRange } from '@/lib/utils'
import type { BookingStatus } from '@/types'

const STATUS_CONFIG: Record<BookingStatus, {
  label: string
  badge: 'success' | 'brand' | 'warning' | 'default' | 'error'
  barColor: string
}> = {
  active:    { label: 'Active',     badge: 'success', barColor: 'bg-[#22c55e]' },
  confirmed: { label: 'Confirmed',  badge: 'brand',   barColor: 'bg-[#FF6B35]' },
  pending:   { label: 'Pending',    badge: 'warning',  barColor: 'bg-[#f59e0b]' },
  completed: { label: 'Completed',  badge: 'default',  barColor: 'bg-[#d0d0cc]' },
  cancelled: { label: 'Cancelled',  badge: 'error',    barColor: 'bg-[#ef4444]' },
}

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth()
  const { bookings, loading: bookingsLoading } = useBookings(user?.id ?? 'demo')

  const loading = authLoading || bookingsLoading
  const active = bookings.filter(b => b.status === 'active' || b.status === 'confirmed' || b.status === 'pending')
  const past   = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled')

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e8e4]">
        <div className="max-w-2xl mx-auto px-4 py-6 pt-24">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-[26px] font-bold text-[#0f0f0e] tracking-tight">My Bookings</h1>
              <p className="text-[#9c9c98] text-sm mt-0.5">{bookings.length} total rental{bookings.length !== 1 ? 's' : ''}</p>
            </div>
            {user && (
              <div className="text-xs text-[#9c9c98] text-right">
                <p className="font-medium text-[#0f0f0e]">{user.user_metadata?.name ?? user.email}</p>
                <p>Verified account</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Empty state */}
        {bookings.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🛵</div>
            <h2 className="text-[22px] font-bold text-[#0f0f0e] mb-2">No bookings yet</h2>
            <p className="text-[#5c5c58] text-sm mb-7 max-w-xs mx-auto">
              Your scooter rentals will appear here once you make your first booking.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors text-sm"
            >
              Find a Scooter <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Active / upcoming */}
        {active.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-[#9c9c98] uppercase tracking-widest mb-4">
              Active & Upcoming
            </h2>
            <div className="space-y-4">
              {active.map(booking => {
                const config = STATUS_CONFIG[booking.status]
                const scooter = booking.scooter
                const shop = booking.shop
                return (
                  <div key={booking.id} className="bg-white rounded-[20px] border border-[#e8e8e4] overflow-hidden">
                    <div className={`h-1 ${config.barColor}`} />
                    <div className="p-5">
                      <div className="flex gap-4 mb-4">
                        <ScooterImage
                          src={scooter?.images?.[0]}
                          alt={scooter?.name ?? 'Scooter'}
                          className="w-20 h-16 rounded-[12px] flex-shrink-0"
                          sizes="80px"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-[#0f0f0e] leading-tight text-[15px]">
                                {scooter?.name ?? 'Scooter'}
                              </h3>
                              <div className="flex items-center gap-1 text-xs text-[#9c9c98] mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {shop?.name ?? 'Partner shop'}
                              </div>
                            </div>
                            <Badge variant={config.badge}>{config.label}</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 mb-4">
                        <div className="px-3 py-2.5 bg-[#f8f8f6] rounded-[10px]">
                          <p className="text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-0.5">Dates</p>
                          <p className="text-xs font-semibold text-[#0f0f0e]">
                            {formatDateRange(booking.startDate, booking.endDate)}
                          </p>
                        </div>
                        <div className="px-3 py-2.5 bg-[#f8f8f6] rounded-[10px]">
                          <p className="text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-0.5">Total</p>
                          <p className="text-xs font-bold text-[#0f0f0e]">{formatPrice(booking.totalAmount)}</p>
                        </div>
                      </div>

                      {booking.deliveryMethod === 'delivery' && booking.deliveryAddress && (
                        <div className="flex items-start gap-2 text-xs text-[#5c5c58] mb-4">
                          <MapPin className="w-3.5 h-3.5 text-[#FF6B35] flex-shrink-0 mt-0.5" />
                          <span>{booking.deliveryAddress}</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {shop?.whatsapp && (
                          <a
                            href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 rounded-full bg-[#f0fdf4] text-[#16a34a] text-xs font-semibold border border-[#22c55e]/20 hover:bg-[#dcfce7] transition-colors text-center"
                          >
                            WhatsApp Shop
                          </a>
                        )}
                        <button className="flex-1 py-2.5 rounded-full border border-[#e8e8e4] text-xs font-medium text-[#5c5c58] hover:bg-[#f8f8f6] transition-colors">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Past */}
        {past.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-[#9c9c98] uppercase tracking-widest mb-4">Past Rentals</h2>
            <div className="space-y-3">
              {past.map(booking => {
                const config = STATUS_CONFIG[booking.status]
                const scooter = booking.scooter
                return (
                  <div key={booking.id} className="bg-white rounded-[20px] p-4 border border-[#e8e8e4] flex gap-4 items-center">
                    <ScooterImage
                      src={scooter?.images?.[0]}
                      alt={scooter?.name ?? 'Scooter'}
                      className="w-16 h-14 rounded-[10px] flex-shrink-0 opacity-70"
                      sizes="64px"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-[#0f0f0e] text-sm truncate">{scooter?.name ?? 'Scooter'}</p>
                        <Badge variant={config.badge}>{config.label}</Badge>
                      </div>
                      <p className="text-xs text-[#9c9c98] mt-0.5">
                        {formatDateRange(booking.startDate, booking.endDate)} · {formatPrice(booking.totalAmount)}
                      </p>
                    </div>
                    {booking.status === 'completed' && (
                      <button className="flex-shrink-0 w-9 h-9 rounded-full bg-[#fff4f0] flex items-center justify-center hover:bg-[#ffe4d4] transition-colors">
                        <Star className="w-4 h-4 text-[#FF6B35]" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        {bookings.length > 0 && (
          <div className="bg-[#0f0f0e] rounded-[20px] p-6 text-center">
            <p className="text-white font-bold text-[17px] mb-2">Need another scooter?</p>
            <p className="text-white/50 text-sm mb-5">Browse the full fleet across Phuket.</p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B35] text-white font-semibold rounded-full hover:bg-[#e85d29] transition-colors text-sm"
            >
              Browse Scooters <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
