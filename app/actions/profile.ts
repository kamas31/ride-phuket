'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
  avatar_url?: string | null
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
  verified: boolean; active: boolean; plan_type: string;
  logo_url: string | null;
} | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('shops')
      .select('id,name,slug,location,verified,active,plan_type,logo_url')
      .eq('owner_id', user.id)
      .single()

    if (error) return null
    return data
  } catch {
    return null
  }
}

export async function updateShopLogo(
  shopId: string,
  logoUrl: string | null,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: shopRow } = await (admin as any)
      .from('shops')
      .select('owner_id')
      .eq('id', shopId)
      .single()
    if (!shopRow || shopRow.owner_id !== user.id) return { error: 'Unauthorized' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from('shops')
      .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
      .eq('id', shopId)

    if (error) return { error: error.message }
    revalidatePath('/partner/dashboard')
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export interface FullShopRow {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_image: string | null
  gallery: string[]
  phone: string | null
  whatsapp: string | null
  line_id: string | null
  telegram: string | null
  instagram: string | null
  website: string | null
  location: string
  address: string | null
  lat: number | null
  lng: number | null
  google_maps_link: string | null
  delivery_zones: string[]
  opening_hours: string | null
  verified: boolean
  active: boolean
  plan_type: string
  location_visibility: string | null
  show_opening_hours: boolean
}

export async function deleteAccount(): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(user.id)
    return { error: error?.message ?? null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function getFullShopForOwner(): Promise<FullShopRow | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('shops')
      .select('id,name,slug,description,logo_url,cover_image,gallery,phone,whatsapp,line_id,telegram,instagram,website,location,address,lat,lng,google_maps_link,delivery_zones,opening_hours,verified,active,plan_type,location_visibility,show_opening_hours')
      .eq('owner_id', user.id)
      .single()

    if (error) return null
    return data as FullShopRow
  } catch {
    return null
  }
}
