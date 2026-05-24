'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { ScooterImage } from '@/components/ride/ScooterImage'
import {
  Bike, BookOpen, TrendingUp, Plus,
  Settings, MapPin, Star, Sparkles,
  CheckCircle2, Clock, ChevronRight, ArrowRight, Trash2,
  MessageCircle, Eye, RotateCcw, Phone, Store, Lightbulb, ShoppingBag,
} from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { deleteScooter } from '@/app/actions/scooter-delete'
import { PLAN_LABELS, FOUNDING_PARTNER_PERKS, isFoundingPartner } from '@/lib/plans'
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

const FEED_ICONS: Record<ActivityFeedItem['icon'], React.ComponentType<{ className?: string }>> = {
  whatsapp: MessageCircle,
  eye:      Eye,
  repeat:   RotateCcw,
  star:     Star,
  shop:     Store,
  phone:    Phone,
}

export default function DashboardClient({ profile, shop, scooters: initial, bookingStats, analytics, activityFeed }: DashboardClientProps) {
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
      label: 'Active Rentals',
      value: bookingStats.active,
      sub: 'right now',
      color: 'bg-[#f0fdf4] text-[#22c55e]',
    },
    {
      icon: Clock,
      label: 'Pending',
      value: bookingStats.pending,
      sub: 'new requests',
      color: 'bg-[#fffbeb] text-[#f59e0b]',
    },
    {
      icon: TrendingUp,
      label: 'Total Rentals',
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
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-sm font-semibold text-[#0f0f0e]">{shop.name}</span>
                  {shop.verified
                    ? <span className="px-2 py-0.5 bg-[#f0fdf4] text-[#22c55e] text-[10px] font-bold rounded-full uppercase tracking-wider">✓ Verified</span>
                    : <span className="px-2 py-0.5 bg-[#fffbeb] text-[#d97706] text-[10px] font-bold rounded-full uppercase tracking-wider">Pending Review</span>
                  }
                  {isFoundingPartner(shop.plan_type) && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-[#FF6B35]/10 to-[#f59e0b]/10 text-[#d97706] text-[10px] font-bold rounded-full border border-[#f59e0b]/20">
                      <Sparkles className="w-2.5 h-2.5" />
                      {PLAN_LABELS[shop.plan_type as keyof typeof PLAN_LABELS] ?? 'Partner'}
                    </span>
                  )}
                  <span className="text-[#9c9c98] text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{shop.location}
                  </span>
                </div>
              )}
            </div>
            <Link
              href="/partner/shop"
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

        {/* Founding Partner soft banner */}
        {shop && isFoundingPartner(shop.plan_type) && (
          <div className="bg-gradient-to-r from-[#fff8f0] to-[#fffbf0] border border-[#f59e0b]/20 rounded-[16px] px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#f59e0b] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#92400e]">Founding Partner — all features active</p>
                <p className="text-[11px] text-[#b45309] mt-0.5">
                  You have free access to all Pro features while Ride Phuket grows.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:ml-auto">
              {FOUNDING_PARTNER_PERKS.map(perk => (
                <span key={perk} className="text-[10px] font-semibold px-2 py-0.5 bg-[#f59e0b]/10 text-[#92400e] rounded-full border border-[#f59e0b]/15">
                  ✓ {perk}
                </span>
              ))}
            </div>
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

        {/* Analytics — this month */}
        {shop && analytics !== null && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[18px] font-bold text-[#0f0f0e]">Activity</h2>
                <p className="text-sm text-[#9c9c98] mt-0.5">Last 30 days</p>
              </div>
              <TrendingUp className="w-5 h-5 text-[#FF6B35]" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              {[
                { label: 'Scooter views',  value: analytics.scooterViews,   color: 'text-[#2563eb]',  bg: 'bg-[#eff6ff]' },
                { label: 'WhatsApp leads', value: analytics.whatsappClicks, color: 'text-[#16a34a]',  bg: 'bg-[#f0fdf4]' },
                { label: 'Shop views',     value: analytics.shopViews,      color: 'text-[#FF6B35]',  bg: 'bg-[#fff4f0]' },
                { label: 'Repeat visitors',value: analytics.repeatVisitors, color: 'text-[#7c3aed]',  bg: 'bg-[#f5f3ff]' },
              ].map(m => (
                <div key={m.label} className="bg-white rounded-[16px] border border-[#e8e8e4] p-4">
                  <p className={`text-[26px] font-bold leading-none ${m.color}`}>{m.value}</p>
                  <p className="text-[11px] text-[#9c9c98] mt-1.5 font-medium">{m.label}</p>
                </div>
              ))}
            </div>

            {(analytics.topScooterName || analytics.phoneClicks > 0) && (
              <div className="flex flex-wrap gap-2">
                {analytics.topScooterName && (
                  <span className="text-[11px] text-[#5c5c58] bg-white border border-[#e8e8e4] rounded-full px-3 py-1.5">
                    Most viewed: <strong className="text-[#0f0f0e]">{analytics.topScooterName}</strong>
                  </span>
                )}
                {analytics.phoneClicks > 0 && (
                  <span className="text-[11px] text-[#5c5c58] bg-white border border-[#e8e8e4] rounded-full px-3 py-1.5">
                    Phone contacts: <strong className="text-[#0f0f0e]">{analytics.phoneClicks}</strong>
                  </span>
                )}
              </div>
            )}

            {analytics.scooterViews === 0 && analytics.whatsappClicks === 0 && (
              <p className="text-[12px] text-[#9c9c98] text-center py-2">
                Share your shop link to start seeing activity here.
              </p>
            )}
          </div>
        )}

        {/* Activity Feed + Shop Insights — side-by-side on desktop */}
        {shop && (activityFeed.length > 0 || scooters.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Activity Feed */}
            {activityFeed.length > 0 && (
              <div>
                <h2 className="text-[18px] font-bold text-[#0f0f0e] mb-1">Recent Activity</h2>
                <p className="text-sm text-[#9c9c98] mb-4">Last 7 days</p>
                <div className="bg-white rounded-[20px] border border-[#e8e8e4] divide-y divide-[#f0f0ec] overflow-hidden">
                  {activityFeed.map(item => {
                    const Icon = FEED_ICONS[item.icon]
                    return (
                      <div key={item.id} className="flex items-start gap-3 p-4">
                        <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                          <Icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-[#0f0f0e] leading-snug">{item.message}</p>
                          <p className="text-[11px] text-[#9c9c98] mt-0.5">{item.timeAgo}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Shop Insights — heuristic tips from real scooter data */}
            {scooters.length > 0 && (() => {
              const tips: { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; text: string }[] = []

              const noPhotos   = scooters.filter(s => !s.images?.length)
              const unavail    = scooters.filter(s => !s.available)
              const hasWA      = analytics && analytics.whatsappClicks > 0
              const lowViews   = analytics && analytics.scooterViews < 5 && analytics.scooterViews >= 0
              const repeatHigh = analytics && analytics.repeatVisitors >= 3

              if (noPhotos.length > 0)
                tips.push({ icon: Eye, color: 'text-[#FF6B35]', bg: 'bg-[#fff4f0]',
                  text: `${noPhotos.length} scooter${noPhotos.length > 1 ? 's have' : ' has'} no photos — add images to get more views` })

              if (unavail.length === scooters.length)
                tips.push({ icon: CheckCircle2, color: 'text-[#dc2626]', bg: 'bg-[#fef2f2]',
                  text: 'All your scooters are marked unavailable — turn some on to appear in search results' })

              if (lowViews && !hasWA)
                tips.push({ icon: TrendingUp, color: 'text-[#2563eb]', bg: 'bg-[#eff6ff]',
                  text: 'Share your shop link in local Facebook groups or tourist forums to get your first leads' })

              if (repeatHigh)
                tips.push({ icon: Star, color: 'text-[#d97706]', bg: 'bg-[#fffbeb]',
                  text: `${analytics!.repeatVisitors} repeat visitors this week — they're interested but haven't reached out yet. Try adding a weekly price.` })

              if (!shop.verified)
                tips.push({ icon: Sparkles, color: 'text-[#7c3aed]', bg: 'bg-[#f5f3ff]',
                  text: 'Complete verification to unlock the Verified badge and rank higher in search' })

              if (tips.length === 0) return null

              return (
                <div>
                  <h2 className="text-[18px] font-bold text-[#0f0f0e] mb-1 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-[#d97706]" />
                    Shop Insights
                  </h2>
                  <p className="text-sm text-[#9c9c98] mb-4">Personalised tips to grow faster</p>
                  <div className="space-y-2.5">
                    {tips.slice(0, 4).map((tip, i) => {
                      const TipIcon = tip.icon
                      return (
                        <div key={i} className={`flex items-start gap-3 p-4 rounded-[16px] border border-[#e8e8e4] ${tip.bg}`}>
                          <TipIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tip.color}`} />
                          <p className="text-[13px] text-[#0f0f0e] leading-snug">{tip.text}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Quick links */}
        {shop && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { href: '/partner/bookings',   label: 'Rental Requests', icon: BookOpen, desc: 'View and manage rental contacts' },
              { href: `/shop/${shop.slug}`,  label: 'My Shop Page',    icon: Star,     desc: 'See your public shop profile' },
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
