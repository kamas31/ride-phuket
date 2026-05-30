'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ScooterImage } from '@/components/ride/ScooterImage'
import {
  Bike, Plus, Settings, MapPin,
  ChevronRight, ArrowRight, Trash2, ShoppingBag,
  ExternalLink, Eye, MessageSquare,
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
  activityFeed: ActivityFeedItem[]
}

export default function DashboardClient({
  profile, shop, scooters: initial, bookingStats: _bookingStats, analytics,
}: DashboardClientProps) {
  const [scooters, setScooters]           = useState(initial)
  const [togglingId, setTogglingId]       = useState<string | null>(null)
  const [deletingId, setDeletingId]       = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [deleteError, setDeleteError]     = useState<string | null>(null)

  const availableCount = scooters.filter(s => s.available).length
  const planType       = shop?.plan_type

  // ── Analytics preserved for future premium plans ──────────────────────────
  const _hasAdvanced     = canAccessAdvancedAnalytics(planType)
  const _hasLeadInsights = canAccessLeadInsights(planType)
  const _conversionRate  = analytics
    ? computeConversionRate(analytics.scooterViews, analytics.whatsappClicks) : 0
  const _conversionInsight = analytics
    ? getConversionInsight(analytics.scooterViews, analytics.whatsappClicks) : null
  void _hasAdvanced; void _hasLeadInsights; void _conversionRate; void _conversionInsight

  const hasHotScooters = canAccessHotScooters(planType)
  const hotScores = hasHotScooters && analytics?.scooterBreakdown?.length
    ? rankScootersByHotScore(analytics.scooterBreakdown.map(b => ({
        scooterId: b.scooterId, name: b.name,
        views: b.views, waClicks: b.waClicks,
        phoneClicks: b.phoneClicks, periodDays: analytics.periodDays,
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
    <div className="min-h-screen bg-[#f5f4f2]">
      <TrackView eventType="partner_dashboard" shopId={shop?.id} />

      {/* ─────────────────────────────────────────────────────────────────
          HERO — full-width white header
          Mobile:  shop name + stats row
          Desktop: shop name + stats row  +  performance block on the right
      ──────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#e8e8e4]">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-20 pb-7 sm:pb-8">
          <div className="flex items-start justify-between gap-6">

            {/* Shop identity */}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-[#FF6B35] uppercase tracking-[0.14em] mb-2">
                Partner Dashboard
              </p>
              <h1 className="text-[26px] sm:text-[30px] font-bold text-[#0f0f0e] tracking-tight leading-tight">
                {shop?.name ?? profile?.name ?? 'My Shop'}
              </h1>
              {shop && (
                <p className="text-[13px] text-[#9c9c98] mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  {shop.location}
                </p>
              )}
              {shop && (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold',
                    availableCount > 0 ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#f1f5f9] text-[#64748b]',
                  )}>
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full flex-shrink-0',
                      availableCount > 0 ? 'bg-[#22c55e]' : 'bg-[#94a3b8]',
                    )} />
                    {availableCount} Live
                  </span>
                  <span className="text-[13px] font-medium text-[#6b6b67]">
                    {(analytics?.scooterViews ?? 0).toLocaleString()} Views
                  </span>
                  <span className="text-[#d0d0cc]">·</span>
                  <span className="text-[13px] font-medium text-[#6b6b67]">
                    {analytics?.whatsappClicks ?? 0} Leads
                  </span>
                </div>
              )}
            </div>

            {/* Right: desktop performance block + settings */}
            <div className="flex items-center gap-3 flex-shrink-0 mt-1">

              {/* Performance — desktop only (hidden on mobile) */}
              {shop && analytics !== null && (
                <div className="hidden lg:flex items-center gap-5 bg-[#f5f4f2] rounded-[14px] px-5 py-3.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#FF6B35] flex-shrink-0" strokeWidth={2} />
                      <p className="text-[22px] font-bold text-[#0f0f0e] leading-none tabular-nums">
                        {analytics.scooterViews.toLocaleString()}
                      </p>
                    </div>
                    <p className="text-[11px] font-medium text-[#9c9c98] mt-1">Listing Views</p>
                  </div>
                  <div className="w-px h-8 bg-[#e2e2de] self-center" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#25d366] flex-shrink-0" strokeWidth={2} />
                      <p className="text-[22px] font-bold text-[#0f0f0e] leading-none tabular-nums">
                        {analytics.whatsappClicks.toLocaleString()}
                      </p>
                    </div>
                    <p className="text-[11px] font-medium text-[#9c9c98] mt-1">
                      WA {analytics.whatsappClicks === 1 ? 'Lead' : 'Leads'}
                    </p>
                  </div>
                  <div className="hidden xl:block w-px h-8 bg-[#e2e2de] self-center" />
                  <p className="hidden xl:block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-[0.1em]">
                    Last 30 days
                  </p>
                </div>
              )}

              {/* Settings */}
              <Link
                href="/partner/shop"
                aria-label="Shop settings"
                className="w-9 h-9 flex items-center justify-center rounded-[12px] bg-[#f5f4f2] text-[#5c5c58] hover:bg-[#ececea] hover:text-[#0f0f0e] transition-colors"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8">

        {/* ── No-shop onboarding ─────────────────────────────────────────── */}
        {!shop && (
          <div className="bg-white rounded-[24px] shadow-[0_2px_20px_-4px_rgba(0,0,0,0.08)] p-10 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-[#fff4f0] rounded-[20px] flex items-center justify-center mx-auto mb-5">
              <ShoppingBag className="w-8 h-8 text-[#FF6B35]" strokeWidth={1.5} />
            </div>
            <h2 className="text-[22px] font-bold text-[#0f0f0e] mb-2">Set up your shop</h2>
            <p className="text-[14px] text-[#6b6b67] leading-relaxed mb-7 max-w-sm mx-auto">
              Complete your shop profile to start receiving inquiries.
              Our team will verify your shop within 24 hours.
            </p>
            <Link
              href="/partner"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors text-[14px] shadow-[0_4px_14px_rgba(255,107,53,0.35)]"
            >
              Complete Shop Setup
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* ── Two-column layout (desktop) / stacked (mobile) ─────────────── */}
        {shop && (
          <div className="lg:grid lg:grid-cols-[1fr_272px] lg:gap-8 lg:items-start">

            {/* ── MAIN COLUMN ────────────────────────────────────────────── */}
            <div className="space-y-6">

              {/* Performance card — mobile only (desktop shows it in header) */}
              {analytics !== null && (
                <div className="lg:hidden bg-white rounded-[16px] overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.07),0_1px_3px_rgba(0,0,0,0.04)]">
                  <div className="px-5 pt-4 pb-3 border-b border-[#f2f2ef]">
                    <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-[0.12em]">
                      Last 30 days
                    </p>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-[#f2f2ef]">
                    <div className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Eye className="w-3.5 h-3.5 text-[#FF6B35] flex-shrink-0" strokeWidth={2} />
                        <p className="text-[26px] font-bold text-[#0f0f0e] leading-none tabular-nums">
                          {analytics.scooterViews.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-[12px] font-medium text-[#9c9c98]">Listing Views</p>
                    </div>
                    <div className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-3.5 h-3.5 text-[#25d366] flex-shrink-0" strokeWidth={2} />
                        <p className="text-[26px] font-bold text-[#0f0f0e] leading-none tabular-nums">
                          {analytics.whatsappClicks.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-[12px] font-medium text-[#9c9c98]">
                        WhatsApp {analytics.whatsappClicks === 1 ? 'Lead' : 'Leads'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Fleet Management ── */}
              <div>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <h2 className="text-[18px] font-bold text-[#0f0f0e]">My Fleet</h2>
                    {scooters.length > 0 && (
                      <p className="text-[12px] text-[#9c9c98] mt-0.5">
                        {scooters.length} {scooters.length === 1 ? 'scooter' : 'scooters'}
                        {' · '}
                        {availableCount} live
                      </p>
                    )}
                  </div>
                  <Link
                    href="/partner/scooters/new"
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#FF6B35] text-white text-[13px] font-semibold rounded-full hover:bg-[#e85d29] active:scale-[0.97] transition-all shadow-[0_2px_8px_rgba(255,107,53,0.28)]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Scooter
                  </Link>
                </div>

                {scooters.length === 0 ? (
                  <div className="bg-white rounded-[24px] shadow-[0_2px_16px_-2px_rgba(0,0,0,0.06)] p-10 text-center">
                    <div className="w-14 h-14 bg-[#f5f4f2] rounded-[18px] flex items-center justify-center mx-auto mb-4">
                      <Bike className="w-7 h-7 text-[#9c9c98]" strokeWidth={1.5} />
                    </div>
                    <p className="text-[15px] font-bold text-[#0f0f0e] mb-1.5">No scooters yet</p>
                    <p className="text-[13px] text-[#9c9c98] mb-6 max-w-xs mx-auto leading-relaxed">
                      Add your first scooter and start receiving inquiries today.
                    </p>
                    <Link
                      href="/partner/scooters/new"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-colors text-[13px]"
                    >
                      <Plus className="w-4 h-4" />
                      Add Your First Scooter
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deleteError && (
                      <div className="px-4 py-3 bg-[#fef2f2] text-[#dc2626] text-[12px] rounded-[14px] border border-[#fecaca]">
                        {deleteError}
                      </div>
                    )}

                    {scooters.map(scooter => (
                      <div
                        key={scooter.id}
                        className={cn(
                          'bg-white rounded-[20px] overflow-hidden',
                          'shadow-[0_1px_4px_rgba(0,0,0,0.04),0_2px_12px_-2px_rgba(0,0,0,0.06)]',
                          'transition-opacity duration-200',
                          !scooter.available && 'opacity-60',
                        )}
                      >
                        {/* Delete confirm */}
                        {deletingId === scooter.id && (
                          <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#fef2f2] border-b border-[#fecaca]">
                            <p className="text-[12px] text-[#dc2626] font-medium">
                              Delete <strong>{scooter.name}</strong>? This cannot be undone.
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => setDeletingId(null)}
                                className="text-[12px] text-[#5c5c58] hover:text-[#0f0f0e] font-medium"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDelete(scooter.id)}
                                disabled={deleteLoading === scooter.id}
                                className="px-3 py-1 bg-[#dc2626] text-white text-[11px] font-bold rounded-full hover:bg-[#b91c1c] disabled:opacity-50 transition-colors"
                              >
                                {deleteLoading === scooter.id ? 'Deleting…' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3.5 p-4 sm:p-5">
                          <ScooterImage
                            src={scooter.images?.[0]}
                            alt={scooter.name}
                            className="w-[72px] h-[62px] sm:w-20 sm:h-[68px] rounded-[14px] flex-shrink-0"
                            sizes="80px"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <p className="text-[14px] sm:text-[15px] font-semibold text-[#0f0f0e] leading-tight truncate">
                                    {scooter.name}
                                  </p>
                                  {(() => {
                                    const hot   = hotMap.get(scooter.id)
                                    const label = hot ? getHotStatusLabel(hot.status) : null
                                    return label ? (
                                      <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 bg-[#fff4f0] text-[#FF6B35] rounded-full border border-[#fed7b0]">
                                        {label}
                                      </span>
                                    ) : null
                                  })()}
                                </div>
                                <p className="text-[12px] text-[#9c9c98] mt-0.5 capitalize">
                                  {scooter.category}
                                  <span className="mx-1 text-[#d8d8d4]">·</span>
                                  <span className="text-[#5c5c58] font-medium">
                                    {formatPrice(scooter.price_per_day)}/day
                                  </span>
                                </p>
                              </div>
                              <button
                                onClick={() => toggleAvailability(scooter.id, scooter.available)}
                                disabled={togglingId === scooter.id}
                                className={cn(
                                  'relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 mt-0.5',
                                  scooter.available ? 'bg-[#22c55e]' : 'bg-[#e2e2de]',
                                  togglingId === scooter.id && 'opacity-50 cursor-wait',
                                )}
                                aria-label={scooter.available ? 'Mark unavailable' : 'Mark available'}
                              >
                                <div className={cn(
                                  'absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform duration-300',
                                  scooter.available ? 'translate-x-[22px]' : 'translate-x-[3px]',
                                )} />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              <span className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] font-semibold flex-shrink-0',
                                scooter.available
                                  ? 'bg-[#dcfce7] text-[#15803d]'
                                  : 'bg-[#f1f5f9] text-[#64748b]',
                              )}>
                                <span className={cn(
                                  'w-1.5 h-1.5 rounded-full flex-shrink-0',
                                  scooter.available ? 'bg-[#22c55e]' : 'bg-[#94a3b8]',
                                )} />
                                {scooter.available ? 'Live' : 'Hidden'}
                              </span>
                              <Link
                                href={`/partner/scooters/${scooter.id}/edit`}
                                className="px-3 py-[3px] rounded-full bg-[#f5f4f2] text-[11px] font-semibold text-[#5c5c58] hover:bg-[#ececea] hover:text-[#0f0f0e] transition-colors"
                              >
                                Edit
                              </Link>
                              <Link
                                href={`/scooter/${scooter.id}`}
                                title="View listing"
                                className="w-[26px] h-[26px] rounded-full bg-[#f5f4f2] flex items-center justify-center hover:bg-[#ececea] transition-colors"
                              >
                                <ExternalLink className="w-3 h-3 text-[#9c9c98]" />
                              </Link>
                              <button
                                onClick={() => setDeletingId(scooter.id)}
                                title="Delete scooter"
                                className="ml-auto w-[26px] h-[26px] rounded-full bg-[#fef2f2] flex items-center justify-center hover:bg-[#fee2e2] transition-colors"
                              >
                                <Trash2 className="w-3 h-3 text-[#dc2626]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
            {/* ── END MAIN COLUMN ── */}

            {/* ── SIDEBAR (right on desktop, below fleet on mobile) ──────── */}
            <div className="mt-6 lg:mt-0 lg:sticky lg:top-[88px] space-y-4 pb-6">

              {/* Quick Actions */}
              <div className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.04),0_2px_12px_-2px_rgba(0,0,0,0.05)] overflow-hidden divide-y divide-[#f2f2ef]">
                <Link
                  href="/partner/shop"
                  className="flex items-center gap-3.5 px-5 py-4 hover:bg-[#fafaf8] active:bg-[#f5f4f2] transition-colors group"
                >
                  <div className="w-8 h-8 bg-[#f5f4f2] rounded-[10px] flex items-center justify-center flex-shrink-0 group-hover:bg-[#ececea] transition-colors">
                    <Settings className="w-3.5 h-3.5 text-[#5c5c58]" />
                  </div>
                  <span className="flex-1 text-[14px] font-medium text-[#0f0f0e]">Shop Settings</span>
                  <ChevronRight className="w-4 h-4 text-[#c8c8c4] group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href={`/shop/${shop.slug}`}
                  className="flex items-center gap-3.5 px-5 py-4 hover:bg-[#fafaf8] active:bg-[#f5f4f2] transition-colors group"
                >
                  <div className="w-8 h-8 bg-[#f5f4f2] rounded-[10px] flex items-center justify-center flex-shrink-0 group-hover:bg-[#ececea] transition-colors">
                    <ExternalLink className="w-3.5 h-3.5 text-[#5c5c58]" />
                  </div>
                  <span className="flex-1 text-[14px] font-medium text-[#0f0f0e]">View Shop Page</span>
                  <ChevronRight className="w-4 h-4 text-[#c8c8c4] group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

            </div>
            {/* ── END SIDEBAR ── */}

          </div>
        )}

      </div>
    </div>
  )
}
