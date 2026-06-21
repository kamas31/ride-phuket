// Live price range for a model page — never hand-roll this per page.
// Mirrors lib/live-areas.ts: real MIN/MAX(price_per_day) from already-fetched scooters,
// never a static/guessed value.

import type { Scooter } from '@/types'

export interface ModelPriceRange {
  min: number
  max: number
}

/**
 * Real min/max day price across a pre-fetched, already-model-filtered scooter list.
 * Returns null when there's no live inventory (caller must hide the price, not fake one).
 */
export function getLiveModelPriceRange(scooters: Scooter[]): ModelPriceRange | null {
  if (!scooters.length) return null
  const prices = scooters.map(s => s.pricePerDay).filter(p => p > 0)
  if (!prices.length) return null
  return { min: Math.min(...prices), max: Math.max(...prices) }
}
