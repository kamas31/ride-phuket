'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, isAdminUser } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface DeleteScooterResult {
  success: boolean
  error?: string
}

export async function deleteScooter(scooterId: string): Promise<DeleteScooterResult> {
  try {
    if (!scooterId) return { success: false, error: 'Scooter ID missing.' }

    // ── Auth ─────────────────────────────────────────────────────
    const userClient = await createClient()
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) return { success: false, error: 'Not authenticated.' }

    const admin = createAdminClient()

    // ── Verify ownership ──────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: scooterRow, error: fetchErr } = await (admin as any)
      .from('scooters')
      .select('id, images, shops(owner_id)')
      .eq('id', scooterId)
      .single()

    if (fetchErr || !scooterRow) return { success: false, error: 'Scooter not found.' }
    if (scooterRow.shops?.owner_id !== user.id && !(await isAdminUser(admin, user.id))) {
      return { success: false, error: 'You do not own this scooter.' }
    }

    // ── Check for active/confirmed bookings ────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: activeBookings } = await (admin as any)
      .from('bookings')
      .select('id')
      .eq('scooter_id', scooterId)
      .in('status', ['active', 'confirmed', 'pending'])
      .limit(1)

    if (activeBookings?.length > 0) {
      return { success: false, error: 'Cannot delete — there are active bookings for this scooter.' }
    }

    // ── Delete storage images ─────────────────────────────────────
    const images: string[] = scooterRow.images ?? []
    if (images.length > 0) {
      // Extract storage paths from Supabase public URLs
      // URL format: https://<project>.supabase.co/storage/v1/object/public/scooter-images/<path>
      const paths = images
        .map(url => {
          try {
            const u = new URL(url)
            const match = u.pathname.match(/\/object\/public\/scooter-images\/(.+)/)
            return match ? match[1] : null
          } catch { return null }
        })
        .filter((p): p is string => Boolean(p))

      if (paths.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: storageErr } = await (admin as any)
          .storage
          .from('scooter-images')
          .remove(paths)

        if (storageErr) {
          console.warn('[deleteScooter] Storage cleanup failed (non-fatal):', storageErr.message)
        }
      }
    }

    // ── Delete from DB ────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteErr } = await (admin as any)
      .from('scooters')
      .delete()
      .eq('id', scooterId)

    if (deleteErr) {
      console.error('[deleteScooter] DB error:', deleteErr.message)
      return { success: false, error: deleteErr.message }
    }

    revalidatePath('/partner/dashboard')
    return { success: true }

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { success: false, error: `Unexpected error: ${msg.slice(0, 120)}` }
  }
}
