'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface CreateShopPayload {
  shopName: string
  location: string
  phone: string
  address?: string
  description?: string
}

export interface CreateShopResult {
  success: boolean
  shopId?: string
  error?: string
  errorCode?: string
}

export async function createShop(payload: CreateShopPayload): Promise<CreateShopResult> {
  // ── Auth required ──────────────────────────────────────────
  const userClient = await createClient()
  const { data: { user }, error: authErr } = await userClient.auth.getUser()

  if (authErr || !user) {
    return { success: false, error: 'You must be signed in to create a shop.', errorCode: 'UNAUTHENTICATED' }
  }

  // ── Validate ───────────────────────────────────────────────
  if (!payload.shopName?.trim()) return { success: false, error: 'Shop name is required.' }
  if (!payload.location?.trim()) return { success: false, error: 'Location is required.' }
  if (!payload.phone?.trim()) return { success: false, error: 'Phone number is required.' }

  // ── Build slug (unique with random suffix) ─────────────────
  const slug = payload.shopName
    .toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .slice(0, 50) + '-' + Math.random().toString(36).slice(2, 6)

  const admin = createAdminClient()

  // ── Check user doesn't already have a shop ─────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from('shops')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (existing) {
    return { success: false, error: 'You already have a shop registered.', errorCode: 'ALREADY_EXISTS' }
  }

  // ── Insert shop — verified=true, active=true (direct flow) ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shop, error: insertErr } = await (admin as any)
    .from('shops')
    .insert({
      owner_id:    user.id,
      name:        payload.shopName.trim(),
      slug,
      location:    payload.location,
      phone:       payload.phone.trim(),
      address:     payload.address?.trim() || null,
      description: payload.description?.trim() || null,
      verified:    true,   // direct flow — no manual validation
      active:      true,
    })
    .select('id')
    .single()

  if (insertErr) {
    console.error('[createShop] Insert error:', insertErr.message, insertErr.code)
    if (insertErr.code === '23505') {
      return { success: false, error: 'A shop with this name already exists. Try a slightly different name.', errorCode: 'DUPLICATE' }
    }
    return { success: false, error: insertErr.message, errorCode: insertErr.code }
  }

  // ── Link shop to profile ───────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileErr } = await (admin as any)
    .from('profiles')
    .update({ shop_id: shop.id, role: 'shop_owner' })
    .eq('id', user.id)

  if (profileErr) {
    console.warn('[createShop] Could not link profile to shop:', profileErr.message)
    // Non-fatal — shop is created, just log the warning
  }

  console.log('[createShop] Shop created:', shop.id, '| owner:', user.id.slice(0, 8))
  return { success: true, shopId: shop.id }
}
