'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Message {
  id: string
  conversationId: string
  senderId: string | null
  content: string | null
  type: 'message' | 'context_switch'
  metadata: { scooterId: string; scooterName: string } | null
  readAt: string | null
  createdAt: string
}

export interface ConversationPreview {
  id: string
  scooterId: string | null
  scooterName: string | null
  scooterImage: string | null
  scooterPricePerDay: number
  shopId: string | null
  shopName: string
  shopSlug: string | null
  clientId: string | null
  ownerId: string | null
  otherUserName: string
  otherUserAvatarUrl: string | null
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export interface ConversationDetail {
  id: string
  scooterId: string | null
  scooterName: string | null
  scooterImage: string | null
  scooterPricePerDay: number
  shopId: string | null
  shopName: string
  shopSlug: string | null
  clientId: string | null
  ownerId: string | null
  createdAt: string
  blockedByMe: boolean
  blockedByThem: boolean
  otherUserName: string
  otherUserAvatarUrl: string | null
}

// ── getOrCreateConversation ───────────────────────────────────────────────────

export async function getOrCreateConversation(
  scooterId: string,
): Promise<{ conversationId: string; contextScooterId?: string; contextScooterName?: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'sign_in_required' }

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: scooter } = await (admin as any)
    .from('scooters')
    .select('id, name, shop_id, shops(owner_id)')
    .eq('id', scooterId)
    .single()

  if (!scooter) return { error: 'Scooter not found.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerId = (scooter as any).shops?.owner_id as string | undefined
  if (!ownerId) return { error: 'Shop owner not found.' }
  if (ownerId === user.id) return { error: 'own_listing' }

  // One conversation per rider↔shop pair — find by (client_id, owner_id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from('conversations')
    .select('id')
    .eq('client_id', user.id)
    .eq('owner_id', ownerId)
    .maybeSingle()

  if (existing) {
    return {
      conversationId: existing.id as string,
      contextScooterId: scooterId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contextScooterName: (scooter as any).name as string,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('conversations')
    .insert({ scooter_id: scooterId, shop_id: scooter.shop_id, client_id: user.id, owner_id: ownerId })
    .select('id')
    .single()

  if (error) {
    // 23505 = unique_violation — race condition, retry with (client_id, owner_id)
    if (error.code === '23505') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: race } = await (admin as any)
        .from('conversations')
        .select('id')
        .eq('client_id', user.id)
        .eq('owner_id', ownerId)
        .single()
      if (race) return { conversationId: race.id as string }
    }
    console.error('[getOrCreateConversation]', error.message)
    return { error: 'Could not start conversation. Please try again.' }
  }

  if (!data) return { error: 'Could not start conversation. Please try again.' }

  return { conversationId: data.id as string }
}

// ── sendMessage ───────────────────────────────────────────────────────────────

export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<{ message: Message } | { error: string }> {
  const trimmed = content.trim()
  if (!trimmed) return { error: 'Message cannot be empty.' }
  if (trimmed.length > 1000) return { error: 'Message too long.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: convo } = await (admin as any)
    .from('conversations')
    .select('id, client_id, owner_id, scooters(name), shops(name)')
    .eq('id', conversationId)
    .single()

  if (!convo) return { error: 'Conversation not found.' }
  if (convo.client_id !== user.id && convo.owner_id !== user.id) {
    return { error: 'Unauthorized.' }
  }

  const otherUserId = convo.client_id === user.id ? convo.owner_id : convo.client_id

  // Check if either party has blocked the other
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: block } = await (admin as any)
    .from('blocked_users')
    .select('id')
    .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${user.id})`)
    .limit(1)
    .maybeSingle()

  if (block) return { error: 'You cannot send messages in this conversation.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: user.id, content: trimmed })
    .select('id, conversation_id, sender_id, content, read_at, created_at')
    .single()

  if (error || !data) {
    console.error('[sendMessage]', error?.message)
    return { error: 'Failed to send message.' }
  }

  revalidatePath('/messages')
  revalidatePath('/partner/messages')

  // Push notification — fire and forget, never blocks message delivery
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scooterName = (convo.scooters as any)?.name ?? null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shopName = (convo.shops as any)?.name ?? 'Shop'
    const isOwnerSending = convo.owner_id === user.id
    const body = isOwnerSending
      ? `${shopName} replied`
      : scooterName
        ? `New message about ${scooterName}`
        : `New message from a rider`
    await sendMessagePush(otherUserId, 'Koh Ride', body, { conversationId }, admin)
  } catch {
    // Never surface push errors to the caller
  }

  return {
    message: {
      id: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
      content: data.content,
      type: 'message' as const,
      metadata: null,
      readAt: data.read_at,
      createdAt: data.created_at,
    },
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendMessagePush(
  userId: string,
  title: string,
  body: string,
  data: Record<string, string>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (admin as any)
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId)

  if (!rows?.length) return

  const valid = (rows as { token: string }[])
    .map(r => r.token)
    .filter(t => t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['))

  if (!valid.length) return

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (process.env.EXPO_ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`
  }

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers,
    body: JSON.stringify(valid.map(to => ({ to, sound: 'default', title, body, data }))),
  })
}

// ── getAllConversations ───────────────────────────────────────────────────────
// Universal inbox: all conversations where the user is client OR owner.
// Used by /messages — works for both riders and shop owners.

export async function getAllConversations(): Promise<ConversationPreview[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawConvos, error } = await (admin as any)
    .from('conversations')
    .select(`
      id, scooter_id, shop_id, client_id, owner_id, created_at,
      scooters ( name, cover_image, price_per_day ),
      shops ( name, slug, logo_url ),
      messages ( id, content, created_at, read_at, sender_id, type )
    `)
    .or(`client_id.eq.${user.id},owner_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) console.error('[getAllConversations]', error.message)
  if (!rawConvos) return []

  // Collect unique other-user IDs — filter nulls (deleted users) before the DB lookup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const otherIds = [
    ...new Set(
      (rawConvos as any[])
        .map(c => c.client_id === user.id ? c.owner_id : c.client_id)
        .filter((id): id is string => id !== null),
    ),
  ]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (admin as any)
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', otherIds)

  const profileMap: Record<string, ProfileMeta> = {}
  for (const p of (profiles ?? []) as (ProfileMeta & { id: string })[]) {
    profileMap[p.id] = { name: p.name, avatar_url: p.avatar_url }
  }

  return (rawConvos as any[]).map(c => buildPreview(user.id, c, profileMap)) // eslint-disable-line @typescript-eslint/no-explicit-any
}

// ── getConversations ──────────────────────────────────────────────────────────
// Rider inbox: conversations where current user is the client.

export async function getConversations(): Promise<ConversationPreview[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawConvos } = await (admin as any)
    .from('conversations')
    .select(`
      id, scooter_id, shop_id, client_id, owner_id, created_at,
      scooters ( name, cover_image, price_per_day ),
      shops ( name, slug, logo_url ),
      messages ( id, content, created_at, read_at, sender_id, type )
    `)
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  if (!rawConvos) return []

  // Fetch owner profiles — filter nulls (deleted owners) before the DB lookup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerIds = [
    ...new Set(
      (rawConvos as any[])
        .map(c => c.owner_id as string | null)
        .filter((id): id is string => id !== null),
    ),
  ]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (admin as any)
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', ownerIds)

  const profileMap: Record<string, ProfileMeta> = {}
  for (const p of (profiles ?? []) as (ProfileMeta & { id: string })[]) {
    profileMap[p.id] = { name: p.name, avatar_url: p.avatar_url }
  }

  return (rawConvos as any[]).map(c => buildPreview(user.id, c, profileMap)) // eslint-disable-line @typescript-eslint/no-explicit-any
}

// ── getOwnerConversations ─────────────────────────────────────────────────────
// Owner inbox: conversations where current user is the shop owner.

export async function getOwnerConversations(): Promise<ConversationPreview[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawConvos } = await (admin as any)
    .from('conversations')
    .select(`
      id, scooter_id, shop_id, client_id, owner_id, created_at,
      scooters ( name, cover_image, price_per_day ),
      shops ( name, slug, logo_url ),
      messages ( id, content, created_at, read_at, sender_id, type )
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (!rawConvos) return []

  // Resolve rider display names — filter nulls (deleted riders) before the DB lookup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientIds: string[] = [
    ...new Set(
      (rawConvos as any[])
        .map(c => c.client_id as string | null)
        .filter((id): id is string => id !== null),
    ),
  ]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (admin as any)
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', clientIds)

  const profileMap: Record<string, ProfileMeta> = {}
  for (const p of (profiles ?? []) as (ProfileMeta & { id: string })[]) {
    profileMap[p.id] = { name: p.name, avatar_url: p.avatar_url }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rawConvos as any[]).map(c => buildPreview(user.id, c, profileMap))
}

// ── getConversationWithMessages ───────────────────────────────────────────────

export async function getConversationWithMessages(
  conversationId: string,
): Promise<{ conversation: ConversationDetail; messages: Message[] } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: convo } = await (admin as any)
    .from('conversations')
    .select(`
      id, scooter_id, shop_id, client_id, owner_id, created_at,
      scooters ( name, cover_image, price_per_day ),
      shops ( name, slug, logo_url )
    `)
    .eq('id', conversationId)
    .single()

  if (!convo) return null
  if (convo.client_id !== user.id && convo.owner_id !== user.id) return null

  const otherUserId = convo.client_id === user.id ? convo.owner_id : convo.client_id

  // Fetch block status, messages, and other user's profile in parallel
  const [
    { data: blockedByMeRow },
    { data: blockedByThemRow },
    { data: rawMsgs },
    { data: otherProfile },
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', otherUserId)
      .maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', otherUserId)
      .eq('blocked_id', user.id)
      .maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('messages')
      .select('id, conversation_id, sender_id, content, type, metadata, read_at, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', otherUserId)
      .maybeSingle(),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = convo.scooters as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shopRow = convo.shops as any

  return {
    conversation: {
      id: convo.id,
      scooterId: convo.scooter_id ?? null,
      scooterName: s?.name ?? null,
      scooterImage: s?.cover_image ?? null,
      scooterPricePerDay: s?.price_per_day ?? 0,
      shopId: convo.shop_id ?? null,
      shopName: shopRow?.name ?? 'Shop',
      shopSlug: shopRow?.slug ?? null,
      clientId: convo.client_id,
      ownerId: convo.owner_id,
      createdAt: convo.created_at,
      blockedByMe: !!blockedByMeRow,
      blockedByThem: !!blockedByThemRow,
      // Rider-facing: represent the SHOP, not the individual owner.
      // Partner-facing: represent the RIDER (profile name + avatar).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      otherUserName: convo.client_id === user.id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (shopRow?.name ?? (otherProfile as any)?.name ?? 'Shop')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        : ((otherProfile as any)?.name ?? 'Deleted User'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      otherUserAvatarUrl: convo.client_id === user.id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (shopRow?.logo_url ?? null)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        : ((otherProfile as any)?.avatar_url ?? null),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: (rawMsgs ?? []).map((m: any) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      content: m.content,
      type: (m.type ?? 'message') as 'message' | 'context_switch',
      metadata: m.metadata
        ? { scooterId: m.metadata.scooter_id, scooterName: m.metadata.scooter_name }
        : null,
      readAt: m.read_at,
      createdAt: m.created_at,
    })),
  }
}

// ── markMessagesRead ──────────────────────────────────────────────────────────

export async function markMessagesRead(conversationId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const admin = createAdminClient()
  const now = new Date().toISOString()

  // .or() is required here because SQL != does not match NULL — after migration 030,
  // messages from deleted users have sender_id = NULL and must be explicitly included
  // so the unread badge clears correctly when the shop owner opens the thread.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('messages')
    .update({ read_at: now })
    .eq('conversation_id', conversationId)
    .or(`sender_id.neq.${user.id},sender_id.is.null`)
    .is('read_at', null)
}

// ── getUnreadCount ────────────────────────────────────────────────────────────

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: convos } = await (admin as any)
    .from('conversations')
    .select('id')
    .or(`client_id.eq.${user.id},owner_id.eq.${user.id}`)

  if (!convos?.length) return 0

  const ids = convos.map((c: { id: string }) => c.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (admin as any)
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', ids)
    .eq('type', 'message')
    .neq('sender_id', user.id)
    .is('read_at', null)

  return count ?? 0
}

// ── insertContextSwitch ───────────────────────────────────────────────────────
// Inserts a system event into the conversation timeline when a rider re-enters
// an existing thread from a different scooter.
// Idempotent: if the most recent context_switch already references the same
// scooter, this is a no-op.

export async function insertContextSwitch(
  conversationId: string,
  scooterId: string,
  scooterName: string,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const admin = createAdminClient()

  // Idempotency check — skip if last context_switch is already for this scooter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: last } = await (admin as any)
    .from('messages')
    .select('metadata')
    .eq('conversation_id', conversationId)
    .eq('type', 'context_switch')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((last as any)?.metadata?.scooter_id === scooterId) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: null,
      content: null,
      type: 'context_switch',
      metadata: { scooter_id: scooterId, scooter_name: scooterName },
      read_at: new Date().toISOString(),
    })
}

// ── Internal ──────────────────────────────────────────────────────────────────

type ProfileMeta = { name: string; avatar_url: string | null }

function buildPreview(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  c: any,
  profileMap?: Record<string, ProfileMeta>,
): ConversationPreview {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const msgs: any[] = c.messages ?? []
  const sorted = [...msgs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  // System events must not become the preview text or affect unread counts
  const last = sorted.find(m => (m.type ?? 'message') === 'message')
  const unread = msgs.filter(
    m => (m.type ?? 'message') === 'message' && m.sender_id !== userId && !m.read_at,
  ).length

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = c.scooters as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shopRow = c.shops as any

  const isClient = c.client_id === userId
  const otherUserId = isClient ? c.owner_id : c.client_id
  const otherProfile = profileMap?.[otherUserId]

  // Rider-facing: represent the SHOP, not the individual owner.
  // Partner-facing: represent the RIDER (their profile name + avatar).
  const otherUserName = isClient
    ? (shopRow?.name ?? otherProfile?.name ?? 'Shop')
    : (otherProfile?.name ?? 'Deleted User')
  const otherUserAvatarUrl = isClient
    ? (shopRow?.logo_url ?? null)
    : (otherProfile?.avatar_url ?? null)

  return {
    id: c.id,
    scooterId: c.scooter_id ?? null,
    scooterName: s?.name ?? null,
    scooterImage: s?.cover_image ?? null,
    scooterPricePerDay: s?.price_per_day ?? 0,
    shopId: c.shop_id ?? null,
    shopName: shopRow?.name ?? 'Shop',
    shopSlug: shopRow?.slug ?? null,
    clientId: c.client_id,
    ownerId: c.owner_id,
    otherUserName,
    otherUserAvatarUrl,
    lastMessage: last?.content ?? null,
    lastMessageAt: last?.created_at ?? null,
    unreadCount: unread,
  }
}
