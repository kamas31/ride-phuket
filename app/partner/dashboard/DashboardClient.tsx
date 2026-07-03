'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ScooterImage } from '@/components/ride/ScooterImage'
import {
  Bike, Plus, Settings, MapPin,
  ChevronDown, ChevronRight, ArrowRight, Trash2, ShoppingBag,
  ExternalLink, Eye, MessageCircle, MessageSquare, Star,
  LogOut, Headphones,
} from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { deleteScooter } from '@/app/actions/scooter-delete'
import { toggleScooterAvailability } from '@/app/actions/scooter-availability'
import { updateShopLogo } from '@/app/actions/profile'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import {
  canAccessAdvancedAnalytics, canAccessHotScooters, canAccessLeadInsights,
} from '@/lib/plans'
import { computeConversionRate, getConversionInsight } from '@/lib/lead-analytics'
import { rankScootersByHotScore, getHotStatusLabel } from '@/lib/hot-scooters'
import { TrackView } from '@/components/analytics/TrackView'
import { shopProperties } from '@/lib/posthog'
import { AvatarUploader } from '@/components/shared/AvatarUploader'
import type { Profile } from '@/hooks/useProfile'
import type { ShopAnalytics } from '@/app/actions/shop-analytics'
import type { ActivityFeedItem } from '@/app/actions/activity-feed'

interface DashboardClientProps {
  profile: Profile | null
  shop: { id: string; name: string; slug: string; location: string; verified: boolean; active: boolean; plan_type: string; logo_url: string | null } | null
  scooters: {
    id: string; name: string; brand: string; model: string;
    price_per_day: number; location: string; available: boolean;
    images: string[]; category: string;
    specs: Record<string, string>;
  }[]
  bookingStats: { pending: number; active: number; total: number }
  analytics: ShopAnalytics | null
  activityFeed: ActivityFeedItem[] // fetched, preserved for future use
  unreadCount: number
  unreadPreview: { senderName: string | null; messageText: string | null; scooterName: string | null } | null
  unreadReviewCount: number
}

export default function DashboardClient({
  profile, shop, scooters: initial, bookingStats: _bookingStats, analytics, unreadCount, unreadPreview, unreadReviewCount,
}: DashboardClientProps) {
  const { signOut } = useAuth()
  const [scooters, setScooters]           = useState(initial)
  const [togglingId, setTogglingId]       = useState<string | null>(null)
  const [deletingId, setDeletingId]       = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [deleteError, setDeleteError]     = useState<string | null>(null)

  const availableCount = scooters.filter(s => s.available).length
  const offlineCount   = scooters.length - availableCount

  // Sort fleet by engine displacement (cc) ascending; unknown cc goes last
  const parseCC = (engine: string | undefined): number => {
    const n = parseInt((engine ?? '').replace(/[^\d]/g, ''), 10)
    return isNaN(n) ? Infinity : n
  }
  const sortedScooters = [...scooters].sort(
    (a, b) => parseCC(a.specs?.engine) - parseCC(b.specs?.engine)
  )
  const planType       = shop?.plan_type
  const [fleetOpen, setFleetOpen] = useState(false)

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
      <TrackView
        eventType="partner_dashboard"
        shopId={shop?.id}
        posthogEvent="partner_dashboard_opened"
        posthogProperties={shop ? shopProperties(shop) : undefined}
      />

      {/* ─────────────────────────────────────────────────────────────────────
          HERO — Shop identity & at-a-glance status
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#e8e8e4]">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 pt-20 pb-7 sm:pb-8">
          <div className="flex items-start gap-4">

            {/* Shop logo / avatar */}
            {shop && (
              <AvatarUploader
                currentUrl={shop.logo_url}
                name={shop.name}
                size={72}
                addText="Add shop logo"
                changeText="Change shop logo"
                onUpload={async (blob) => {
                  try {
                    const supabase = createClient()
                    const path = `shops/${shop.id}/logo/avatar.jpg`
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const { error } = await (supabase as any).storage
                      .from('scooter-images')
                      .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
                    if (error) throw error
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const { data: { publicUrl } } = (supabase as any).storage
                      .from('scooter-images')
                      .getPublicUrl(path)
                    const url = `${publicUrl}?t=${Date.now()}`
                    await updateShopLogo(shop.id, url)
                    return url
                  } catch (err) {
                    console.error('[DashboardClient] logo upload failed:', err)
                    toast.error('Failed to upload logo')
                    return null
                  }
                }}
                onRemove={async () => {
                  await updateShopLogo(shop.id, null)
                  const supabase = createClient()
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await (supabase as any).storage
                    .from('scooter-images')
                    .remove([`shops/${shop.id}/logo/avatar.jpg`])
                }}
              />
            )}

            <div className="min-w-0 flex-1">
              {/* Brand label */}
              <p className="text-[11px] font-semibold text-[#FF6B35] uppercase tracking-[0.14em] mb-2">
                Partner Dashboard
              </p>

              {/* Shop name */}
              <h1 className="text-[26px] sm:text-[30px] font-bold text-[#0f0f0e] tracking-tight leading-tight">
                {shop?.name ?? profile?.name ?? 'My Shop'}
              </h1>

              {/* Location */}
              {shop && (
                <p className="text-[13px] text-[#9c9c98] mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  {shop.location}
                </p>
              )}

            </div>

            {/* Settings */}
            <Link
              href="/partner/shop"
              aria-label="Shop settings"
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-[12px] bg-[#f5f4f2] text-[#5c5c58] hover:bg-[#ececea] hover:text-[#0f0f0e] transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Link>

          </div>
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8 space-y-8">

        {/* ── No-shop onboarding ─────────────────────────────────────────── */}
        {!shop && (
          <div className="bg-white rounded-[24px] shadow-[0_2px_20px_-4px_rgba(0,0,0,0.08)] p-10 text-center">
            <div className="w-16 h-16 bg-[#fff4f0] rounded-[20px] flex items-center justify-center mx-auto mb-5">
              <ShoppingBag className="w-8 h-8 text-[#FF6B35]" strokeWidth={1.5} />
            </div>
            <h2 className="text-[22px] font-bold text-[#0f0f0e] mb-2">Set up your shop</h2>
            <p className="text-[14px] text-[#6b6b67] leading-relaxed mb-7 max-w-sm mx-auto">
              Complete your shop profile to start receiving rental inquiries.
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

        {/* ─────────────────────────────────────────────────────────────────
            UNREAD MESSAGES ALERT — highest priority
        ──────────────────────────────────────────────────────────────────── */}
        {shop && unreadCount > 0 && (() => {
          // Build preview line: "John: Hi, is the scooter available…" or fallback
          let previewLine = 'New inquiry received'
          if (unreadPreview) {
            const { senderName, messageText, scooterName } = unreadPreview
            if (senderName && messageText) {
              previewLine = `${senderName}: ${messageText}`
            } else if (messageText) {
              previewLine = messageText
            } else if (scooterName) {
              previewLine = `New inquiry about ${scooterName}`
            }
          }
          return (
            <Link
              href="/partner/messages"
              className="block bg-[#fff4f0] rounded-[16px] border border-[#fed7b0] hover:bg-[#ffe8d6] active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 bg-[#FF6B35] rounded-[12px] flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(255,107,53,0.35)]">
                  <MessageCircle className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-[#0f0f0e] leading-tight">
                    {unreadCount === 1 ? 'New message' : `${unreadCount} new messages`}
                  </p>
                  <p className="text-[12px] text-[#5c5c58] mt-0.5 truncate">
                    {previewLine}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-[13px] font-bold text-[#FF6B35]">Open</span>
                  <ChevronRight className="w-4 h-4 text-[#FF6B35]" />
                </div>
              </div>
            </Link>
          )
        })()}

        {/* ─────────────────────────────────────────────────────────────────
            UNREAD REVIEWS ALERT
        ──────────────────────────────────────────────────────────────────── */}
        {shop && unreadReviewCount > 0 && (
          <Link
            href={`/shop/${shop.slug}#reviews`}
            className="block bg-[#fefce8] rounded-[16px] border border-[#fde68a] hover:bg-[#fef9c3] active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 bg-[#f59e0b] rounded-[12px] flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(245,158,11,0.35)]">
                <Star className="w-5 h-5 text-white" strokeWidth={2} fill="white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-[#0f0f0e] leading-tight">
                  {unreadReviewCount === 1 ? 'New review' : `${unreadReviewCount} new reviews`}
                </p>
                <p className="text-[12px] text-[#5c5c58] mt-0.5">
                  Tap to read and reply
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-[13px] font-bold text-[#f59e0b]">View</span>
                <ChevronRight className="w-4 h-4 text-[#f59e0b]" />
              </div>
            </div>
          </Link>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            PERFORMANCE — 4-column metrics card
        ──────────────────────────────────────────────────────────────────── */}
        {shop && analytics !== null && (
          <div className="bg-white rounded-[16px] overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.07),0_1px_3px_rgba(0,0,0,0.04)]">

            {/* Header */}
            <div className="px-5 pt-4 pb-3 border-b border-[#f2f2ef]">
              <p className="text-[11px] font-semibold text-[#9c9c98] uppercase tracking-[0.12em]">
                Performance
              </p>
            </div>

            {/* 4-column grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#f2f2ef]">

              {/* Col 1 — Total Views */}
              <div className="px-5 py-5 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#9c9c98] flex-shrink-0" strokeWidth={2} />
                  <p className="text-[28px] font-bold text-[#0f0f0e] leading-none tabular-nums">
                    {analytics.scooterViews.toLocaleString()}
                  </p>
                </div>
                <p className="text-[12px] font-medium text-[#9c9c98] leading-snug">
                  Total Views
                </p>
              </div>

              {/* Col 2 — In-App Leads */}
              <div className="px-5 py-5 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#FF6B35] flex-shrink-0" strokeWidth={2} />
                  <p className="text-[28px] font-bold text-[#0f0f0e] leading-none tabular-nums">
                    {analytics.inAppLeads}
                  </p>
                </div>
                <p className="text-[12px] font-medium text-[#9c9c98] leading-snug">
                  {analytics.inAppLeads === 1 ? 'In-App Lead' : 'In-App Leads'}
                </p>
              </div>

              {/* Col 3 — WhatsApp Leads */}
              <div className="px-5 py-5 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#25d366] flex-shrink-0" strokeWidth={2} />
                  <p className="text-[28px] font-bold text-[#0f0f0e] leading-none tabular-nums">
                    {analytics.whatsappClicks}
                  </p>
                </div>
                <p className="text-[12px] font-medium text-[#9c9c98] leading-snug">
                  {analytics.whatsappClicks === 1 ? 'WhatsApp Lead' : 'WhatsApp Leads'}
                </p>
              </div>

              {/* Col 4 — Most Viewed */}
              <div className="px-5 py-5 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#f59e0b] flex-shrink-0" strokeWidth={2} />
                  <p className="text-[12px] sm:text-[14px] font-bold text-[#0f0f0e] leading-tight line-clamp-2">
                    {analytics.topScooterName ?? '—'}
                  </p>
                </div>
                <p className="text-[12px] font-medium text-[#9c9c98] leading-snug">
                  Most Viewed
                </p>
              </div>

            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            FLEET MANAGEMENT — collapsible accordion
        ──────────────────────────────────────────────────────────────────── */}
        {shop && (
          <div>
            {/* Accordion header — always visible */}
            <div className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.04),0_2px_12px_-2px_rgba(0,0,0,0.06)] overflow-hidden mb-3">
              <div className="flex items-center gap-3 px-5 py-4">

                {/* Clickable title + summary */}
                <button
                  onClick={() => setFleetOpen(o => !o)}
                  className="flex-1 min-w-0 text-left flex items-center gap-3 group"
                  aria-expanded={fleetOpen}
                >
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[18px] font-bold text-[#0f0f0e]">My Fleet</h2>
                    {scooters.length > 0 ? (
                      <p className="text-[12px] text-[#9c9c98] mt-0.5">
                        {scooters.length} {scooters.length === 1 ? 'scooter' : 'scooters'}
                        {' · '}
                        {availableCount} live
                        {offlineCount > 0 && ` · ${offlineCount} offline`}
                      </p>
                    ) : (
                      <p className="text-[12px] text-[#9c9c98] mt-0.5">No scooters yet</p>
                    )}
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-[#c8c8c4] flex-shrink-0 transition-transform duration-200',
                      fleetOpen && 'rotate-180',
                    )}
                    strokeWidth={2}
                  />
                </button>

                {/* Add Scooter — always accessible */}
                <Link
                  href="/partner/scooters/new"
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#FF6B35] text-white text-[13px] font-semibold rounded-full hover:bg-[#e85d29] active:scale-[0.97] transition-all shadow-[0_2px_8px_rgba(255,107,53,0.28)] flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Scooter
                </Link>

              </div>

              {/* Fleet thumbnail preview — visible when collapsed */}
              {!fleetOpen && sortedScooters.length > 0 && (
                <div className="px-5 pb-4 flex items-center">
                  {sortedScooters.slice(0, 5).map((s, i) => (
                    <div
                      key={s.id}
                      className="relative w-11 h-11 rounded-full border-2 border-white overflow-hidden flex-shrink-0 bg-[#f5f4f2]"
                      style={{ zIndex: 6 - i, marginLeft: i > 0 ? '-10px' : '0' }}
                    >
                      <ScooterImage
                        src={s.images?.[0]}
                        alt={s.name}
                        className="w-full h-full object-cover"
                        width={44}
                        height={44}
                      />
                    </div>
                  ))}
                  {sortedScooters.length > 5 && (
                    <div
                      className="relative w-11 h-11 rounded-full bg-[#f0f0ec] border-2 border-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-[#5c5c58]"
                      style={{ zIndex: 0, marginLeft: '-10px' }}
                    >
                      +{sortedScooters.length - 5}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Collapsible fleet list */}
            {fleetOpen && (scooters.length === 0 ? (
              <div className="bg-white rounded-[24px] shadow-[0_2px_16px_-2px_rgba(0,0,0,0.06)] p-10 text-center">
                <div className="w-14 h-14 bg-[#f5f4f2] rounded-[18px] flex items-center justify-center mx-auto mb-4">
                  <Bike className="w-7 h-7 text-[#9c9c98]" strokeWidth={1.5} />
                </div>
                <p className="text-[15px] font-bold text-[#0f0f0e] mb-1.5">No scooters yet</p>
                <p className="text-[13px] text-[#9c9c98] mb-6 max-w-xs mx-auto leading-relaxed">
                  Add your first scooter and start receiving rental inquiries today.
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

                {sortedScooters.map(scooter => (
                  <div
                    key={scooter.id}
                    className={cn(
                      'bg-white rounded-[20px] overflow-hidden',
                      'shadow-[0_1px_4px_rgba(0,0,0,0.04),0_2px_12px_-2px_rgba(0,0,0,0.06)]',
                      'transition-opacity duration-200',
                      !scooter.available && 'opacity-60',
                    )}
                  >
                    {/* Delete confirm banner */}
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
                      {/* Thumbnail */}
                      <ScooterImage
                        src={scooter.images?.[0]}
                        alt={scooter.name}
                        className="w-[72px] h-[62px] sm:w-20 sm:h-[68px] rounded-[14px] flex-shrink-0"
                        width={80}
                        height={68}
                      />

                      {/* Info */}
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

                          {/* Availability toggle */}
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

                        {/* Status badge + action row */}
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
            ))}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            QUICK ACTIONS
        ──────────────────────────────────────────────────────────────────── */}
        {shop && (
          <div className="pb-6">
            <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04),0_2px_12px_-2px_rgba(0,0,0,0.05)] divide-y divide-[#f2f2ef]">

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
        )}

        {/* ── SUPPORT ── */}
        <div className="pb-3">
          <p className="text-[10px] font-semibold text-[#9c9c98] uppercase tracking-widest mb-3 px-1">Support</p>
          <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04),0_2px_12px_-2px_rgba(0,0,0,0.05)] divide-y divide-[#f2f2ef]">
            <Link
              href="/feedback"
              className="flex items-center gap-3.5 px-5 py-4 hover:bg-[#fafaf8] active:bg-[#f5f4f2] transition-colors group"
            >
              <div className="w-8 h-8 bg-[#f5f4f2] rounded-[10px] flex items-center justify-center flex-shrink-0 group-hover:bg-[#ececea] transition-colors">
                <MessageSquare className="w-3.5 h-3.5 text-[#5c5c58]" />
              </div>
              <span className="flex-1 text-[14px] font-medium text-[#0f0f0e]">Feedback</span>
              <ChevronRight className="w-4 h-4 text-[#c8c8c4] group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/contact-us"
              className="flex items-center gap-3.5 px-5 py-4 hover:bg-[#fafaf8] active:bg-[#f5f4f2] transition-colors group"
            >
              <div className="w-8 h-8 bg-[#f5f4f2] rounded-[10px] flex items-center justify-center flex-shrink-0 group-hover:bg-[#ececea] transition-colors">
                <Headphones className="w-3.5 h-3.5 text-[#5c5c58]" />
              </div>
              <span className="flex-1 text-[14px] font-medium text-[#0f0f0e]">Contact Us</span>
              <ChevronRight className="w-4 h-4 text-[#c8c8c4] group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* ── ACCOUNT ── */}
        <div className="pb-8">
          <p className="text-[10px] font-semibold text-[#9c9c98] uppercase tracking-widest mb-3 px-1">Account</p>
          <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04),0_2px_12px_-2px_rgba(0,0,0,0.05)] divide-y divide-[#f2f2ef]">
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-[#fafaf8] active:bg-[#f5f4f2] transition-colors group"
            >
              <div className="w-8 h-8 bg-[#f5f4f2] rounded-[10px] flex items-center justify-center flex-shrink-0 group-hover:bg-[#ececea] transition-colors">
                <LogOut className="w-3.5 h-3.5 text-[#5c5c58]" />
              </div>
              <span className="flex-1 text-[14px] font-medium text-[#0f0f0e] text-left">Sign Out</span>
            </button>
            <Link
              href="/profile"
              className="flex items-center gap-3.5 px-5 py-4 hover:bg-[#fff5f5] active:bg-[#fee2e2] transition-colors group"
            >
              <div className="w-8 h-8 bg-[#fff5f5] rounded-[10px] flex items-center justify-center flex-shrink-0 group-hover:bg-[#fee2e2] transition-colors">
                <Trash2 className="w-3.5 h-3.5 text-[#ef4444]" />
              </div>
              <span className="flex-1 text-[14px] font-medium text-[#ef4444]">Delete Account</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
