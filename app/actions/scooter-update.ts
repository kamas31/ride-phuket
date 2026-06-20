'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, isAdminUser } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { MileageRange } from '@/types'
import { getZoneForLocation } from '@/lib/zones'

export interface UpdateScooterPayload {
  name: string
  brand: string
  model: string
  year: number
  category: 'automatic' | 'manual' | 'electric'
  images: string[]           // final URL list (existing kept + newly uploaded)
  coverImage?: string | null
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
  available: boolean
  mileageRange?: MileageRange
  // Deposit & trust
  depositAmount?: number
  depositType?: string
  passportRequired?: boolean
  passportCopyAllowed?: boolean
  isPremiumBike?: boolean
  depositNotes?: string
}

export interface UpdateScooterResult {
  success: boolean
  error?: string
  errorCode?: string
}

export async function updateScooter(
  scooterId: string,
  payload: UpdateScooterPayload
): Promise<UpdateScooterResult> {
  try {
    if (!scooterId) return { success: false, error: 'Scooter ID missing.', errorCode: 'VALIDATION' }
    if (!payload.name?.trim()) return { success: false, error: 'Scooter name is required.', errorCode: 'VALIDATION' }
    if (payload.pricePerDay < 100) return { success: false, error: 'Price per day must be at least ฿100.', errorCode: 'VALIDATION' }

    // Auth
    const userClient = await createClient()
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) return { success: false, error: 'Not authenticated.', errorCode: 'UNAUTHENTICATED' }

    const admin = createAdminClient()

    // Verify ownership: scooter → shop → owner_id === user.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: scooterRow, error: fetchErr } = await (admin as any)
      .from('scooters')
      .select('id, shop_id, shops(owner_id)')
      .eq('id', scooterId)
      .single()

    if (fetchErr || !scooterRow) return { success: false, error: 'Scooter not found.', errorCode: 'NOT_FOUND' }
    if (scooterRow.shops?.owner_id !== user.id && !(await isAdminUser(admin, user.id))) {
      return { success: false, error: 'You do not own this scooter.', errorCode: 'UNAUTHORIZED' }
    }

    // Update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (admin as any)
      .from('scooters')
      .update({
        name:               payload.name.trim(),
        brand:              payload.brand,
        model:              payload.model,
        year:               payload.year,
        category:           payload.category,
        images:             payload.images,
        cover_image:        payload.coverImage ?? null,
        price_per_day:      payload.pricePerDay,
        price_per_week:     payload.pricePerWeek ?? null,
        price_per_month:    payload.pricePerMonth ?? null,
        location:           payload.location,
        lat:                getZoneForLocation(payload.location || '')?.lat ?? null,
        lng:                getZoneForLocation(payload.location || '')?.lng ?? null,
        delivery_available: payload.deliveryAvailable,
        delivery_fee:       payload.deliveryFee,
        helmet_included:    payload.helmetIncluded,
        insurance_included: payload.insuranceIncluded,
        min_rental_days:    payload.minRentalDays,
        features:           payload.features,
        specs:              payload.specs,
        description:        payload.description.trim(),
        available:          payload.available,
        mileage_range:        payload.mileageRange ?? null,
        deposit_amount:       payload.depositAmount ?? null,
        deposit_type:         payload.depositType ?? null,
        passport_required:    payload.passportRequired ?? false,
        passport_copy_allowed: payload.passportCopyAllowed ?? true,
        is_premium_bike:      payload.isPremiumBike ?? false,
        deposit_notes:        payload.depositNotes ?? null,
        updated_at:           new Date().toISOString(),
      })
      .eq('id', scooterId)

    if (updateErr) {
      console.error('[updateScooter] DB error:', updateErr.message)
      return { success: false, error: updateErr.message, errorCode: updateErr.code }
    }

    revalidatePath('/partner/dashboard')
    revalidatePath(`/scooter/${scooterId}`)

    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { success: false, error: `Unexpected error: ${msg.slice(0, 120)}`, errorCode: 'UNHANDLED' }
  }
}
