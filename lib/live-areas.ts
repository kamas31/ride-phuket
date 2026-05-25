// Single source of truth for live area/zone inventory.
// All area discovery UI (homepage, area pages, footer) must use these helpers.
// Never render area cards or prices from the static AREAS constant directly.

import { cache } from 'react'
import { getScooters } from '@/lib/supabase/queries'
import { AREAS } from '@/constants/areas'
import type { AreaMeta } from '@/constants/areas'
import type { Scooter } from '@/types'

export interface LiveArea extends AreaMeta {
  priceFrom: number   // real MIN(price_per_day) — never the static constant value
  // scooterCount intentionally omitted from the public type — never shown in UI
}

/**
 * Fetch all areas that have at least one available scooter.
 * priceFrom = real MIN(price_per_day) from live inventory.
 *
 * Wrapped in React.cache() — deduplicated within a single request, so calling
 * this from multiple server components on the same page (e.g. layout + page)
 * only hits the DB once.
 */
export const getLiveAreas = cache(async (): Promise<LiveArea[]> => {
  const scooters = await getScooters({ available: true })
  return computeLiveAreas(scooters)
})

/**
 * Derive live areas from a pre-fetched scooter list.
 * Use this when you already have allScooters in scope to avoid a second DB call.
 */
export function computeLiveAreas(scooters: Scooter[]): LiveArea[] {
  return AREAS
    .map(area => {
      const zone = scooters.filter(s =>
        s.location.toLowerCase().includes(area.name.toLowerCase())
      )
      if (zone.length === 0) return null
      const minPrice = Math.min(...zone.map(s => s.pricePerDay))
      return { ...area, priceFrom: minPrice }
    })
    .filter((a): a is LiveArea => a !== null)
}

/**
 * Real minimum price for a single area from a pre-fetched scooter list.
 * Returns null when the area has no inventory (caller should hide the price).
 */
export function getAreaMinPrice(scooters: Scooter[], areaName: string): number | null {
  const zone = scooters.filter(s =>
    s.location.toLowerCase().includes(areaName.toLowerCase())
  )
  if (!zone.length) return null
  return Math.min(...zone.map(s => s.pricePerDay))
}
