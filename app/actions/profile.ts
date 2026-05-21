'use server'

import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/hooks/useProfile'

export async function getServerProfile(): Promise<Profile | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('id,name,role,shop_id,avatar_url,phone,nationality,verified,created_at')
      .eq('id', user.id)
      .single()

    if (error) {
      // Graceful fallback if migration 002 not yet applied
      return {
        id: user.id,
        name: (user.user_metadata?.name as string) ?? user.email ?? 'Rider',
        role: (user.user_metadata?.role as 'rider' | 'shop_owner') ?? 'rider',
        shop_id: null,
        avatar_url: null,
        phone: null,
        nationality: null,
        verified: false,
        created_at: user.created_at,
      }
    }

    return data as Profile
  } catch {
    return null
  }
}

export async function updateProfile(updates: {
  name?: string
  phone?: string
  nationality?: string
  avatar_url?: string
}): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    return { error: error?.message ?? null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function getShopForOwner(): Promise<{
  id: string; name: string; slug: string; location: string;
  verified: boolean; active: boolean;
} | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('shops')
      .select('id,name,slug,location,verified,active')
      .eq('owner_id', user.id)
      .single()

    if (error) return null
    return data
  } catch {
    return null
  }
}
