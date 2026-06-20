'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, isAdminUser } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getZoneForLocation } from '@/lib/zones'

export interface AdminCreateShopPayload {
  name: string
  location: string
  phone: string
  whatsapp?: string
  address?: string
  description?: string
  active?: boolean
}

export interface AdminCreateShopResult {
  success: boolean
  shopId?: string
  error?: string
  errorCode?: string
}

// Admin-only: creates a shop with no owner account (owner_status = 'unclaimed').
// Used to onboard operators contacted off-platform (e.g. Facebook) before
// they create an account. Owner invite/claim flow is not implemented here —
// owner_id stays NULL until a future claim step links a real account.
export async function adminCreateShop(payload: AdminCreateShopPayload): Promise<AdminCreateShopResult> {
  try {
    if (!payload.name?.trim())     return { success: false, error: 'Shop name is required.', errorCode: 'VALIDATION' }
    if (!payload.location?.trim()) return { success: false, error: 'Location is required.', errorCode: 'VALIDATION' }
    if (!payload.phone?.trim())    return { success: false, error: 'Phone number is required.', errorCode: 'VALIDATION' }

    const userClient = await createClient()
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) return { success: false, error: 'Not authenticated.', errorCode: 'UNAUTHENTICATED' }

    const admin = createAdminClient()

    const isAdmin = await isAdminUser(admin, user.id)
    if (!isAdmin) return { success: false, error: 'Unauthorized.', errorCode: 'UNAUTHORIZED' }

    const slug = payload.name
      .toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .slice(0, 50) + '-' + Math.random().toString(36).slice(2, 6)

    const zone = getZoneForLocation(payload.location || '')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: shop, error: insertErr } = await (admin as any)
      .from('shops')
      .insert({
        owner_id:            null,
        owner_status:        'unclaimed',
        created_by_admin_id: user.id,
        name:                payload.name.trim(),
        slug,
        location:            payload.location,
        lat:                 zone?.lat ?? null,
        lng:                 zone?.lng ?? null,
        phone:               payload.phone.trim(),
        whatsapp:            payload.whatsapp?.trim() || null,
        address:             payload.address?.trim() || '',
        description:         payload.description?.trim() || '',
        verified:            true,
        active:              payload.active ?? true,
      })
      .select('id')
      .single()

    if (insertErr) {
      console.error('[adminCreateShop] DB insert error:', insertErr.code, insertErr.message)
      if (insertErr.code === '23505') {
        return { success: false, error: 'A shop with this name already exists. Try a slightly different name.', errorCode: 'DUPLICATE' }
      }
      return { success: false, error: insertErr.message, errorCode: insertErr.code }
    }

    revalidatePath('/admin/shops')
    revalidatePath('/explore')

    return { success: true, shopId: shop.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[adminCreateShop] UNHANDLED EXCEPTION:', msg)
    return { success: false, error: `Unexpected error: ${msg.slice(0, 120)}`, errorCode: 'UNHANDLED' }
  }
}
