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
