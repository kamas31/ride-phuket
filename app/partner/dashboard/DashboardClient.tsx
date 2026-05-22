'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ScooterImage } from '@/components/ride/ScooterImage'
import {
  Bike, BookOpen, TrendingUp, Plus,
  Settings, MapPin, Star,
  CheckCircle2, Clock, AlertCircle, ChevronRight, ArrowRight, Trash2,
} from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { deleteScooter } from '@/app/actions/scooter-delete'
import type { Profile } from '@/hooks/useProfile'

interface DashboardClientProps {
  profile: Profile | null
  shop: { id: string; name: string; slug: string; location: string; verified: boolean; active: boolean } | null
  scooters: {
    id: string; name: string; brand: string; model: string;
    price_per_day: number; location: string; available: boolean;
    images: string[]; category: string;
  }[]
  bookingStats: { pending: number; active: number; total: number }
}

export default function DashboardClient({ profile, shop, scooters: initial, bookingStats }: DashboardClientProps) {
  const [scooters, setScooters] = useState(initial)
  const [togglingId, setTogglingId]   = useState<string | null>(null)
  const [deletingId, setDeletingId]   = useState<string | null>(null) // confirm modal
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition]  = useTransition()

  const availableCount = scooters.filter(s => s.available).length

  async function handleDelete(scooterId: string) {
    setDeleteLoading(scooterId)
    setDeleteError(null)
    const result = await deleteScooter(scooterId)
    if (result.success) {
      setScooters(prev => prev.filter(s => s.id !== scooterId))
      setDeletingId(null)
    } else {
      setDeleteError(result.error ?? 'Delete failed.')
    }
    setDeleteLoading(null)
  }

  async function toggleAvailability(scooterId: string, current: boolean) {
    setTogglingId(scooterId)
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('scooters')
      .update({ available: !current })
      .eq('id', scooterId)

    if (!error) {
      setScooters(prev => prev.map(s =>
        s.id === scooterId ? { ...s, available: !current } : s
      ))
    }
    setTogglingId(null)
  }

  const STATS = [
    {
      icon: Bike,
      label: 'My Fleet',
      value: scooters.length,
      sub: `${availableCount} available`,
      color: 'bg-[#fff4f0] text-[#FF6B35]',
    },
    {
      icon: CheckCircle2,
      label: 'Active Bookings',
      value: bookingStats.active,
      sub: 'right now',
      color: 'bg-[#f0fdf4] text-[#22c55e]',
    },
    {
      icon: Clock,
      label: 'Pending',
      value: bookingStats.pending,
      sub: 'awaiting confirmation',
      color: 'bg-[#fffbeb] text-[#f59e0b]',
    },
    {
      icon: TrendingUp,
      label: 'Total Bookings',
      value: bookingStats.total,
      sub: 'all time',
      color: 'bg-[#eff6ff] text-[#2563eb]',
    },
  ]

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e8e4]">
        <div className="max-w-5xl mx-auto px-4 pt-20 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[#9c9c98] mb-1">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},
              </p>
              <h1 className="text-[26px] font-bold text-[#0f0f0e] tracking-tight leading-tight">
                {profile?.name?.split(' ')[0] ?? 'Partner'} 👋
              </h1>
              {shop && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-semibold text-[#0f0f0e]">{shop.name}</span>
                  {shop.verified
                    ? <span className="px-2 py-0.5 bg-[#f0fdf4] text-[#22c55e] text-[10px] font-bold rounded-full uppercase tracking-wider">✓ Verified</span>
                    : <span className="px-2 py-0.5 bg-[#fffbeb] text-[#d97706] text-[10px] font-bold rounded-full uppercase tracking-wider">Pending Review</span>
                  }
                  <span className="text-[#9c9c98] text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{shop.location}
                  </span>
                </div>
              )}
            </div>
            <Link
              href="/partner"
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-[#f8f8f6] border border-[#e8e8e4] rounded-full text-sm font-medium text-[#5c5c58] hover:border-[#d0d0cc] transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Shop Settings
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* No shop yet — onboarding prompt */}
        {!shop && (
          <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-8 text-center">
            <div className="text-5xl mb-4">🏪</div>
            <h2 className="text-[20px] font-bold text-[#0f0f0e] mb-2">Set up your shop</h2>
            <p className="text-[#5c5c58] text-sm leading-relaxed mb-6 max-w-sm mx-auto">
              Complete your shop profile to start receiving bookings. Our team will verify your shop within 24 hours.
            </p>
            <Link
              href="/partner"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors text-sm"
            >
              Complete Shop Setup
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Stats row */}
        {shop && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map(stat => (
              <div key={stat.label} className="bg-white rounded-[20px] p-5 border border-[#e8e8e4]">
                <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center mb-3 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="text-[28px] font-bold text-[#0f0f0e] leading-none">{stat.value}</p>
                <p className="text-xs font-semibold text-[#0f0f0e] mt-1">{stat.label}</p>
                <p className="text-[11px] text-[#9c9c98] mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Fleet management */}
        {shop && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[18px] font-bold text-[#0f0f0e]">My Fleet</h2>
                <p className="text-sm text-[#9c9c98] mt-0.5">Toggle availability in real-time</p>
              </div>
              <Link
                href="/partner/scooters/new"
                className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B35] text-white text-sm font-semibold rounded-full hover:bg-[#e85d29] transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Scooter
              </Link>
            </div>

            {scooters.length === 0 ? (
              <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-10 text-center">
                <div className="text-4xl mb-4">🛵</div>
                <p className="font-bold text-[#0f0f0e] mb-1">No scooters in your fleet yet</p>
                <p className="text-sm text-[#9c9c98] mb-6">Add your first scooter and start receiving bookings today.</p>
                <Link
                  href="/partner/scooters/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Scooter
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-[20px] border border-[#e8e8e4] overflow-hidden divide-y divide-[#f0f0ec]">
                {deleteError && (
                  <div className="px-4 py-3 bg-[#fef2f2] text-[#dc2626] text-xs border-b border-[#fecaca]">
                    {deleteError}
                  </div>
                )}
                {scooters.map((scooter, i) => (
                  <div
                    key={scooter.id}
                    className={cn(
                      'transition-colors',
                      scooter.available ? 'hover:bg-[#f8f8f6]' : 'bg-[#fafafa] opacity-75 hover:opacity-100'
                    )}
                    style={{ opacity: 0, animation: `fade-up 0.35s ease forwards ${i * 0.05}s` }}
                  >
                    {/* Confirm delete inline banner */}
                    {deletingId === scooter.id && (
                      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#fef2f2] border-b border-[#fecaca]">
                        <p className="text-xs text-[#dc2626] font-medium">Delete <strong>{scooter.name}</strong>? This cannot be undone.</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-xs text-[#5c5c58] hover:text-[#0f0f0e] font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(scooter.id)}
                            disabled={deleteLoading === scooter.id}
                            className="px-3 py-1 bg-[#dc2626] text-white text-xs font-bold rounded-full hover:bg-[#b91c1c] disabled:opacity-50 transition-colors"
                          >
                            {deleteLoading === scooter.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Responsive row:
                        - Mobile: image + name/price | toggle (2 rows)
                        - Desktop: full horizontal row */}
                    <div className="flex gap-3 p-3.5 md:p-4 md:gap-4">
                      {/* Image */}
                      <ScooterImage
                        src={scooter.images?.[0]}
                        alt={scooter.name}
                        className="w-16 h-14 md:w-20 md:h-16 rounded-[10px] flex-shrink-0"
                        sizes="80px"
                      />

                      {/* Content — full width, toggle on far right */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#0f0f0e] text-sm leading-tight truncate">{scooter.name}</p>
                            <p className="text-[11px] text-[#9c9c98] mt-0.5 capitalize truncate">
                              {scooter.category} · {formatPrice(scooter.price_per_day)}/day
                            </p>
                          </div>

                          {/* Toggle — always far right, always accessible */}
                          <button
                            onClick={() => toggleAvailability(scooter.id, scooter.available)}
                            disabled={togglingId === scooter.id}
                            className={cn(
                              'relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 mt-0.5',
                              scooter.available ? 'bg-[#22c55e]' : 'bg-[#e8e8e4]',
                              togglingId === scooter.id && 'opacity-50'
                            )}
                            aria-label={scooter.available ? 'Mark unavailable' : 'Mark available'}
                          >
                            <div className={cn(
                              'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
                              scooter.available ? 'translate-x-5' : 'translate-x-0.5'
                            )} />
                          </button>
                        </div>

                        {/* Actions row — always below name/toggle */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cn(
                            'text-[10px] font-semibold',
                            scooter.available ? 'text-[#22c55e]' : 'text-[#9c9c98]'
                          )}>
                            {scooter.available ? '● Live' : '○ Hidden'}
                          </span>

                          <Link
                            href={`/partner/scooters/${scooter.id}/edit`}
                            className="px-2.5 py-1 rounded-full bg-[#f8f8f6] border border-[#e8e8e4] text-[10px] font-semibold text-[#5c5c58] hover:border-[#FF6B35]/30 hover:text-[#FF6B35] transition-colors"
                          >
                            Edit
                          </Link>

                          <Link
                            href={`/scooter/${scooter.id}`}
                            className="w-7 h-7 rounded-full bg-[#f8f8f6] flex items-center justify-center hover:bg-[#f0f0ec] transition-colors"
                            title="View listing"
                          >
                            <ChevronRight className="w-3.5 h-3.5 text-[#9c9c98]" />
                          </Link>

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingId(scooter.id)}
                            className="ml-auto w-7 h-7 rounded-full bg-[#fef2f2] flex items-center justify-center hover:bg-[#fee2e2] transition-colors"
                            title="Delete scooter"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#dc2626]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick links */}
        {shop && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { href: '/bookings',           label: 'View All Bookings',   icon: BookOpen, desc: 'Manage incoming reservations' },
              { href: `/shop/${shop.slug}`,  label: 'My Shop Page',        icon: Star,     desc: 'See your public shop profile' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white rounded-[20px] p-5 border border-[#e8e8e4] hover:border-[#FF6B35]/30 hover:shadow-[0_4px_20px_-4px_rgba(255,107,53,0.1)] transition-all group"
              >
                <item.icon className="w-5 h-5 text-[#FF6B35] mb-3" />
                <p className="font-semibold text-[#0f0f0e] text-sm group-hover:text-[#FF6B35] transition-colors">{item.label}</p>
                <p className="text-xs text-[#9c9c98] mt-0.5">{item.desc}</p>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
