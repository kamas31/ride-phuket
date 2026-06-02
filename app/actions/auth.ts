'use server'

import { createClient } from '@/lib/supabase/server'

export async function emailExists(email: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('check_email_registered', {
      p_email: email.toLowerCase().trim(),
    })
    if (error) return false
    return data === true
  } catch {
    return false
  }
}
