'use server'

import { revalidatePath } from 'next/cache'
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

// ── Helper: race a promise against a timeout ─────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function withTimeout<T = any>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let id: ReturnType<typeof setTimeout>
  const timeout = new Promise<T>((_, reject) => {
    id = setTimeout(() => reject(new Error(`[createShop] Timeout (${ms}ms) at: ${label}`)), ms)
  })
  try {
    const result = await Promise.race([promise, timeout])
    clearTimeout(id!)
    return result
  } catch (e) {
    clearTimeout(id!)
    throw e
  }
}

export async function createShop(payload: CreateShopPayload): Promise<CreateShopResult> {
  // ── Top-level guard: nothing can throw out of this function ──
  try {

    // ── 1. Validate payload ──────────────────────────────────
    if (!payload.shopName?.trim()) return { success: false, error: 'Shop name is required.', errorCode: 'VALIDATION' }
    if (!payload.location?.trim()) return { success: false, error: 'Location is required.', errorCode: 'VALIDATION' }
    if (!payload.phone?.trim())    return { success: false, error: 'Phone number is required.', errorCode: 'VALIDATION' }

    // ── 2. Get current user ──────────────────────────────────
    let userId: string

    try {
      const userClient = await withTimeout(createClient(), 8000, 'createClient')
      const { data: { user }, error: authErr } = await withTimeout(
        userClient.auth.getUser(),
        8000,
        'auth.getUser'
      )

      if (authErr) {
        console.error('[createShop] auth error:', authErr.message)
        return { success: false, error: 'Authentication error — please sign in again.', errorCode: 'AUTH_ERROR' }
      }
      if (!user) {
        return { success: false, error: 'You must be signed in to create a shop.', errorCode: 'UNAUTHENTICATED' }
      }

      userId = user.id
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[createShop] auth THREW:', msg)
      return { success: false, error: `Auth check failed: ${msg}`, errorCode: 'AUTH_TIMEOUT' }
    }

    // ── 3. Init admin client ─────────────────────────────────
    let admin: ReturnType<typeof createAdminClient>
    try {
      admin = createAdminClient()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[createShop] admin init THREW:', msg)
      return { success: false, error: 'Server configuration error.', errorCode: 'ADMIN_INIT_FAILED' }
    }

    // ── 4. Check no existing shop ────────────────────────────
    try {
      const checkResult = await withTimeout(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (admin as any).from('shops').select('id').eq('owner_id', userId).single() as Promise<{ data: { id: string } | null; error: unknown }>,
        8000,
        'check-existing-shop'
      )
      if (checkResult.data) {
        return { success: false, error: 'You already have a shop registered.', errorCode: 'ALREADY_EXISTS' }
      }
    } catch {
      // PGRST116 = no rows — fine, means no existing shop
    }

    // ── 5. Build slug ────────────────────────────────────────
    const slug = payload.shopName
      .toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .slice(0, 50) + '-' + Math.random().toString(36).slice(2, 6)

    // ── 6. Insert shop ───────────────────────────────────────
    let shopId: string
    try {
      const { data: shop, error: insertErr } = await withTimeout(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (admin as any)
          .from('shops')
          .insert({
            owner_id:    userId,
            name:        payload.shopName.trim(),
            slug,
            location:    payload.location,
            phone:       payload.phone.trim(),
            address:     payload.address?.trim() || '',
            description: payload.description?.trim() || '',
            verified:    true,
            active:      true,
          })
          .select('id')
          .single(),
        8000,
        'insert-shop'
      )

      if (insertErr) {
        console.error('[createShop] DB insert error:', insertErr.code, insertErr.message)
        if (insertErr.code === '23505') {
          return { success: false, error: 'A shop with this name already exists. Try a slightly different name.', errorCode: 'DUPLICATE' }
        }
        if (insertErr.code === '42501') {
          return { success: false, error: 'Database permission error. Please contact support.', errorCode: 'PERMISSION_DENIED' }
        }
        return { success: false, error: insertErr.message || 'Insert failed.', errorCode: insertErr.code }
      }

      shopId = shop.id
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[createShop] insert THREW:', msg)
      return { success: false, error: `Shop creation failed: ${msg}`, errorCode: 'INSERT_FAILED' }
    }

    // ── 7. Link shop to profile ──────────────────────────────
    try {
      const { error: profileErr } = await withTimeout(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (admin as any)
          .from('profiles')
          .update({ shop_id: shopId, role: 'shop_owner' })
          .eq('id', userId),
        8000,
        'update-profile'
      )
      if (profileErr) {
        console.error('[createShop] profile update failed (non-fatal):', profileErr.message)
      }
    } catch (e) {
      console.error('[createShop] profile update THREW (non-fatal):', e instanceof Error ? e.message : String(e))
    }

    // ── 8. Revalidate ────────────────────────────────────────
    try {
      revalidatePath('/partner/dashboard')
      revalidatePath('/partner')
    } catch {
      // Non-fatal
    }

    return { success: true, shopId }

  } catch (unhandled) {
    const msg = unhandled instanceof Error ? unhandled.message : String(unhandled)
    console.error('[createShop] UNHANDLED EXCEPTION:', msg)
    return {
      success: false,
      error: `Unexpected error — please try again. (${msg.slice(0, 100)})`,
      errorCode: 'UNHANDLED',
    }
  }
}
