'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface ShopAnalytics {
  scooterViews:   number
  shopViews:      number
  whatsappClicks: number
  phoneClicks:    number
  topScooterName: string | null
  repeatVisitors: number
  periodDays:     number
}

export async function getShopAnalytics(shopId: string, days = 30): Promise<ShopAnalytics> {
  const empty: ShopAnalytics = {
    scooterViews: 0, shopViews: 0, whatsappClicks: 0,
    phoneClicks: 0, topScooterName: null, repeatVisitors: 0, periodDays: days,
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

    // Top scooter: most scooter_view events
    const viewCounts = new Map<string, { count: number; name: string }>()
    for (const e of ev.filter(x => x.event_type === 'scooter_view' && x.scooter_id)) {
      const k    = e.scooter_id!
      const name = (e.metadata?.scooterName as string) ?? ''
      if (!viewCounts.has(k)) viewCounts.set(k, { count: 0, name })
      viewCounts.get(k)!.count++
    }
    let topScooterName: string | null = null
    let topCount = 0
    viewCounts.forEach(({ count, name }) => {
      if (count > topCount && name) { topCount = count; topScooterName = name }
    })

    // Repeat visitors: unique sessions with 2+ events
    const sessionCounts = new Map<string, number>()
    for (const e of ev) {
      if (!e.session_id) continue
      sessionCounts.set(e.session_id, (sessionCounts.get(e.session_id) ?? 0) + 1)
    }
    const repeatVisitors = [...sessionCounts.values()].filter(c => c >= 2).length

    return { scooterViews, shopViews, whatsappClicks, phoneClicks, topScooterName, repeatVisitors, periodDays: days }
  } catch {
    return empty
  }
}
