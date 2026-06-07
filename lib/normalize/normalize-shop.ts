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
// Tolerance for zone-centre detection: 0.0001° ≈ 11m.
// The form auto-fills zone-centre coords (4 decimal places) when the owner selects
// an area. A real GPS pin placed via the picker will virtually never land exactly on
// the zone centre. Shops within this tolerance are treated as TYPE 3 (no precise pin).
const ZONE_CENTRE_EPS = 0.0001

export function normalizeShop(row: any): Shop {
  const id = row.id ?? 'unknown'

  if (!row.name) telemetry(id, 'name', row.name)
  if (row.verified == null) telemetry(id, 'verified', row.verified)

  const rawLat = Number(row.lat) || 0
  const rawLng = Number(row.lng) || 0
  const zone   = getZoneForLocation(row.location ?? '')

  // hasPrecisePin: the owner has explicitly placed a pin that is NOT the zone default.
  // false when:  no coords at all  OR  coords match the auto-filled zone centre exactly.
  const hasPrecisePin = rawLat !== 0 && rawLng !== 0 && (
    !zone ||
    Math.abs(rawLat - zone.lat) > ZONE_CENTRE_EPS ||
    Math.abs(rawLng - zone.lng) > ZONE_CENTRE_EPS
  )

  return {
    id,
    ownerId: row.owner_id ?? null,
    name: row.name ?? 'Shop',
    slug: row.slug ?? id,
    description: row.description ?? '',
    logo: row.logo_url ?? '',
    location: row.location ?? '',
    address: row.address ?? '',
    lat: rawLat || (zone?.lat ?? 7.9519),
    lng: rawLng || (zone?.lng ?? 98.3381),
    rating: Number(row.rating) || 0,
    reviewCount: Number(row.review_count) || 0,
    verified: Boolean(row.verified),
    responseTime: row.response_time ?? '< 15 min',
    phone: row.phone ?? '',
    whatsapp: row.whatsapp ?? undefined,
    coverImage: row.cover_image ?? null,
    mobileBanner: row.mobile_banner ?? null,
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
    hasPrecisePin,
    showOpeningHours: row.show_opening_hours !== false,
  }
}
