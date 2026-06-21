'use server'

import { createAdminClient, isAdminUser } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type FeedIcon =
  | 'whatsapp'
  | 'eye'
  | 'repeat'
  | 'star'
  | 'shop'
  | 'phone'

export interface ActivityFeedItem {
  id:        string
  icon:      FeedIcon
  color:     string   // Tailwind text color class
  bg:        string   // Tailwind bg color class
  message:   string
  timeAgo:   string
  priority:  number   // lower = more important
}

type EventRow = {
  id: string
  event_type: string
  created_at: string
  scooter_id: string | null
  session_id: string | null
  metadata: Record<string, unknown>
}

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 2)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export async function getActivityFeed(shopId: string): Promise<ActivityFeedItem[]> {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return []

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shopRow } = await (admin as any)
    .from('shops')
    .select('owner_id')
    .eq('id', shopId)
    .single()

  if (!shopRow || (shopRow.owner_id !== user.id && !(await isAdminUser(admin, user.id)))) {
    return []
  }

  const since = new Date(Date.now() - 7 * 86_400_000).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('events')
    .select('id, event_type, created_at, scooter_id, session_id, metadata')
    .eq('shop_id', shopId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(200)

  const rows: EventRow[] = data ?? []
  if (rows.length === 0) return []

  const items: ActivityFeedItem[] = []

  // ── 1. WhatsApp leads (grouped by scooter, most recent first) ─────────────
  const waByScooter: Record<string, { count: number; name: string; latest: string }> = {}
  for (const r of rows) {
    if (r.event_type !== 'whatsapp_click') continue
    const name = (r.metadata?.scooterName as string) ?? null
    const key  = r.scooter_id ?? '__shop'
    if (!waByScooter[key]) waByScooter[key] = { count: 0, name: name ?? 'your shop', latest: r.created_at }
    waByScooter[key].count++
  }
  for (const [, v] of Object.entries(waByScooter).slice(0, 3)) {
    items.push({
      id:       `wa-${v.name}`,
      icon:     'whatsapp',
      color:    'text-[#16a34a]',
      bg:       'bg-[#f0fdf4]',
      message:  v.count === 1
        ? `Someone contacted you via WhatsApp about ${v.name}`
        : `${v.count} WhatsApp leads for ${v.name}`,
      timeAgo:  relativeTime(v.latest),
      priority: 1,
    })
  }

  // ── 2. Phone contacts ─────────────────────────────────────────────────────
  const phoneCalls = rows.filter(r => r.event_type === 'phone_click')
  if (phoneCalls.length > 0) {
    items.push({
      id:       'phone',
      icon:     'phone',
      color:    'text-[#2563eb]',
      bg:       'bg-[#eff6ff]',
      message:  phoneCalls.length === 1
        ? 'Someone tapped your phone number'
        : `${phoneCalls.length} phone taps in the last 7 days`,
      timeAgo:  relativeTime(phoneCalls[0].created_at),
      priority: 2,
    })
  }

  // ── 3. Views today ────────────────────────────────────────────────────────
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const viewsToday = rows.filter(
    r => r.event_type === 'scooter_view' && new Date(r.created_at) >= todayStart
  ).length
  if (viewsToday > 0) {
    const newest = rows.find(r => r.event_type === 'scooter_view')
    items.push({
      id:       'views-today',
      icon:     'eye',
      color:    'text-[#FF6B35]',
      bg:       'bg-[#fff4f0]',
      message:  viewsToday === 1
        ? 'Your listing was viewed once today'
        : `${viewsToday} scooter views today`,
      timeAgo:  newest ? relativeTime(newest.created_at) : 'today',
      priority: 3,
    })
  }

  // ── 4. Returning visitors (sessions with 2+ events this week) ─────────────
  const sessionCounts: Record<string, number> = {}
  for (const r of rows) {
    if (!r.session_id) continue
    sessionCounts[r.session_id] = (sessionCounts[r.session_id] ?? 0) + 1
  }
  const repeatCount = Object.values(sessionCounts).filter(n => n >= 2).length
  if (repeatCount > 0) {
    items.push({
      id:       'repeat-visitors',
      icon:     'repeat',
      color:    'text-[#7c3aed]',
      bg:       'bg-[#f5f3ff]',
      message:  repeatCount === 1
        ? '1 visitor came back to look at your scooters again'
        : `${repeatCount} visitors returned to your listings this week`,
      timeAgo:  'this week',
      priority: 4,
    })
  }

  // ── 5. Top scooter by views this week ─────────────────────────────────────
  const viewsByScooter: Record<string, { count: number; name: string }> = {}
  for (const r of rows) {
    if (r.event_type !== 'scooter_view' || !r.scooter_id) continue
    const name = (r.metadata?.scooterName as string) ?? 'a scooter'
    if (!viewsByScooter[r.scooter_id]) viewsByScooter[r.scooter_id] = { count: 0, name }
    viewsByScooter[r.scooter_id].count++
  }
  const topScooter = Object.values(viewsByScooter).sort((a, b) => b.count - a.count)[0]
  if (topScooter && topScooter.count >= 2) {
    items.push({
      id:       'top-scooter',
      icon:     'star',
      color:    'text-[#d97706]',
      bg:       'bg-[#fffbeb]',
      message:  `${topScooter.name} is your most-viewed scooter — ${topScooter.count} views this week`,
      timeAgo:  'this week',
      priority: 5,
    })
  }

  // ── 6. Shop page visits ───────────────────────────────────────────────────
  const shopVisits = rows.filter(r => r.event_type === 'shop_view')
  if (shopVisits.length > 0) {
    items.push({
      id:       'shop-views',
      icon:     'shop',
      color:    'text-[#0891b2]',
      bg:       'bg-[#ecfeff]',
      message:  shopVisits.length === 1
        ? 'Someone visited your shop page'
        : `${shopVisits.length} shop page visits this week`,
      timeAgo:  relativeTime(shopVisits[0].created_at),
      priority: 6,
    })
  }

  return items.sort((a, b) => a.priority - b.priority).slice(0, 7)
}
