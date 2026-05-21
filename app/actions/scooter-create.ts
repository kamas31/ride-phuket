'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface CreateScooterPayload {
  shopId: string
  name: string
  brand: string
  model: string
  year: number
  category: 'automatic' | 'manual' | 'electric'
  images: string[]          // public URLs after upload
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
    engine: string
    power: string
    fuelCapacity: string
    consumption: string
    weight: string
    storage: string
  }
  description: string
}

export interface CreateScooterResult {
  success: boolean
  scooterId?: string
  error?: string
}

export async function createScooter(payload: CreateScooterPayload): Promise<CreateScooterResult> {
  // ── Auth ──────────────────────────────────────────────────
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const admin = createAdminClient()

  // ── Verify ownership ─────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shop } = await (admin as any)
    .from('shops')
    .select('id,owner_id')
    .eq('id', payload.shopId)
    .single()

  if (!shop || shop.owner_id !== user.id) {
    return { success: false, error: 'Unauthorized — you do not own this shop.' }
  }

  // ── Validate required fields ──────────────────────────────
  if (!payload.name?.trim()) return { success: false, error: 'Scooter name is required.' }
  if (!payload.pricePerDay || payload.pricePerDay < 100) return { success: false, error: 'Price per day must be at least ฿100.' }

  // ── Insert scooter ────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('scooters')
    .insert({
      shop_id:            payload.shopId,
      name:               payload.name.trim(),
      brand:              payload.brand.trim(),
      model:              payload.model.trim(),
      year:               payload.year,
      category:           payload.category,
      images:             payload.images,
      price_per_day:      payload.pricePerDay,
      price_per_week:     payload.pricePerWeek || null,
      price_per_month:    payload.pricePerMonth || null,
      location:           payload.location,
      delivery_available: payload.deliveryAvailable,
      delivery_fee:       payload.deliveryFee,
      helmet_included:    payload.helmetIncluded,
      insurance_included: payload.insuranceIncluded,
      min_rental_days:    payload.minRentalDays,
      features:           payload.features,
      specs:              payload.specs,
      description:        payload.description.trim(),
      available:          true,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createScooter] Error:', error.message, error.code)
    return { success: false, error: error.message }
  }

  console.log('[createScooter] Created:', data.id, '| shop:', payload.shopId.slice(0, 8))
  return { success: true, scooterId: data.id }
}
