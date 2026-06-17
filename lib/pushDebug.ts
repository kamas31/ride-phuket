import { createClient } from '@/lib/supabase/client'

// Fire-and-forget diagnostic logger for push notification debugging.
// Writes to push_debug_log (anon insert allowed) so events are visible
// in the Supabase Table Editor without Safari Web Inspector.
// Remove calls to this function once the registration issue is resolved.
export function pushDebug(event: string, data?: string): void {
  void (async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (createClient() as any)
        .from('push_debug_log')
        .insert({ event, data: data ?? null })
    } catch { /* never let debug logging break the app */ }
  })()
}
