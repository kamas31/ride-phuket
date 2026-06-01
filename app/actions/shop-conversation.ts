'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Get or create a shop-level Koh Ride conversation (no scooter attached).
 * Uses a find-or-create pattern so the unique partial index on
 * (shop_id, client_id) WHERE scooter_id IS NULL is respected.
 */
export async function getOrCreateShopConversation(
  shopId: string,
): Promise<{ conversationId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'sign_in_required' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = createAdminClient() as any

  const { data: shopRow } = await a
    .from('shops')
    .select('owner_id')
    .eq('id', shopId)
    .single() as { data: { owner_id: string | null } | null }

  if (!shopRow?.owner_id) return { error: 'owner_not_found' }
  const ownerId = shopRow.owner_id
  if (ownerId === user.id) return { error: 'own_listing' }

  // Find existing shop-level conversation for this user + shop
  const { data: existing } = await a
    .from('conversations')
    .select('id')
    .eq('shop_id', shopId)
    .eq('client_id', user.id)
    .is('scooter_id', null)
    .maybeSingle() as { data: { id: string } | null }

  if (existing) return { conversationId: existing.id }

  // Create new shop conversation
  const { data, error } = await a
    .from('conversations')
    .insert({ shop_id: shopId, owner_id: ownerId, client_id: user.id })
    .select('id')
    .single() as { data: { id: string } | null; error: { code?: string; message?: string } | null }

  if (error) {
    // 23505 = unique_violation — race condition, conversation was created by a concurrent request
    if (error.code === '23505') {
      const { data: race } = await a
        .from('conversations')
        .select('id')
        .eq('shop_id', shopId)
        .eq('client_id', user.id)
        .is('scooter_id', null)
        .single() as { data: { id: string } | null }
      if (race) return { conversationId: race.id }
    }
    console.error('[getOrCreateShopConversation]', error.message)
    return { error: 'conversation_failed' }
  }

  if (!data) return { error: 'conversation_failed' }

  return { conversationId: data.id }
}
