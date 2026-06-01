import { createAdminClient } from '@/lib/supabase/admin'

export interface ShopChatStats {
  isFastResponder: boolean
  avgMinutes: number | null
}

// Computes average first-response time for a shop owner across their last 30 conversations.
// "Fast responder" = average < 15 minutes AND at least 3 data points.
export async function getShopChatStats(shopId: string): Promise<ShopChatStats> {
  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = admin as any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shopRow } = await a
    .from('shops')
    .select('owner_id')
    .eq('id', shopId)
    .single() as { data: { owner_id: string | null } | null }

  if (!shopRow?.owner_id) return { isFastResponder: false, avgMinutes: null }

  const ownerId = shopRow.owner_id

  // Last 30 conversations for this owner
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: conversations } = await a
    .from('conversations')
    .select('id')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(30) as { data: { id: string }[] | null }

  if (!conversations || conversations.length === 0) return { isFastResponder: false, avgMinutes: null }

  const conversationIds = conversations.map(c => c.id)

  // All messages in those conversations, sorted oldest-first per conversation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: messages } = await a
    .from('messages')
    .select('id, conversation_id, sender_id, created_at')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: true }) as { data: { id: string; conversation_id: string; sender_id: string; created_at: string }[] | null }

  if (!messages || messages.length === 0) return { isFastResponder: false, avgMinutes: null }

  // Group messages by conversation
  const byConv: Record<string, { senderId: string; createdAt: string }[]> = {}
  for (const m of messages) {
    if (!byConv[m.conversation_id]) byConv[m.conversation_id] = []
    byConv[m.conversation_id].push({ senderId: m.sender_id, createdAt: m.created_at })
  }

  // For each conversation: find time between first client message and first owner reply after it
  const responseTimes: number[] = []

  for (const msgs of Object.values(byConv)) {
    const firstClientMsg = msgs.find(m => m.senderId !== ownerId)
    if (!firstClientMsg) continue

    const firstOwnerReply = msgs.find(
      m => m.senderId === ownerId && m.createdAt > firstClientMsg.createdAt,
    )
    if (!firstOwnerReply) continue

    const diffMs =
      new Date(firstOwnerReply.createdAt).getTime() -
      new Date(firstClientMsg.createdAt).getTime()

    const diffMinutes = diffMs / 60_000
    // Ignore outliers > 24h (likely the shop wasn't online)
    if (diffMinutes > 0 && diffMinutes < 1440) {
      responseTimes.push(diffMinutes)
    }
  }

  if (responseTimes.length < 3) return { isFastResponder: false, avgMinutes: null }

  const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length

  return {
    isFastResponder: avg < 15,
    avgMinutes: Math.round(avg),
  }
}
