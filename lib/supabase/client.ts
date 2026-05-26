import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

// Module-level singleton — one client instance per browser page.
// Every createClient() call returns the SAME instance, so all
// onAuthStateChange subscriptions share a single event emitter.
// Without this, signInWithPassword fires SIGNED_IN on the caller's
// client only, leaving every other component's user state stale.
let _client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (typeof window === 'undefined') {
    // Server components should use lib/supabase/server.ts
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  if (!_client) {
    _client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
