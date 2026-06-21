'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, isAdminUser } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { OpeningHoursSchedule } from '@/types'

export interface UpdateShopPayload {
  name: string
  description: string
  phone?: string
  location?: string
  whatsapp?: string
  lineId?: string
  telegram?: string
  instagram?: string
  website?: string
  address?: string
  lat?: number | null
  lng?: number | null
  googleMapsLink?: string
  deliveryZones?: string[]
  openingHours?: OpeningHoursSchedule | null
  showOpeningHours?: boolean
  logoUrl?: string | null
  coverImage?: string | null
  mobileBanner?: string | null
  gallery?: string[]
  locationVisibility?: 'exact' | 'approximate'
  active?: boolean
}

export interface UpdateShopResult {
  success: boolean
  error?: string
  errorCode?: string
}

export async function updateShop(
  shopId: string,
  payload: UpdateShopPayload
): Promise<UpdateShopResult> {
  try {
    if (!shopId) return { success: false, error: 'Shop ID missing.', errorCode: 'VALIDATION' }
    if (!payload.name?.trim()) return { success: false, error: 'Shop name is required.', errorCode: 'VALIDATION' }

    const userClient = await createClient()
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) return { success: false, error: 'Not authenticated.', errorCode: 'UNAUTHENTICATED' }

    const admin = createAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: shopRow, error: fetchErr } = await (admin as any)
      .from('shops')
      .select('id, owner_id, slug, location')
      .eq('id', shopId)
      .single()

    if (fetchErr || !shopRow) return { success: false, error: 'Shop not found.', errorCode: 'NOT_FOUND' }
    if (shopRow.owner_id !== user.id && !(await isAdminUser(admin, user.id))) {
      return { success: false, error: 'Unauthorized.', errorCode: 'UNAUTHORIZED' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (admin as any)
      .from('shops')
      .update({
        name:             payload.name.trim(),
        description:      payload.description?.trim() || '',
        phone:            payload.phone?.trim() || '',
        ...(payload.location ? { location: payload.location } : {}),
        whatsapp:         payload.whatsapp?.trim() || null,
        line_id:          payload.lineId?.trim() || null,
        telegram:         payload.telegram?.trim() || null,
        instagram:        payload.instagram?.trim() || null,
        website:          payload.website?.trim() || null,
        address:          payload.address?.trim() || '',
        lat:              payload.lat ?? null,
        lng:              payload.lng ?? null,
        google_maps_link: payload.googleMapsLink?.trim() || null,
        delivery_zones:   payload.deliveryZones ?? [],
        opening_hours:        payload.openingHours ? JSON.stringify(payload.openingHours) : null,
        show_opening_hours:   payload.showOpeningHours ?? true,
        logo_url:             payload.logoUrl ?? null,
        cover_image:          payload.coverImage ?? null,
        mobile_banner:        payload.mobileBanner ?? null,
        gallery:              payload.gallery ?? [],
        location_visibility:  payload.locationVisibility ?? 'exact',
        ...(payload.active !== undefined ? { active: payload.active } : {}),
        updated_at:           new Date().toISOString(),
      })
      .eq('id', shopId)

    if (updateErr) {
      console.error('[updateShop] DB error:', updateErr.message)
      return { success: false, error: updateErr.message, errorCode: updateErr.code }
    }

    // Shop location is the source of truth — when it changes, resync every
    // scooter belonging to this shop so Explore/cards/map never contradict it.
    if (payload.location && payload.location !== shopRow.location) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: resyncErr } = await (admin as any)
        .from('scooters')
        .update({
          location: payload.location,
          ...(payload.lat != null ? { lat: payload.lat } : {}),
          ...(payload.lng != null ? { lng: payload.lng } : {}),
        })
        .eq('shop_id', shopId)

      if (resyncErr) {
        console.error('[updateShop] scooter resync error:', resyncErr.message)
      }
    }

    revalidatePath('/partner/dashboard')
    revalidatePath('/partner/shop')
    revalidatePath(`/shop/${shopRow.slug ?? ''}`)
    revalidatePath('/explore')

    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { success: false, error: `Unexpected error: ${msg.slice(0, 120)}`, errorCode: 'UNHANDLED' }
  }
}
