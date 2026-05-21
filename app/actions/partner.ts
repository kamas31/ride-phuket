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
  const t0 = Date.now()
  console.log('[createShop] ▶ START', JSON.stringify({ shopName: payload.shopName, location: payload.location }))

  // ── Top-level guard: nothing can throw out of this function ──
  try {

    // ── 1. Validate payload ──────────────────────────────────
    if (!payload.shopName?.trim()) return { success: false, error: 'Shop name is required.', errorCode: 'VALIDATION' }
    if (!payload.location?.trim()) return { success: false, error: 'Location is required.', errorCode: 'VALIDATION' }
    if (!payload.phone?.trim())    return { success: false, error: 'Phone number is required.', errorCode: 'VALIDATION' }

    // ── 2. Get current user ──────────────────────────────────
    console.log('[createShop] Step 2: getUser')
    let userId: string

    try {
      const userClient = await withTimeout(createClient(), 8000, 'createClient')
      const { data: { user }, error: authErr } = await withTimeout(
        userClient.auth.getUser(),
        8000,
        'auth.getUser'
      )

      if (authErr) {
        console.error('[createShop] auth error:', authErr.message, authErr.status)
        return { success: false, error: 'Authentication error — please sign in again.', errorCode: 'AUTH_ERROR' }
      }
      if (!user) {
        console.warn('[createShop] no user in session')
        return { success: false, error: 'You must be signed in to create a shop.', errorCode: 'UNAUTHENTICATED' }
      }

      userId = user.id
      console.log('[createShop] Step 2 OK: user', userId.slice(0, 8), `(${Date.now() - t0}ms)`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[createShop] Step 2 THREW:', msg)
      // If auth fails due to timeout or key format, we can still check via admin
      // as a fallback — but for security we must reject
      return { success: false, error: `Auth check failed: ${msg}`, errorCode: 'AUTH_TIMEOUT' }
    }

    // ── 3. Init admin client ─────────────────────────────────
    console.log('[createShop] Step 3: createAdminClient')
    let admin: ReturnType<typeof createAdminClient>
    try {
      admin = createAdminClient()
      console.log('[createShop] Step 3 OK', `(${Date.now() - t0}ms)`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[createShop] Step 3 THREW:', msg)
      return { success: false, error: 'Server configuration error.', errorCode: 'ADMIN_INIT_FAILED' }
    }

    // ── 4. Check no existing shop ────────────────────────────
    console.log('[createShop] Step 4: check existing shop')
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const checkResult = await withTimeout(
        (admin as any).from('shops').select('id').eq('owner_id', userId).single() as Promise<{ data: { id: string } | null; error: unknown }>,
        8000,
        'check-existing-shop'
      )
      const existing = checkResult.data
      if (existing) {
        console.log('[createShop] Step 4: shop already exists:', existing.id)
        return { success: false, error: 'You already have a shop registered.', errorCode: 'ALREADY_EXISTS' }
      }
      console.log('[createShop] Step 4 OK: no existing shop', `(${Date.now() - t0}ms)`)
    } catch (e) {
      // PGRST116 = no rows — that's fine, means no existing shop
      const msg = e instanceof Error ? e.message : String(e)
      if (!msg.includes('PGRST116') && !msg.includes('Timeout')) {
        console.warn('[createShop] Step 4 non-fatal error:', msg)
      } else {
        console.log('[createShop] Step 4 OK: no existing shop (PGRST116)', `(${Date.now() - t0}ms)`)
      }
    }

    // ── 5. Build slug ────────────────────────────────────────
    const slug = payload.shopName
      .toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .slice(0, 50) + '-' + Math.random().toString(36).slice(2, 6)

    // ── 6. Insert shop ───────────────────────────────────────
    console.log('[createShop] Step 6: insert shop', { slug, location: payload.location })
    let shopId: string
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: shop, error: insertErr } = await withTimeout(
        (admin as any)
          .from('shops')
          .insert({
            owner_id:    userId,
            name:        payload.shopName.trim(),
            slug,
            location:    payload.location,
            phone:       payload.phone.trim(),
            address:     payload.address?.trim() || null,
            description: payload.description?.trim() || null,
            verified:    true,
            active:      true,
          })
          .select('id')
          .single(),
        8000,
        'insert-shop'
      )

      if (insertErr) {
        console.error('[createShop] Step 6 DB error:', {
          message: insertErr.message,
          code:    insertErr.code,
          hint:    insertErr.hint,
          details: insertErr.details,
        })
        if (insertErr.code === '23505') {
          return { success: false, error: 'A shop with this name already exists. Try a slightly different name.', errorCode: 'DUPLICATE' }
        }
        if (insertErr.code === '42501') {
          return { success: false, error: 'Database permission error. Please contact support.', errorCode: 'PERMISSION_DENIED' }
        }
        return { success: false, error: insertErr.message || 'Insert failed.', errorCode: insertErr.code }
      }

      shopId = shop.id
      console.log('[createShop] Step 6 OK: shop created', shopId, `(${Date.now() - t0}ms)`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[createShop] Step 6 THREW:', msg)
      return { success: false, error: `Shop creation failed: ${msg}`, errorCode: 'INSERT_FAILED' }
    }

    // ── 7. Link shop to profile ──────────────────────────────
    console.log('[createShop] Step 7: update profile')
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileErr } = await withTimeout(
        (admin as any)
          .from('profiles')
          .update({ shop_id: shopId, role: 'shop_owner' })
          .eq('id', userId),
        8000,
        'update-profile'
      )
      if (profileErr) {
        // Non-fatal but log it — migrations might not be applied yet
        console.warn('[createShop] Step 7 profile update failed (non-fatal):', profileErr.message, profileErr.code)
      } else {
        console.log('[createShop] Step 7 OK: profile updated', `(${Date.now() - t0}ms)`)
      }
    } catch (e) {
      console.warn('[createShop] Step 7 THREW (non-fatal):', e instanceof Error ? e.message : String(e))
    }

    // ── 8. Revalidate ────────────────────────────────────────
    try {
      revalidatePath('/partner/dashboard')
      revalidatePath('/partner')
    } catch {
      // Non-fatal
    }

    const totalMs = Date.now() - t0
    console.log(`[createShop] ✅ COMPLETE in ${totalMs}ms | shop: ${shopId}`)
    return { success: true, shopId }

  } catch (unhandled) {
    // Absolute last resort — should never reach here
    const msg = unhandled instanceof Error ? unhandled.message : String(unhandled)
    console.error('[createShop] ❌ UNHANDLED EXCEPTION:', msg, unhandled)
    return {
      success: false,
      error: `Unexpected error — please try again. (${msg.slice(0, 100)})`,
      errorCode: 'UNHANDLED',
    }
  }
}
