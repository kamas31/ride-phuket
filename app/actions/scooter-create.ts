'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface CreateScooterPayload {
  shopId: string
  name: string
  brand: string
  model: string
  year: number
  category: 'automatic' | 'manual' | 'electric'
  images: string[]
  pricePerDay: number
  pricePerWeek?: number
  pricePerMonth?: number
  location: string
  deliveryAvailable: boolean
  deliveryFee: number
  helmetIncluded: boolean
  insuranceIncluded: boolean
  minRentalDays: number
  features: string[]
  specs: {
    engine: string; power: string; fuelCapacity: string
    consumption: string; weight: string; storage: string
  }
  description: string
}

export interface CreateScooterResult {
  success: boolean
  scooterId?: string
  error?: string
  errorCode?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function withTimeout<T = any>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let id: ReturnType<typeof setTimeout>
  const timeout = new Promise<T>((_, reject) => {
    id = setTimeout(() => reject(new Error(`[createScooter] Timeout (${ms}ms): ${label}`)), ms)
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

export async function createScooter(payload: CreateScooterPayload): Promise<CreateScooterResult> {
  const t0 = Date.now()
  console.log('[createScooter] ▶ START', payload.name, '| shop:', payload.shopId?.slice(0, 8))

  try {
    // ── 1. Validate ───────────────────────────────────────────
    if (!payload.name?.trim())
      return { success: false, error: 'Scooter name is required.', errorCode: 'VALIDATION' }
    if (!payload.pricePerDay || payload.pricePerDay < 100)
      return { success: false, error: 'Price per day must be at least ฿100.', errorCode: 'VALIDATION' }
    if (!payload.shopId)
      return { success: false, error: 'Shop ID missing.', errorCode: 'VALIDATION' }

    // ── 2. Auth ───────────────────────────────────────────────
    console.log('[createScooter] Step 2: auth.getUser')
    let userId: string
    try {
      const userClient = await withTimeout(createClient(), 8000, 'createClient')
      const { data: { user }, error: authErr } = await withTimeout(
        userClient.auth.getUser(), 8000, 'auth.getUser'
      )
      if (authErr || !user) {
        console.warn('[createScooter] Step 2 no user:', authErr?.message)
        return { success: false, error: 'Not authenticated.', errorCode: 'UNAUTHENTICATED' }
      }
      userId = user.id
      console.log('[createScooter] Step 2 OK:', userId.slice(0, 8), `(${Date.now() - t0}ms)`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[createScooter] Step 2 THREW:', msg)
      return { success: false, error: `Auth failed: ${msg}`, errorCode: 'AUTH_FAILED' }
    }

    // ── 3. Admin client ───────────────────────────────────────
    let admin: ReturnType<typeof createAdminClient>
    try {
      admin = createAdminClient()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[createScooter] admin init THREW:', msg)
      return { success: false, error: 'Server config error.', errorCode: 'ADMIN_INIT' }
    }

    // ── 4. Verify shop ownership ──────────────────────────────
    console.log('[createScooter] Step 4: verify shop ownership')
    try {
      const shopResult = await withTimeout(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (admin as any).from('shops').select('id,owner_id').eq('id', payload.shopId).single(),
        8000, 'verify-shop'
      )
      const shop = shopResult.data
      if (!shop) {
        console.warn('[createScooter] Step 4: shop not found')
        return { success: false, error: 'Shop not found.', errorCode: 'SHOP_NOT_FOUND' }
      }
      if (shop.owner_id !== userId) {
        console.warn('[createScooter] Step 4: ownership mismatch', shop.owner_id, '≠', userId.slice(0, 8))
        return { success: false, error: 'You do not own this shop.', errorCode: 'UNAUTHORIZED' }
      }
      console.log('[createScooter] Step 4 OK', `(${Date.now() - t0}ms)`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[createScooter] Step 4 THREW:', msg)
      return { success: false, error: `Shop check failed: ${msg}`, errorCode: 'SHOP_CHECK_FAILED' }
    }

    // ── 5. Build insert payload (with sanitisation) ───────────
    const insertPayload = {
      shop_id:            payload.shopId,
      name:               payload.name.trim(),
      brand:              (payload.brand || 'Honda').trim(),
      model:              (payload.model || payload.name).trim(),
      year:               Number(payload.year) || new Date().getFullYear(),
      category:           payload.category,
      images:             Array.isArray(payload.images) ? payload.images : [],
      price_per_day:      Number(payload.pricePerDay),
      price_per_week:     payload.pricePerWeek ? Number(payload.pricePerWeek) : null,
      price_per_month:    payload.pricePerMonth ? Number(payload.pricePerMonth) : null,
      location:           payload.location || 'Phuket',
      delivery_available: Boolean(payload.deliveryAvailable),
      delivery_fee:       Number(payload.deliveryFee) || 0,
      helmet_included:    Boolean(payload.helmetIncluded),
      insurance_included: Boolean(payload.insuranceIncluded),
      min_rental_days:    Number(payload.minRentalDays) || 1,
      features:           Array.isArray(payload.features) ? payload.features : [],
      specs:              payload.specs ?? {},
      description:        (payload.description || '').trim(),
      available:          true,
    }

    console.log('[createScooter] Step 5: insert payload ready', {
      name: insertPayload.name,
      price_per_day: insertPayload.price_per_day,
      category: insertPayload.category,
      images_count: insertPayload.images.length,
      features_count: insertPayload.features.length,
    })

    // ── 6. INSERT ─────────────────────────────────────────────
    console.log('[createScooter] Step 6: DB insert')
    let scooterId: string
    try {
      const insertResult = await withTimeout(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (admin as any).from('scooters').insert(insertPayload).select('id').single(),
        10000, 'insert-scooter'
      )
      const { data: scooter, error: insertErr } = insertResult

      if (insertErr) {
        console.error('[createScooter] Step 6 DB error:', {
          message: insertErr.message,
          code:    insertErr.code,
          hint:    insertErr.hint,
          details: insertErr.details,
        })
        if (insertErr.code === '42501') {
          return { success: false, error: 'Permission denied. Run migration 003 in Supabase.', errorCode: 'PERMISSION_DENIED' }
        }
        if (insertErr.code === '23502') {
          return { success: false, error: `Required field missing: ${insertErr.details ?? insertErr.message}`, errorCode: 'NOT_NULL' }
        }
        return { success: false, error: insertErr.message, errorCode: insertErr.code }
      }

      scooterId = scooter.id
      console.log('[createScooter] Step 6 OK: scooter created', scooterId, `(${Date.now() - t0}ms)`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[createScooter] Step 6 THREW:', msg)
      return { success: false, error: `Insert failed: ${msg}`, errorCode: 'INSERT_FAILED' }
    }

    // ── 7. Revalidate cache (non-blocking) ────────────────────
    console.log('[createScooter] Step 7: revalidatePath')
    try {
      revalidatePath('/partner/dashboard')
    } catch (e) {
      // Non-fatal — cache revalidation failure doesn't affect the user
      console.warn('[createScooter] revalidatePath failed (non-fatal):', e instanceof Error ? e.message : String(e))
    }

    const totalMs = Date.now() - t0
    console.log(`[createScooter] ✅ COMPLETE in ${totalMs}ms | scooter: ${scooterId}`)
    return { success: true, scooterId }

  } catch (unhandled) {
    const msg = unhandled instanceof Error ? unhandled.message : String(unhandled)
    console.error('[createScooter] ❌ UNHANDLED EXCEPTION:', msg)
    return { success: false, error: `Unexpected error: ${msg.slice(0, 120)}`, errorCode: 'UNHANDLED' }
  }
}
