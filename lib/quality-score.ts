// Listing quality scoring system.
// Scores are used internally for ranking — never exposed as raw numbers in UI.
// Future use: "Improve your listing" upsell flow, ranking boosts.

export interface ListingQualityInputs {
  photoCount:         number
  descriptionLength:  number  // character count
  hasEngine:          boolean // specs.engine is non-empty
  hasDeliveryInfo:    boolean // deliveryAvailable is explicitly set
  hasShopLogo:        boolean
  hasOpeningHours:    boolean
  isShopVerified:     boolean
  hasPricePerWeek:    boolean
  hasPricePerMonth:   boolean
}

// Returns 0–100.
export function computeListingQuality(i: ListingQualityInputs): number {
  let score = 0

  // Photos — highest conversion lever
  if (i.photoCount >= 1)  score += 10
  if (i.photoCount >= 3)  score += 15
  if (i.photoCount >= 5)  score += 15
  if (i.photoCount >= 8)  score += 10

  // Description
  if (i.descriptionLength > 50)  score += 10
  if (i.descriptionLength > 150) score += 10

  // Specs & pricing options
  if (i.hasEngine)                          score += 5
  if (i.hasDeliveryInfo)                    score += 5
  if (i.hasPricePerWeek || i.hasPricePerMonth) score += 5

  // Shop trust signals
  if (i.hasShopLogo)    score += 5
  if (i.hasOpeningHours) score += 5
  if (i.isShopVerified)  score += 5

  return Math.min(100, score)
}

// Returns actionable improvement tips ordered by impact (max 3).
export function getListingTips(i: ListingQualityInputs): string[] {
  const tips: string[] = []

  if (i.photoCount < 5)          tips.push('Add more photos — listings with 5+ get far more views')
  if (i.descriptionLength < 50)  tips.push('Write a description to help riders choose your scooter')
  if (!i.hasPricePerWeek)        tips.push('Add a weekly rate — most long-term renters look for this')
  if (!i.hasOpeningHours)        tips.push('Add opening hours to build trust with visitors')
  if (!i.hasShopLogo)            tips.push('Upload a shop logo for a more professional appearance')
  if (!i.isShopVerified)         tips.push('Complete verification to unlock the Verified badge')

  return tips.slice(0, 3)
}

// Simplified quality check for dashboard insights (uses fields available in fleet list).
export function quickListingCheck(scooter: {
  images: string[]
  available: boolean
}): { photoScore: number } {
  return {
    photoScore: scooter.images?.length ?? 0,
  }
}
