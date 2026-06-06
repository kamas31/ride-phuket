import type { Scooter, ScooterCategory, ScooterSpecs, MileageRange, DepositType } from '@/types'
import { getZoneForLocation } from '@/lib/zones'
import { normalizeShop } from './normalize-shop'

const VALID_CATEGORIES: readonly ScooterCategory[] = ['automatic', 'manual', 'electric']

function telemetry(id: string, field: string, got: unknown) {
  const msg = `[normalizeScooter] scooter ${id} — missing/invalid ${field} (got: ${JSON.stringify(got)})`
  if (process.env.NODE_ENV === 'production') {
    console.error(msg)
  } else {
    console.warn(msg)
  }
}

function safeStringArray(val: unknown, id: string, field: string): string[] {
  if (Array.isArray(val)) return val.filter((v): v is string => typeof v === 'string')
  if (val !== null && val !== undefined) telemetry(id, field, val)
  return []
}

function safeSpecs(val: unknown, id: string): ScooterSpecs {
  let obj: Record<string, unknown> = {}

  if (val && typeof val === 'object' && !Array.isArray(val)) {
    obj = val as Record<string, unknown>
  } else if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        obj = parsed
      } else {
        telemetry(id, 'specs (parsed but not object)', val)
      }
    } catch {
      telemetry(id, 'specs (malformed JSON)', val)
    }
  } else if (val !== null && val !== undefined && val !== '') {
    telemetry(id, 'specs', val)
  }

  return {
    engine:      typeof obj.engine      === 'string' ? obj.engine      : '',
    power:       typeof obj.power       === 'string' ? obj.power       : '',
    fuelCapacity: typeof obj.fuelCapacity === 'string' ? obj.fuelCapacity : '',
    consumption: typeof obj.consumption === 'string' ? obj.consumption : '',
    weight:      typeof obj.weight      === 'string' ? obj.weight      : '',
    storage:     typeof obj.storage     === 'string' ? obj.storage     : '',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeScooter(row: any): Scooter {
  const id = row.id ?? 'unknown'

  // Telemetry — emit for every bad field so data quality is visible in Vercel logs
  if (row.price_per_day == null) telemetry(id, 'price_per_day', row.price_per_day)
  if (!row.name) telemetry(id, 'name', row.name)
  if (!Array.isArray(row.images) || row.images.length === 0) telemetry(id, 'images', row.images)
  if (!row.category || !VALID_CATEGORIES.includes(row.category)) {
    telemetry(id, 'category', row.category)
  }
  if (row.shop_id && !row.shops) {
    telemetry(id, 'shop (orphaned — shop_id set but shops join returned null)', row.shop_id)
  }

  const category: ScooterCategory = VALID_CATEGORIES.includes(row.category as ScooterCategory)
    ? (row.category as ScooterCategory)
    : 'automatic'

  const images = safeStringArray(row.images, id, 'images')

  // Prefer shop coordinates (set via map pin picker), then scooter coords,
  // then zone centre, then Phuket island centre.
  // Use || not ?? so that 0-values (invalid coords) also fall through.
  const lat = row.shops?.lat || row.lat || getZoneForLocation(row.location ?? '')?.lat || 7.9519
  const lng = row.shops?.lng || row.lng || getZoneForLocation(row.location ?? '')?.lng || 98.3381

  return {
    id,
    shopId: row.shop_id ?? '',
    shop: row.shops ? normalizeShop(row.shops) : undefined,
    name: row.name ?? 'Scooter',
    brand: row.brand ?? '',
    model: row.model ?? '',
    year: Number(row.year) || new Date().getFullYear(),
    category,
    images,
    coverImage: row.cover_image ?? null,
    pricePerDay: Number(row.price_per_day) || 0,
    pricePerWeek: row.price_per_week != null ? Number(row.price_per_week) : undefined,
    pricePerMonth: row.price_per_month != null ? Number(row.price_per_month) : undefined,
    currency: 'THB',
    location: row.location ?? '',
    lat,
    lng,
    available: Boolean(row.available),
    rating: Number(row.rating) || 0,
    reviewCount: Number(row.review_count) || 0,
    features: safeStringArray(row.features, id, 'features'),
    specs: safeSpecs(row.specs, id),
    deliveryAvailable: Boolean(row.delivery_available),
    deliveryFee: Number(row.delivery_fee) || 0,
    helmetIncluded: Boolean(row.helmet_included),
    insuranceIncluded: Boolean(row.insurance_included),
    minRentalDays: Number(row.min_rental_days) || 1,
    description: row.description ?? '',
    createdAt: row.created_at ?? undefined,
    showNewListingBadge: row.show_new_listing_badge ?? null,
    mileageRange: (row.mileage_range as MileageRange) ?? undefined,
    depositAmount: row.deposit_amount != null ? Number(row.deposit_amount) : undefined,
    depositType: (row.deposit_type as DepositType) ?? undefined,
    passportRequired: Boolean(row.passport_required),
    passportCopyAllowed: row.passport_copy_allowed !== false,
    isPremiumBike: Boolean(row.is_premium_bike),
    depositNotes: row.deposit_notes ?? undefined,
  }
}
