'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Admin-only: set or clear the New Listing badge override on a scooter.
 *   value = true  → force show badge
 *   value = false → force hide badge
 *   value = null  → revert to automatic (7-day createdAt rule)
 *
 * Requires is_admin = true on the caller's profile.
 * Uses the admin client to bypass RLS — the check above is the sole auth gate.
 */
export async function adminSetNewListingBadge(
  scooterId: string,
  value: boolean | null,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return { error: 'Admin access required' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { error } = await admin
    .from('scooters')
    .update({ show_new_listing_badge: value, updated_at: new Date().toISOString() })
    .eq('id', scooterId)

  if (error) {
    console.error('[adminSetNewListingBadge]', error.message)
    return { error: error.message }
  }

  revalidatePath(`/scooter/${scooterId}`)
  revalidatePath('/explore')
  revalidatePath('/')
  return {}
}
