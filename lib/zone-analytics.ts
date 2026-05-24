// Zone/area intelligence — types and infrastructure.
// Computation layer is not yet implemented; defines the data shape we want
// to collect as event volume grows.

export interface ZoneLeadMetrics {
  zone: string           // e.g. "rawai", "patong"
  views: number
  waClicks: number
  phoneClicks: number
  conversionRate: number // 0-100
  periodDays: number
}

export interface ZoneScooterPreference {
  zone: string
  topCategory: string    // e.g. "automatic", "semi-auto"
  topBrand: string | null
  avgPricePoint: number  // avg price of scooters that received contacts
}

export interface ZoneIntelligenceReport {
  zone: string
  leadMetrics: ZoneLeadMetrics
  preferences: ZoneScooterPreference
  generatedAt: string    // ISO date
}

export type ZoneCompetitivePosition = 'top' | 'average' | 'below_average' | 'unknown'
