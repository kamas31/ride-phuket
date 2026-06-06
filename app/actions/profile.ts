'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Profile } from '@/hooks/useProfile'
import type { UserRole } from '@/lib/supabase/types'

export async function getServerProfile(): Promise<Profile | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('id,name,role,is_admin,shop_id,avatar_url,phone,nationality,verified,created_at')
      .eq('id', user.id)
      .single()

    if (error) {
      // PGRST116 = "The result contains 0 rows" — profile genuinely missing.
      // This is the expected state for a new OAuth user who has not yet
      // completed /auth/select-role. Return null so callers can detect and
      // redirect rather than silently treating them as a rider.
      if ((error as { code?: string }).code === 'PGRST116') return null

      // Any other error (network, RLS, pre-002 migration) — safe JWT fallback.
      // Never promote to shop_owner on error.
      return {
        id: user.id,
        name: (user.user_metadata?.name as string) ?? user.email ?? 'Rider',
        role: (user.user_metadata?.role as 'rider' | 'shop_owner') ?? 'rider',
        is_admin: false,
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

    // Shop owners must contact support — self-serve deletion not available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (profile?.role === 'shop_owner') {
      return { error: 'Shop owners must contact support to delete their account.' }
    }

    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(user.id)
    return { error: error?.message ?? null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

// ── completeOAuthProfile ───────────────────────────────────────────────────
// Called from /auth/select-role after a new Google OAuth user picks their role.
// Creates the profiles row (skipped by the DB trigger for OAuth users) and
// syncs the role into JWT metadata so the middleware sees it on the next request.

export async function completeOAuthProfile(
  role: UserRole,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any

    // Idempotency guard — never overwrite an existing profile
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!existing) {
      const { error } = await admin.from('profiles').insert({
        id:   user.id,
        name: (user.user_metadata?.full_name as string)
          ?? (user.user_metadata?.name as string)
          ?? user.email
          ?? 'User',
        role,
      })
      if (error) return { error: error.message }
    }

    // Sync role into JWT metadata — middleware reads this on next request
    await supabase.auth.updateUser({ data: { role } })

    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function requestShopAccountDeletion(): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any

    const { data: profile } = await admin
      .from('profiles')
      .select('role,shop_id')
      .eq('id', user.id)
      .maybeSingle()
    if (profile?.role !== 'shop_owner') return { error: 'Not a shop owner account' }

    // Idempotency: block duplicate pending requests
    const { data: existing } = await admin
      .from('account_deletion_requests')
      .select('id')
      .eq('user_id', user.id)
      .is('processed_at', null)
      .maybeSingle()
    if (existing) return { error: null } // already submitted — treat as success

    // Immediately deactivate all scooters so no new bookings come in
    if (profile.shop_id) {
      await admin
        .from('scooters')
        .update({ available: false })
        .eq('shop_id', profile.shop_id)
    }

    // Create deletion request record
    const { error } = await admin
      .from('account_deletion_requests')
      .insert({ user_id: user.id, shop_id: profile.shop_id ?? null })
    if (error) return { error: error.message }

    // Notify admin — best-effort, must not fail the user-facing request
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from:    'Koh Ride <noreply@kohride.com>',
          to:      'contact@kohride.com',
          subject: '[Koh Ride] Shop Account Deletion Request',
          html: [
            `<strong>User ID:</strong> ${user.id}`,
            `<strong>Email:</strong> ${user.email ?? 'unknown'}`,
            `<strong>Shop ID:</strong> ${profile.shop_id ?? 'none'}`,
            `<strong>Requested:</strong> ${new Date().toUTCString()}`,
            '',
            '<hr />',
            'Scooter listings have been deactivated. Please complete account deletion within 30 days.',
          ].join('<br />'),
        })
      } catch { /* silent — notification failure must not block the request */ }
    }

    return { error: null }
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
