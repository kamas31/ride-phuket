import type { Shop, PlanType, OpeningHoursSchedule } from '@/types'
import { getZoneForLocation } from '@/lib/zones'

function telemetry(id: string, field: string, got: unknown) {
  const msg = `[normalizeShop] shop ${id} — missing/invalid ${field} (got: ${JSON.stringify(got)})`
  if (process.env.NODE_ENV === 'production') {
    console.error(msg)
  } else {
    console.warn(msg)
  }
}

function safeArray(val: unknown, id: string, field: string): string[] {
  if (Array.isArray(val)) return val.filter((v): v is string => typeof v === 'string')
  if (val !== null && val !== undefined) telemetry(id, field, val)
  return []
}

function safeOpeningHours(val: unknown, id: string): OpeningHoursSchedule | undefined {
  if (!val) return undefined
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as OpeningHoursSchedule
    }
    telemetry(id, 'opening_hours', val)
    return undefined
  } catch {
    telemetry(id, 'opening_hours (malformed JSON)', val)
    return undefined
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeShop(row: any): Shop {
  const id = row.id ?? 'unknown'

  if (!row.name) telemetry(id, 'name', row.name)
  if (row.verified == null) telemetry(id, 'verified', row.verified)

  return {
    id,
    name: row.name ?? 'Shop',
    slug: row.slug ?? id,
    description: row.description ?? '',
    logo: row.logo_url ?? '',
    location: row.location ?? '',
    address: row.address ?? '',
    lat: Number(row.lat) || (getZoneForLocation(row.location ?? '')?.lat ?? 7.9519),
    lng: Number(row.lng) || (getZoneForLocation(row.location ?? '')?.lng ?? 98.3381),
    rating: Number(row.rating) || 0,
    reviewCount: Number(row.review_count) || 0,
    verified: Boolean(row.verified),
    responseTime: row.response_time ?? '< 15 min',
    phone: row.phone ?? '',
    whatsapp: row.whatsapp ?? undefined,
    coverImage: row.cover_image ?? null,
    deliveryZones: safeArray(row.delivery_zones, id, 'delivery_zones'),
    openingHours: safeOpeningHours(row.opening_hours, id),
    instagram: row.instagram ?? undefined,
    website: row.website ?? undefined,
    lineId: row.line_id ?? undefined,
    telegram: row.telegram ?? undefined,
    googleMapsLink: row.google_maps_link ?? undefined,
    gallery: safeArray(row.gallery, id, 'gallery'),
    depositProtectedMember: Boolean(row.deposit_protected_member),
    planType: (row.plan_type as PlanType) ?? 'founding_partner',
    locationVisibility: (row.location_visibility as 'exact' | 'approximate') ?? 'exact',
    showOpeningHours: row.show_opening_hours !== false,
  }
}
