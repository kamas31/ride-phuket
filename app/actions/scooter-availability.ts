'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function toggleScooterAvailability(
  scooterId: string,
  available: boolean,
): Promise<{ error?: string }> {
  // Verify session
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Use admin client to bypass RLS (same pattern as scooter-update.ts)
  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('scooters')
    .update({ available })
    .eq('id', scooterId)

  if (error) return { error: error.message }

  revalidatePath('/partner/dashboard')
  revalidatePath('/partner/availability')
  revalidatePath('/explore')

  return {}
}
