// ─────────────────────────────────────────────────────────────────────────────
// Phuket Zone System
//
// Anti-disintermediation: zones protect shop identity by replacing exact
// locations with approximate area anchors. Riders see which zone a scooter
// is in, never the precise shop address.
//
// Zone data is used for:
//   - Map coordinate anonymisation (ScooterMap)
//   - Shop alias generation (pre-booking display)
//   - Zone circle overlays (map background)
// ─────────────────────────────────────────────────────────────────────────────

export interface PhuketZone {
  key: string
  name: string          // Display name
  lat: number           // Zone centre latitude
  lng: number           // Zone centre longitude
  radiusKm: number      // Approximate radius for circle overlay
}

export const PHUKET_ZONES: PhuketZone[] = [
  // ── Primary rental zones (form dropdown options) ──────────────────────────
  // Coordinates manually calibrated for visual alignment above native Mapbox labels.
  { key: 'patong',       name: 'Patong',       lat: 7.8976, lng: 98.2991, radiusKm: 2.5 },
  // kata noi MUST appear before kata — 'kata noi'.includes('kata') is true
  { key: 'kata noi',     name: 'Kata Noi',     lat: 7.8106, lng: 98.3004, radiusKm: 1.0 },
  { key: 'kata',         name: 'Kata',         lat: 7.8232, lng: 98.2982, radiusKm: 2.0 },
  { key: 'karon',        name: 'Karon',        lat: 7.8505, lng: 98.2982, radiusKm: 1.8 },
  { key: 'rawai',        name: 'Rawai',        lat: 7.7777, lng: 98.3280, radiusKm: 2.2 },
  { key: 'bang tao',     name: 'Bang Tao',     lat: 7.9818, lng: 98.2947, radiusKm: 3.0 },
  { key: 'phuket town',  name: 'Phuket Town',  lat: 7.8883, lng: 98.3886, radiusKm: 2.0 },
  { key: 'kamala',       name: 'Kamala',       lat: 7.9518, lng: 98.2829, radiusKm: 1.5 },
  { key: 'surin',        name: 'Surin',        lat: 7.9778, lng: 98.2801, radiusKm: 1.5 },
  // ── Extended zones (AREAS coverage) ──────────────────────────────────────
  { key: 'chalong',      name: 'Chalong',      lat: 7.8503, lng: 98.3344, radiusKm: 3.0 },
  { key: 'nai harn',     name: 'Nai Harn',     lat: 7.7787, lng: 98.3056, radiusKm: 1.5 },
  { key: 'cherng talay', name: 'Cherng Talay', lat: 7.9922, lng: 98.3066, radiusKm: 2.0 },
  { key: 'mai khao',     name: 'Mai Khao',     lat: 8.1283, lng: 98.3080, radiusKm: 3.5 },
  { key: 'thalang',      name: 'Thalang',      lat: 8.0316, lng: 98.3335, radiusKm: 2.5 },
  { key: 'cape panwa',   name: 'Cape Panwa',   lat: 7.8070, lng: 98.4052, radiusKm: 2.0 },
  { key: 'ko sirey',     name: 'Ko Sirey',     lat: 7.8870, lng: 98.4270, radiusKm: 1.5 },
  // ── Added 2026-06-21 (ADR-047): official zone expansion ─────────────────
  { key: 'kathu',        name: 'Kathu',        lat: 7.9106, lng: 98.3382, radiusKm: 2.0 },
]

/** Find the nearest zone to a lat/lng coordinate (squared Euclidean — sufficient at Phuket scale) */
export function getNearestZone(lat: number, lng: number): PhuketZone {
  return PHUKET_ZONES.reduce((nearest, zone) => {
    const d  = (lat - zone.lat) ** 2 + (lng - zone.lng) ** 2
    const nd = (lat - nearest.lat) ** 2 + (lng - nearest.lng) ** 2
    return d < nd ? zone : nearest
  })
}

/** Find the zone for a scooter location string */
export function getZoneForLocation(location: string): PhuketZone | null {
  const loc = location.toLowerCase()
  return PHUKET_ZONES.find(z => loc.includes(z.key)) ?? null
}

/** Zone centre + deterministic jitter from scooter ID.
 *  Always returns an anonymised position — never the real shop coordinates.
 *  Deterministic so positions are stable across renders. */
export function anonymiseCoords(
  scooterId: string,
  location: string,
): { lat: number; lng: number } {
  const zone = getZoneForLocation(location)
  const base = zone
    ? { lat: zone.lat, lng: zone.lng }
    : { lat: 7.9519, lng: 98.3381 }   // Phuket island centre

  // Simple hash from scooter ID → stable but non-predictable offsets
  const h = simpleHash(scooterId)
  const latOff = ((h % 9) - 4) * 0.0020        // ± ~220m
  const lngOff = (((h >> 4) % 9) - 4) * 0.0020

  return { lat: base.lat + latOff, lng: base.lng + lngOff }
}

function simpleHash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

// ── Shop alias ────────────────────────────────────────────────────────────────
//
// Pre-booking: show "Rawai Scooter Rental" instead of the real shop name.
// This prevents riders from searching the shop directly offline.
// Post-booking: the real name, WhatsApp, and phone are revealed.

export function getShopAlias(shop: {
  location: string
  verified?: boolean
  reviewCount?: number
}): string {
  const zone = getZoneForLocation(shop.location)
  const area = zone ? zone.name : (shop.location.split(',')[0] ?? shop.location).trim()

  return `${area} Scooter Rental`
}

// ── GeoJSON zone circle (32-vertex polygon) ───────────────────────────────────
// Used by ScooterMap to draw zone boundary overlays.

export function zoneCircleGeoJSON(zone: PhuketZone): GeoJSON.Polygon {
  const pts: [number, number][] = []
  const latFactor = zone.radiusKm / 111
  const lngFactor = zone.radiusKm / (111 * Math.cos(zone.lat * (Math.PI / 180)))

  for (let i = 0; i <= 32; i++) {
    const angle = (i / 32) * 2 * Math.PI
    pts.push([
      zone.lng + lngFactor * Math.sin(angle),
      zone.lat + latFactor * Math.cos(angle),
    ])
  }
  return { type: 'Polygon', coordinates: [pts] }
}

export type { PhuketZone as Zone }
