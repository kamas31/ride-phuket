'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function toggleScooterAvailability(
  scooterId: string,
  available: boolean,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('scooters')
    .update({ available })
    .eq('id', scooterId)

  if (error) return { error: error.message }

  revalidatePath('/partner/dashboard')
  revalidatePath('/partner/availability')
  revalidatePath('/explore')

  return {}
}
