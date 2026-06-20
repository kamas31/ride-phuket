/**
 * Supabase Admin Client — service_role key, bypasses RLS.
 * USE ONLY in Server Components, Route Handlers, and Server Actions.
 * NEVER import this in client components or expose the service_role key.
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY — admin client unavailable')
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Checks profiles.is_admin for the given user via the service_role client.
 * Call after resolving the caller's user.id from a user-scoped client.
 */
export async function isAdminUser(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()
  return data?.is_admin === true
}
