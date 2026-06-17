'use server'

import { createClient } from '@/lib/supabase/server'

export async function savePushToken(token: string, platform: 'ios' | 'android'): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('push_tokens')
    .upsert(
      { user_id: user.id, token, platform },
      { onConflict: 'user_id,token' },
    )
}
