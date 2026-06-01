'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Get or create a Koh Ride conversation between the current user and a shop.
 * Anchors to the shop's most recently created scooter (the conversation model
 * requires a scooter_id). Returns `sign_in_required` when not authenticated.
 */
export async function getOrCreateShopConversation(
  shopId: string,
): Promise<{ conversationId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'sign_in_required' }

  const admin = createAdminClient()

  // Find any scooter for this shop (available or not) to anchor the conversation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: scooter } = await (admin as any)
    .from('scooters')
    .select('id, shops(owner_id)')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!scooter) return { error: 'no_scooters' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerId = (scooter as any).shops?.owner_id as string | undefined
  if (!ownerId) return { error: 'owner_not_found' }
  if (ownerId === user.id) return { error: 'own_listing' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('conversations')
    .upsert(
      { scooter_id: scooter.id, client_id: user.id, owner_id: ownerId },
      { onConflict: 'scooter_id,client_id' },
    )
    .select('id')
    .single()

  if (error || !data) {
    console.error('[getOrCreateShopConversation]', error?.message)
    return { error: 'conversation_failed' }
  }

  return { conversationId: data.id as string }
}
