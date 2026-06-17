'use server'

import { createClient } from '@/lib/supabase/server'

export async function savePushToken(token: string, platform: 'ios' | 'android'): Promise<void> {
  // NOTE: these logs appear in Vercel function logs, not in the browser/Safari console.
  console.log('[savePushToken] called, platform:', platform, 'prefix:', token.substring(0, 8), 'length:', token.length)

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError) console.error('[savePushToken] getUser error:', userError.message)
  if (!user) {
    console.log('[savePushToken] no authenticated user — aborting')
    return
  }
  console.log('[savePushToken] user.id:', user.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('push_tokens')
    .upsert(
      { user_id: user.id, token, platform },
      { onConflict: 'user_id,token' },
    )

  if (error) {
    console.error('[savePushToken] upsert error — code:', error.code, 'message:', error.message)
  } else {
    console.log('[savePushToken] upsert succeeded for user:', user.id)
  }
}
