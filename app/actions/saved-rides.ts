'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getScootersByIds } from '@/lib/supabase/queries'
import type { Scooter } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

// Fire-and-forget analytics event — never throws, never blocks UX
function trackSaveEvent(
  eventType: 'ride_saved' | 'ride_unsaved',
  scooterId: string,
  userId: string,
) {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(admin as any)
    .from('events')
    .insert({ event_type: eventType, scooter_id: scooterId, metadata: { userId } })
    .then(() => {})
    .catch(() => {})
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function saveRide(scooterId: string): Promise<{ ok: boolean; error?: string }> {
  const userId = await getAuthUserId()
  if (!userId) return { ok: false, error: 'unauthenticated' }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('saved_scooters')
    .upsert({ user_id: userId, scooter_id: scooterId }, { onConflict: 'user_id,scooter_id' })

  if (error) return { ok: false, error: error.message }

  trackSaveEvent('ride_saved', scooterId, userId)
  return { ok: true }
}

export async function unsaveRide(scooterId: string): Promise<{ ok: boolean; error?: string }> {
  const userId = await getAuthUserId()
  if (!userId) return { ok: false, error: 'unauthenticated' }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('saved_scooters')
    .delete()
    .eq('user_id', userId)
    .eq('scooter_id', scooterId)

  if (error) return { ok: false, error: error.message }

  trackSaveEvent('ride_unsaved', scooterId, userId)
  return { ok: true }
}

export async function toggleSavedRide(scooterId: string): Promise<{ ok: boolean; saved: boolean; error?: string }> {
  const userId = await getAuthUserId()
  if (!userId) return { ok: false, saved: false, error: 'unauthenticated' }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('saved_scooters')
    .select('id')
    .eq('user_id', userId)
    .eq('scooter_id', scooterId)
    .maybeSingle()

  if (existing) {
    await unsaveRide(scooterId)
    return { ok: true, saved: false }
  } else {
    await saveRide(scooterId)
    return { ok: true, saved: true }
  }
}

/** Returns saved scooter IDs for the current user — used to hydrate client state */
export async function getSavedRideIds(): Promise<string[]> {
  const userId = await getAuthUserId()
  if (!userId) return []

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('saved_scooters')
    .select('scooter_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return (data as { scooter_id: string }[]).map(r => r.scooter_id)
}

/** Returns full Scooter objects for the saved page */
export async function getSavedScooters(): Promise<Scooter[]> {
  const ids = await getSavedRideIds()
  if (!ids.length) return []
  return getScootersByIds(ids)
}

export async function isRideSaved(scooterId: string): Promise<boolean> {
  const userId = await getAuthUserId()
  if (!userId) return false

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('saved_scooters')
    .select('id')
    .eq('user_id', userId)
    .eq('scooter_id', scooterId)
    .maybeSingle()

  return !!data
}
