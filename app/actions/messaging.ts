'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  readAt: string | null
  createdAt: string
}

export interface ConversationPreview {
  id: string
  scooterId: string
  scooterName: string
  scooterImage: string | null
  scooterPricePerDay: number
  shopName: string
  shopSlug: string | null
  clientId: string
  ownerId: string
  otherUserName: string    // owner profile name (rider inbox) or rider name (owner inbox)
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export interface ConversationDetail {
  id: string
  scooterId: string
  scooterName: string
  scooterImage: string | null
  scooterPricePerDay: number
  shopName: string
  shopSlug: string | null
  clientId: string
  ownerId: string
  createdAt: string
}

// ── getOrCreateConversation ───────────────────────────────────────────────────

export async function getOrCreateConversation(
  scooterId: string,
): Promise<{ conversationId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'sign_in_required' }

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: scooter } = await (admin as any)
    .from('scooters')
    .select('id, shops(owner_id)')
    .eq('id', scooterId)
    .single()

  if (!scooter) return { error: 'Scooter not found.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerId = (scooter as any).shops?.owner_id as string | undefined
  if (!ownerId) return { error: 'Shop owner not found.' }
  if (ownerId === user.id) return { error: 'own_listing' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('conversations')
    .upsert(
      { scooter_id: scooterId, client_id: user.id, owner_id: ownerId },
      { onConflict: 'scooter_id,client_id' },
    )
    .select('id')
    .single()

  if (error || !data) {
    console.error('[getOrCreateConversation]', error?.message)
    return { error: 'Could not start conversation. Please try again.' }
  }

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
    .select('id, client_id, owner_id')
    .eq('id', conversationId)
    .single()

  if (!convo) return { error: 'Conversation not found.' }
  if (convo.client_id !== user.id && convo.owner_id !== user.id) {
    return { error: 'Unauthorized.' }
  }

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

  return {
    message: {
      id: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
      content: data.content,
      readAt: data.read_at,
      createdAt: data.created_at,
    },
  }
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
      id, scooter_id, client_id, owner_id, created_at,
      scooters ( name, cover_image, price_per_day, shops ( name, slug ) ),
      messages ( id, content, created_at, read_at, sender_id )
    `)
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  if (!rawConvos) return []

  return (rawConvos as any[]).map(c => buildPreview(user.id, c)) // eslint-disable-line @typescript-eslint/no-explicit-any
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
      id, scooter_id, client_id, owner_id, created_at,
      scooters ( name, cover_image, price_per_day, shops ( name, slug ) ),
      messages ( id, content, created_at, read_at, sender_id )
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (!rawConvos) return []

  // Resolve rider display names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientIds: string[] = [...new Set((rawConvos as any[]).map(c => c.client_id as string))]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (admin as any)
    .from('profiles')
    .select('id, name')
    .in('id', clientIds)

  const nameMap: Record<string, string> = {}
  for (const p of (profiles ?? []) as { id: string; name: string }[]) nameMap[p.id] = p.name

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rawConvos as any[]).map(c => buildPreview(user.id, c, nameMap))
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
      id, scooter_id, client_id, owner_id, created_at,
      scooters ( name, cover_image, price_per_day, shops ( name, slug ) )
    `)
    .eq('id', conversationId)
    .single()

  if (!convo) return null
  if (convo.client_id !== user.id && convo.owner_id !== user.id) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawMsgs } = await (admin as any)
    .from('messages')
    .select('id, conversation_id, sender_id, content, read_at, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = convo.scooters as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shop = s?.shops as any

  return {
    conversation: {
      id: convo.id,
      scooterId: convo.scooter_id,
      scooterName: s?.name ?? 'Scooter',
      scooterImage: s?.cover_image ?? null,
      scooterPricePerDay: s?.price_per_day ?? 0,
      shopName: shop?.name ?? 'Rental shop',
      shopSlug: shop?.slug ?? null,
      clientId: convo.client_id,
      ownerId: convo.owner_id,
      createdAt: convo.created_at,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: (rawMsgs ?? []).map((m: any) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      content: m.content,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('messages')
    .update({ read_at: now })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
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
    .neq('sender_id', user.id)
    .is('read_at', null)

  return count ?? 0
}

// ── Internal ──────────────────────────────────────────────────────────────────

function buildPreview(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  c: any,
  nameMap?: Record<string, string>,
): ConversationPreview {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const msgs: any[] = c.messages ?? []
  const sorted = [...msgs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const last = sorted[0]
  const unread = msgs.filter(m => m.sender_id !== userId && !m.read_at).length

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = c.scooters as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shop = s?.shops as any

  const isClient = c.client_id === userId
  const otherUserId = isClient ? c.owner_id : c.client_id

  return {
    id: c.id,
    scooterId: c.scooter_id,
    scooterName: s?.name ?? 'Scooter',
    scooterImage: s?.cover_image ?? null,
    scooterPricePerDay: s?.price_per_day ?? 0,
    shopName: shop?.name ?? 'Rental shop',
    shopSlug: shop?.slug ?? null,
    clientId: c.client_id,
    ownerId: c.owner_id,
    otherUserName: nameMap?.[otherUserId] ?? 'User',
    lastMessage: last?.content ?? null,
    lastMessageAt: last?.created_at ?? null,
    unreadCount: unread,
  }
}
