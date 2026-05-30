'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ScooterImage } from '@/components/ride/ScooterImage'
import {
  Bike, Plus, Settings, MapPin,
  ChevronRight, ArrowRight, Trash2, ShoppingBag,
} from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { deleteScooter } from '@/app/actions/scooter-delete'
import { toggleScooterAvailability } from '@/app/actions/scooter-availability'
import {
  canAccessAdvancedAnalytics, canAccessHotScooters, canAccessLeadInsights,
} from '@/lib/plans'
import { computeConversionRate, getConversionInsight } from '@/lib/lead-analytics'
import { rankScootersByHotScore, getHotStatusLabel } from '@/lib/hot-scooters'
import { TrackView } from '@/components/analytics/TrackView'
import type { Profile } from '@/hooks/useProfile'
import type { ShopAnalytics } from '@/app/actions/shop-analytics'
import type { ActivityFeedItem } from '@/app/actions/activity-feed'

interface DashboardClientProps {
  profile: Profile | null
  shop: { id: string; name: string; slug: string; location: string; verified: boolean; active: boolean; plan_type: string } | null
  scooters: {
    id: string; name: string; brand: string; model: string;
    price_per_day: number; location: string; available: boolean;
    images: string[]; category: string;
  }[]
  bookingStats: { pending: number; active: number; total: number }
  analytics: ShopAnalytics | null
  activityFeed: ActivityFeedItem[] // fetched, preserved for future use
}

export default function DashboardClient({ profile, shop, scooters: initial, bookingStats, analytics }: DashboardClientProps) {
  const [scooters, setScooters] = useState(initial)
  const [togglingId, setTogglingId]     = useState<string | null>(null)
  const [deletingId, setDeletingId]     = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [deleteError, setDeleteError]   = useState<string | null>(null)

  const availableCount = scooters.filter(s => s.available).length
  const planType       = shop?.plan_type

  // ── Analytics preserved for future premium plans (not displayed) ──────────
  const _hasAdvanced    = canAccessAdvancedAnalytics(planType)
  const _hasLeadInsights = canAccessLeadInsights(planType)
  const _conversionRate = analytics
    ? computeConversionRate(analytics.scooterViews, analytics.whatsappClicks)
    : 0
  const _conversionInsight = analytics
    ? getConversionInsight(analytics.scooterViews, analytics.whatsappClicks)
    : null
  void _hasAdvanced; void _hasLeadInsights; void _conversionRate; void _conversionInsight

  // Hot scooter scores — still rendered in fleet row badges
  const hasHotScooters = canAccessHotScooters(planType)
  const hotScores = hasHotScooters && analytics?.scooterBreakdown?.length
    ? rankScootersByHotScore(analytics.scooterBreakdown.map(b => ({
        scooterId:   b.scooterId,
        name:        b.name,
        views:       b.views,
        waClicks:    b.waClicks,
        phoneClicks: b.phoneClicks,
        periodDays:  analytics.periodDays,
      })))
    : []
  const hotMap = new Map(hotScores.map(h => [h.scooterId, h]))

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
    setScooters(prev => prev.map(s =>
      s.id === scooterId ? { ...s, available: !current } : s
    ))
    setTogglingId(scooterId)

    const result = await toggleScooterAvailability(scooterId, !current)

    if (result.error) {
      setScooters(prev => prev.map(s =>
        s.id === scooterId ? { ...s, available: current } : s
      ))
      toast.error('Failed to update availability')
    } else {
      toast.success(!current ? 'Scooter is now live' : 'Scooter hidden from search')
    }
    setTogglingId(null)
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <TrackView eventType="partner_dashboard" shopId={shop?.id} />

      {/* ── Section 1: Shop Overview ── */}
      <div className="bg-white border-b border-[#e8e8e4]">
        <div className="max-w-2xl mx-auto px-5 pt-20 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[22px] font-bold text-[#0f0f0e] tracking-tight leading-tight truncate">
                {shop?.name ?? profile?.name ?? 'My Shop'}
              </h1>
              {shop && (
                <p className="text-sm text-[#9c9c98] mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {shop.location}
                </p>
              )}
              {shop && (
                <div className="flex items-center gap-2 mt-3 text-[13px]">
                  <span className={cn('font-semibold', availableCount > 0 ? 'text-[#22c55e]' : 'text-[#9c9c98]')}>
                    {availableCount} Live
                  </span>
                  <span className="text-[#d0d0cc]">·</span>
                  <span className="font-medium text-[#0f0f0e]">
                    {(analytics?.scooterViews ?? 0).toLocaleString()} Views
                  </span>
                  <span className="text-[#d0d0cc]">·</span>
                  <span className="font-medium text-[#0f0f0e]">
                    {analytics?.whatsappClicks ?? 0} {analytics?.whatsappClicks === 1 ? 'Lead' : 'Leads'}
                  </span>
                </div>
              )}
            </div>
            <Link
              href="/partner/shop"
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-[#f8f8f6] border border-[#e8e8e4] text-[#5c5c58] hover:border-[#d0d0cc] transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-10">

        {/* No-shop onboarding */}
        {!shop && (
          <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-8 text-center">
            <div className="w-16 h-16 bg-[#fff4f0] rounded-[20px] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-[#FF6B35]" strokeWidth={1.5} />
            </div>
            <h2 className="text-[20px] font-bold text-[#0f0f0e] mb-2">Set up your shop</h2>
            <p className="text-[#5c5c58] text-sm leading-relaxed mb-6 max-w-sm mx-auto">
              Complete your shop profile to start receiving rental inquiries. Our team will verify your shop within 24 hours.
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

        {/* ── Section 2: Performance ── */}
        {shop && analytics !== null && (
          <div>
            <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-[0.12em] mb-6">
              Last 30 days
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[52px] font-bold text-[#0f0f0e] leading-none tabular-nums">
                  {analytics.scooterViews.toLocaleString()}
                </p>
                <p className="text-[14px] text-[#9c9c98] mt-2.5">Listing Views</p>
              </div>
              <div>
                <p className="text-[52px] font-bold text-[#0f0f0e] leading-none tabular-nums">
                  {analytics.whatsappClicks.toLocaleString()}
                </p>
                <p className="text-[14px] text-[#9c9c98] mt-2.5">
                  WhatsApp {analytics.whatsappClicks === 1 ? 'Lead' : 'Leads'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Section 3: Fleet Management ── */}
        {shop && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-bold text-[#0f0f0e]">My Fleet</h2>
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
                <div className="w-14 h-14 bg-[#f8f8f6] rounded-[18px] flex items-center justify-center mx-auto mb-4">
                  <Bike className="w-7 h-7 text-[#9c9c98]" strokeWidth={1.5} />
                </div>
                <p className="font-bold text-[#0f0f0e] mb-1">No scooters in your fleet yet</p>
                <p className="text-sm text-[#9c9c98] mb-6">Add your first scooter and start receiving rental inquiries today.</p>
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

                    <div className="flex gap-3 p-3.5 md:p-4 md:gap-4">
                      <ScooterImage
                        src={scooter.images?.[0]}
                        alt={scooter.name}
                        className="w-16 h-14 md:w-20 md:h-16 rounded-[10px] flex-shrink-0"
                        sizes="80px"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className="font-semibold text-[#0f0f0e] text-sm leading-tight truncate">{scooter.name}</p>
                              {(() => {
                                const hot = hotMap.get(scooter.id)
                                const label = hot ? getHotStatusLabel(hot.status) : null
                                return label ? (
                                  <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 bg-[#fff4f0] text-[#FF6B35] rounded-full border border-[#fed7b0]">
                                    {label}
                                  </span>
                                ) : null
                              })()}
                            </div>
                            <p className="text-[11px] text-[#9c9c98] mt-0.5 capitalize truncate">
                              {scooter.category} · {formatPrice(scooter.price_per_day)}/day
                            </p>
                          </div>
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

        {/* ── Section 4: Quick Actions ── */}
        {shop && (
          <div className="pb-4">
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] overflow-hidden divide-y divide-[#f0f0ec]">
              <Link
                href="/partner/shop"
                className="flex items-center justify-between px-5 py-4 text-sm font-medium text-[#0f0f0e] hover:bg-[#f8f8f6] transition-colors"
              >
                Shop Settings
                <ChevronRight className="w-4 h-4 text-[#9c9c98]" />
              </Link>
              <Link
                href={`/shop/${shop.slug}`}
                className="flex items-center justify-between px-5 py-4 text-sm font-medium text-[#0f0f0e] hover:bg-[#f8f8f6] transition-colors"
              >
                View Shop Page
                <ChevronRight className="w-4 h-4 text-[#9c9c98]" />
              </Link>
              <Link
                href="/partner/bookings"
                className="flex items-center justify-between px-5 py-4 text-sm font-medium text-[#0f0f0e] hover:bg-[#f8f8f6] transition-colors"
              >
                <span className="flex items-center gap-2">
                  Rental Requests
                  {bookingStats.pending > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-[#fff4f0] text-[#FF6B35] rounded-full">
                      {bookingStats.pending}
                    </span>
                  )}
                </span>
                <ChevronRight className="w-4 h-4 text-[#9c9c98]" />
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
