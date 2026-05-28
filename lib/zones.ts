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
  { key: 'patong',       name: 'Patong',       lat: 7.8956, lng: 98.2966, radiusKm: 2.5 },
  { key: 'kata',         name: 'Kata',         lat: 7.8203, lng: 98.2986, radiusKm: 2.0 },
  { key: 'karon',        name: 'Karon',        lat: 7.8347, lng: 98.2987, radiusKm: 1.8 },
  { key: 'rawai',        name: 'Rawai',        lat: 7.7781, lng: 98.3281, radiusKm: 2.2 },
  { key: 'bang tao',     name: 'Bang Tao',     lat: 8.0000, lng: 98.2900, radiusKm: 3.0 },
  { key: 'phuket town',  name: 'Phuket Town',  lat: 7.8804, lng: 98.3881, radiusKm: 2.0 },
  { key: 'kamala',       name: 'Kamala',       lat: 7.9476, lng: 98.2734, radiusKm: 1.5 },
  { key: 'surin',        name: 'Surin',        lat: 7.9714, lng: 98.2800, radiusKm: 1.5 },
]

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
