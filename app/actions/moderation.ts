'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function savePushToken(
  token: string,
  platform: 'ios' | 'android',
): Promise<{ ok: true } | { error: string }> {
  if (!token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken[')) {
    return { error: 'Invalid push token.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('push_tokens')
    .upsert(
      { user_id: user.id, token, platform, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,token' },
    )

  return { ok: true }
}

export async function blockUser(
  conversationId: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: convo } = await (admin as any)
    .from('conversations')
    .select('client_id, owner_id')
    .eq('id', conversationId)
    .single()

  if (!convo) return { error: 'Conversation not found.' }
  if (convo.client_id !== user.id && convo.owner_id !== user.id) {
    return { error: 'Unauthorized.' }
  }

  const blockedId = convo.client_id === user.id ? convo.owner_id : convo.client_id

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('blocked_users')
    .insert({ blocker_id: user.id, blocked_id: blockedId })

  if (error && error.code !== '23505') {
    console.error('[blockUser]', error.message)
    return { error: 'Failed to block user.' }
  }

  revalidatePath(`/messages/${conversationId}`)
  return { ok: true }
}

export async function unblockUser(
  conversationId: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: convo } = await (admin as any)
    .from('conversations')
    .select('client_id, owner_id')
    .eq('id', conversationId)
    .single()

  if (!convo) return { error: 'Conversation not found.' }
  if (convo.client_id !== user.id && convo.owner_id !== user.id) {
    return { error: 'Unauthorized.' }
  }

  const blockedId = convo.client_id === user.id ? convo.owner_id : convo.client_id

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('blocked_users')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', blockedId)

  revalidatePath(`/messages/${conversationId}`)
  return { ok: true }
}

export async function reportConversation(
  conversationId: string,
  reason: 'spam' | 'scam' | 'harassment' | 'other',
  details?: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: convo } = await (admin as any)
    .from('conversations')
    .select('client_id, owner_id')
    .eq('id', conversationId)
    .single()

  if (!convo) return { error: 'Conversation not found.' }
  if (convo.client_id !== user.id && convo.owner_id !== user.id) {
    return { error: 'Unauthorized.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('message_reports')
    .insert({
      reporter_id: user.id,
      conversation_id: conversationId,
      reason,
      details: details ?? null,
    })

  if (error) {
    console.error('[reportConversation]', error.message)
    return { error: 'Failed to submit report.' }
  }

  return { ok: true }
}
