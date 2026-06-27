'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ApnsClient, ApnsError, Notification, Host } from 'apns2'

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
  shopPhone: string | null
  shopGoogleMapsLink: string | null
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
  // Unclaimed shop (no owner account yet, Phase 1 admin-created shops) —
  // in-app chat has no one to deliver to. WhatsApp/phone remain available
  // on the listing page as the primary contact channel.
  if (!ownerId) return { error: 'This shop is not on chat yet — please use WhatsApp or phone to contact them.' }
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

// ── APNS helpers ─────────────────────────────────────────────────────────────
// Transport: apns2 (HTTP/2 client built on undici). keepAlive is left off so
// each delivery opens one connection and closes it — matching the previous
// connect/send/close-per-call lifecycle, just without a hand-rolled
// node:http2 client or manual JWT signing (apns2 handles both internally
// from the same APNS_* env vars).

type ApnsPushOptions = {
  alert?: { title: string; body: string }
  badge?: number
  sound?: string
  data?: Record<string, string>
}

async function deliverApns(
  client: ApnsClient,
  token: string,
  options: ApnsPushOptions,
): Promise<void> {
  const notification = new Notification(token, options)
  const tokenPrefix = token.slice(0, 8)
  try {
    await client.send(notification)
    console.log(`[APNS] delivered token:${tokenPrefix}…`)
  } catch (err) {
    if (err instanceof ApnsError) {
      console.error(`[APNS] rejected token:${tokenPrefix}… status:${err.statusCode} reason:${err.reason}`)
    } else {
      const message = err instanceof Error ? err.message : String(err)
      const kind = /timeout/i.test(message) ? 'timeout' : 'transport error'
      console.error(`[APNS] ${kind} token:${tokenPrefix}… ${message}`)
    }
  }
}

// Resolves everything needed to deliver an APNs push to a user's iOS
// device(s): registered tokens + a configured client. Returns null if
// there's nothing to deliver to (no token, or APNs not configured) — every
// caller must treat null as a safe no-op, never an error. Callers own the
// returned client and must close() it once delivery finishes.
async function resolveApnsDelivery(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
): Promise<{ tokens: string[]; client: ApnsClient } | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (admin as any)
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId)
    .eq('platform', 'ios')

  if (!rows?.length) return null

  const teamId   = process.env.APNS_TEAM_ID
  const keyId    = process.env.APNS_KEY_ID
  const rawKey   = process.env.APNS_PRIVATE_KEY
  const bundleId = process.env.APNS_BUNDLE_ID ?? 'com.kohride.app'
  const prod     = process.env.APNS_PRODUCTION !== 'false'

  if (!teamId || !keyId || !rawKey) return null

  const privateKey = rawKey.replace(/\\n/g, '\n')
  const host = prod ? Host.production : Host.development

  const client = new ApnsClient({
    team: teamId,
    keyId,
    signingKey: privateKey,
    defaultTopic: bundleId,
    host,
    requestTimeout: 5000,
    keepAlive: false,
  })

  return {
    tokens: (rows as { token: string }[]).map(r => r.token),
    client,
  }
}

// Total unread message count for a user, across every conversation they're
// part of (client or owner side) — same definition used by the in-app
// red-dot badge (useUnreadCount) and getUnreadCount below. Single source of
// truth so the iOS icon badge can never drift from what the app itself shows.
async function getUnreadMessageCount(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: convos } = await (admin as any)
    .from('conversations')
    .select('id')
    .or(`client_id.eq.${userId},owner_id.eq.${userId}`)

  if (!convos?.length) return 0

  const ids = convos.map((c: { id: string }) => c.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (admin as any)
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', ids)
    .eq('type', 'message')
    .or(`sender_id.neq.${userId},sender_id.is.null`)
    .is('read_at', null)

  return count ?? 0
}

async function sendMessagePush(
  userId: string,
  title: string,
  body: string,
  data: Record<string, string>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
): Promise<void> {
  const delivery = await resolveApnsDelivery(userId, admin)
  if (!delivery) return

  // Real unread count, not a hardcoded placeholder — keeps the iOS icon
  // badge in sync with the user's actual unread messages on every new push.
  const badge = await getUnreadMessageCount(userId, admin)

  try {
    await Promise.allSettled(
      delivery.tokens.map(token =>
        deliverApns(delivery.client, token, { alert: { title, body }, sound: 'default', badge, data }),
      ),
    )
  } finally {
    await delivery.client.close().catch(() => { /* ignore */ })
  }
}

// Silent badge-only update — no alert, no sound, just the icon number.
// Fired after a user reads messages so the badge clears (or drops to the
// remaining count) without waiting for the next inbound message to refresh
// it. Apple's APNs accepts an `aps` payload with only `badge` set as a
// standard alert-type push; the device updates the icon with no visible
// banner since there is no `alert`/`sound` key present.
async function sendBadgeRefreshPush(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
): Promise<void> {
  try {
    const delivery = await resolveApnsDelivery(userId, admin)
    if (!delivery) return

    const badge = await getUnreadMessageCount(userId, admin)

    try {
      await Promise.allSettled(
        delivery.tokens.map(token => deliverApns(delivery.client, token, { badge })),
      )
    } finally {
      await delivery.client.close().catch(() => { /* ignore */ })
    }
  } catch {
    // Silent — a badge-refresh failure must never surface to the reader.
  }
}

// ── getAllConversations ───────────────────────────────────────────────────────
// Universal inbox: all conversations where the user is client OR owner.
// Uses the get_inbox_conversations RPC (lateral joins) — no unbounded message load.

export async function getAllConversations(): Promise<ConversationPreview[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows, error } = await (admin as any)
    .rpc('get_inbox_conversations', { p_user_id: user.id })

  if (error) console.error('[getAllConversations]', error.message)
  if (!rows?.length) return []

  // Collect other-party user IDs (for name/avatar lookup)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const otherIds = [
    ...new Set(
      (rows as any[])
        .map((c: any) => c.client_id === user.id ? c.owner_id : c.client_id)  // eslint-disable-line @typescript-eslint/no-explicit-any
        .filter((id: string | null): id is string => id !== null),
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows as any[]).map((c: any) => {  // eslint-disable-line @typescript-eslint/no-explicit-any
    const isClient = c.client_id === user.id
    const otherUserId = isClient ? c.owner_id : c.client_id
    const otherProfile = otherUserId ? profileMap[otherUserId] : undefined
    const otherUserName = isClient
      ? (c.shop_name ?? otherProfile?.name ?? 'Shop')
      : (otherProfile?.name ?? 'Deleted User')
    const otherUserAvatarUrl = isClient
      ? (c.shop_logo ?? null)
      : (otherProfile?.avatar_url ?? null)

    return {
      id:                 c.id,
      scooterId:          c.scooter_id ?? null,
      scooterName:        c.scooter_name ?? null,
      scooterImage:       c.scooter_image ?? null,
      scooterPricePerDay: c.scooter_price ?? 0,
      shopId:             c.shop_id ?? null,
      shopName:           c.shop_name ?? 'Shop',
      shopSlug:           c.shop_slug ?? null,
      clientId:           c.client_id,
      ownerId:            c.owner_id,
      otherUserName,
      otherUserAvatarUrl,
      lastMessage:        c.last_message ?? null,
      lastMessageAt:      c.last_message_at ?? null,
      unreadCount:        Number(c.unread_count ?? 0),
    } satisfies ConversationPreview
  })
}

// ── getConversations ──────────────────────────────────────────────────────────
// Rider inbox: conversations where current user is the client.
// Delegates to getAllConversations (shared RPC) — the RPC already filters correctly.

export async function getConversations(): Promise<ConversationPreview[]> {
  return getAllConversations()
}

// ── getOwnerConversations ─────────────────────────────────────────────────────
// Owner inbox: conversations where current user is the shop owner.
// Delegates to getAllConversations (shared RPC).

export async function getOwnerConversations(): Promise<ConversationPreview[]> {
  return getAllConversations()
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
      shops ( name, slug, logo_url, phone, google_maps_link )
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
      shopPhone: shopRow?.phone ?? null,
      shopGoogleMapsLink: shopRow?.google_maps_link ?? null,
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

  // iOS icon badge refresh — fire-and-forget, never lets a push failure
  // affect the read receipt above (which has already completed by this point).
  try {
    await sendBadgeRefreshPush(user.id, admin)
  } catch {
    // Silent — reading messages must always succeed regardless of push state.
  }
}

// ── getUnreadCount ────────────────────────────────────────────────────────────

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const admin = createAdminClient()
  return getUnreadMessageCount(user.id, admin)
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
