'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface ScooterAnalyticsBreakdown {
  scooterId:   string
  name:        string
  views:       number
  waClicks:    number
  phoneClicks: number
}

export interface ShopAnalytics {
  scooterViews:      number
  shopViews:         number
  whatsappClicks:    number
  phoneClicks:       number
  topScooterName:    string | null
  repeatVisitors:    number
  periodDays:        number
  scooterBreakdown:  ScooterAnalyticsBreakdown[]
}

export async function getShopAnalytics(shopId: string, days = 30): Promise<ShopAnalytics> {
  const empty: ShopAnalytics = {
    scooterViews: 0, shopViews: 0, whatsappClicks: 0,
    phoneClicks: 0, topScooterName: null, repeatVisitors: 0, periodDays: days,
    scooterBreakdown: [],
  }

  try {
    const admin  = createAdminClient()
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: events, error } = await (admin as any)
      .from('events')
      .select('event_type, session_id, scooter_id, metadata')
      .eq('shop_id', shopId)
      .gte('created_at', cutoff)

    if (error || !events?.length) return empty

    const ev: { event_type: string; session_id: string | null; scooter_id: string | null; metadata: Record<string, unknown> }[] = events

    const scooterViews   = ev.filter(e => e.event_type === 'scooter_view').length
    const shopViews      = ev.filter(e => e.event_type === 'shop_view').length
    const whatsappClicks = ev.filter(e => e.event_type === 'whatsapp_click').length
    const phoneClicks    = ev.filter(e => e.event_type === 'phone_click').length

    // Per-scooter breakdown (also used for top scooter + hot scoring)
    const scooterMap = new Map<string, { name: string; views: number; waClicks: number; phoneClicks: number }>()
    for (const e of ev) {
      if (!e.scooter_id) continue
      if (!scooterMap.has(e.scooter_id)) {
        scooterMap.set(e.scooter_id, {
          name: (e.metadata?.scooterName as string) ?? '',
          views: 0, waClicks: 0, phoneClicks: 0,
        })
      }
      const entry = scooterMap.get(e.scooter_id)!
      if (e.event_type === 'scooter_view')   entry.views++
      if (e.event_type === 'whatsapp_click') entry.waClicks++
      if (e.event_type === 'phone_click')    entry.phoneClicks++
    }

    const scooterBreakdown: ScooterAnalyticsBreakdown[] = [...scooterMap.entries()].map(
      ([scooterId, v]) => ({ scooterId, ...v })
    )

    // Top scooter by view count
    let topScooterName: string | null = null
    let topCount = 0
    for (const { views, name } of scooterMap.values()) {
      if (views > topCount && name) { topCount = views; topScooterName = name }
    }

    // Repeat visitors: unique sessions with 2+ events
    const sessionCounts = new Map<string, number>()
    for (const e of ev) {
      if (!e.session_id) continue
      sessionCounts.set(e.session_id, (sessionCounts.get(e.session_id) ?? 0) + 1)
    }
    const repeatVisitors = [...sessionCounts.values()].filter(c => c >= 2).length

    return { scooterViews, shopViews, whatsappClicks, phoneClicks, topScooterName, repeatVisitors, periodDays: days, scooterBreakdown }
  } catch {
    return empty
  }
}
