// Performance summary infrastructure — generates weekly digest data.
// No UI yet. Designed to feed email digests and in-app summaries later.

import { createAdminClient } from '@/lib/supabase/admin'

export type TrendSignal = 'up' | 'down' | 'flat'

export interface PerformanceSummary {
  shopId:         string
  shopName:       string
  periodDays:     number
  periodLabel:    string   // e.g. "last 7 days"

  // Core metrics — current period
  scooterViews:   number
  shopViews:      number
  whatsappClicks: number
  phoneClicks:    number
  repeatVisitors: number

  // vs. previous period
  viewsDelta:     number   // signed integer
  leadsDelta:     number   // WA + phone combined delta
  trend:          TrendSignal
  trendMessage:   string   // human-readable, e.g. "+12 more views than last week"

  topScooterName: string | null
  generatedAt:    string   // ISO timestamp
}

type EventRow = { event_type: string; created_at: string; scooter_id: string | null; metadata: Record<string, unknown> }

async function fetchEventCounts(
  shopId: string,
  from: Date,
  to: Date,
): Promise<EventRow[]> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('events')
    .select('event_type, created_at, scooter_id, metadata')
    .eq('shop_id', shopId)
    .gte('created_at', from.toISOString())
    .lt('created_at', to.toISOString())

  return (data ?? []) as EventRow[]
}

function summarise(rows: EventRow[]) {
  const scooterViews   = rows.filter(r => r.event_type === 'scooter_view').length
  const shopViews      = rows.filter(r => r.event_type === 'shop_view').length
  const whatsappClicks = rows.filter(r => r.event_type === 'whatsapp_click').length
  const phoneClicks    = rows.filter(r => r.event_type === 'phone_click').length

  // Top scooter by view count
  const viewsByScooter: Record<string, { count: number; name: string }> = {}
  for (const r of rows) {
    if (r.event_type !== 'scooter_view' || !r.scooter_id) continue
    const name = (r.metadata?.scooterName as string) ?? r.scooter_id
    if (!viewsByScooter[r.scooter_id]) viewsByScooter[r.scooter_id] = { count: 0, name }
    viewsByScooter[r.scooter_id].count++
  }
  const topScooterName = Object.values(viewsByScooter).sort((a, b) => b.count - a.count)[0]?.name ?? null

  return { scooterViews, shopViews, whatsappClicks, phoneClicks, topScooterName }
}

function trendSignal(delta: number): TrendSignal {
  if (delta > 0) return 'up'
  if (delta < 0) return 'down'
  return 'flat'
}

function trendMsg(viewsDelta: number, leadsDelta: number): string {
  if (viewsDelta === 0 && leadsDelta === 0) return 'Same pace as the previous period'
  const parts: string[] = []
  if (viewsDelta !== 0) parts.push(`${viewsDelta > 0 ? '+' : ''}${viewsDelta} views`)
  if (leadsDelta !== 0) parts.push(`${leadsDelta > 0 ? '+' : ''}${leadsDelta} leads`)
  return parts.join(' · ') + ` vs previous ${7} days`
}

export async function generatePerformanceSummary(
  shopId:   string,
  shopName: string,
  periodDays = 7,
): Promise<PerformanceSummary> {
  const now  = new Date()
  const from = new Date(now.getTime() - periodDays * 86_400_000)
  const prev = new Date(from.getTime() - periodDays * 86_400_000)

  const [current, previous] = await Promise.all([
    fetchEventCounts(shopId, from, now),
    fetchEventCounts(shopId, prev, from),
  ])

  const cur = summarise(current)
  const prv = summarise(previous)

  const viewsDelta = cur.scooterViews - prv.scooterViews
  const leadsDelta = (cur.whatsappClicks + cur.phoneClicks) - (prv.whatsappClicks + prv.phoneClicks)

  // Repeat visitors = sessions with 2+ events in current window
  const sessionCounts: Record<string, number> = {}
  for (const r of current) {
    const sid = (r.metadata?.session_id as string) ?? '__unknown'
    sessionCounts[sid] = (sessionCounts[sid] ?? 0) + 1
  }
  const repeatVisitors = Object.values(sessionCounts).filter(n => n >= 2).length

  return {
    shopId,
    shopName,
    periodDays,
    periodLabel:    `last ${periodDays} days`,
    scooterViews:   cur.scooterViews,
    shopViews:      cur.shopViews,
    whatsappClicks: cur.whatsappClicks,
    phoneClicks:    cur.phoneClicks,
    repeatVisitors,
    viewsDelta,
    leadsDelta,
    trend:          trendSignal(viewsDelta + leadsDelta),
    trendMessage:   trendMsg(viewsDelta, leadsDelta),
    topScooterName: cur.topScooterName,
    generatedAt:    now.toISOString(),
  }
}
