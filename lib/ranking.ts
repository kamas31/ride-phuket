// Marketplace ranking engine.
// All components that sort scooters or shops should consume these helpers —
// never hardcode sort logic elsewhere.
//
// Phase 1: organic signals only (views, leads, quality, recency)
// Phase 2: plan weight becomes meaningful (featured placement)
// Phase 3: manual boosts, auction-based slots

export interface ScooterRankSignals {
  views30d:          number   // scooter_view event count
  waClicks30d:       number   // whatsapp_click events for this scooter
  repeatVisitors30d: number   // sessions with 2+ events on this scooter
  listingQuality:    number   // 0–100 from computeListingQuality()
  planWeight:        number   // from PLAN_CAPABILITIES.priorityRankingWeight
  daysSinceCreated:  number   // recency signal
  isAvailable:       boolean
}

export interface ShopRankSignals {
  totalViews30d:       number
  totalWaClicks30d:    number
  fleetSize:           number
  avgListingQuality:   number  // 0–100 average across fleet
  planWeight:          number
  isVerified:          boolean
  responseTimeMinutes: number  // 0 = unknown
}

// Higher score = better rank in Explore / map ordering.
export function computeScooterScore(s: ScooterRankSignals): number {
  const recencyBonus = Math.max(0, 30 - s.daysSinceCreated) * 0.3  // up to 9pts

  return (
    s.views30d          * 1.0   +
    s.waClicks30d       * 8.0   +  // WhatsApp clicks are high-intent (8× a view)
    s.repeatVisitors30d * 4.0   +  // Return visitors signal buying intent
    s.listingQuality    * 0.3   +  // Max 30pts for perfect listing
    s.planWeight        * 15.0  +  // Phase 2: founding/premium = 22.5pts boost
    recencyBonus                +
    (s.isAvailable ? 20 : -50)     // Unavailable scooters sink to bottom
  )
}

export function computeShopScore(s: ShopRankSignals): number {
  // Faster responders earn up to 10 bonus points
  const responseBonus = s.responseTimeMinutes > 0
    ? Math.max(0, 10 - s.responseTimeMinutes / 6)
    : 0

  return (
    s.totalViews30d     * 0.5  +
    s.totalWaClicks30d  * 5.0  +
    s.fleetSize         * 2.0  +  // More inventory = higher match probability
    s.avgListingQuality * 0.2  +
    s.planWeight        * 15.0 +
    (s.isVerified ? 25 : 0)   +
    responseBonus
  )
}
