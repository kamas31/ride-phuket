// Response rate signals — types for future shop quality scoring.
// Not yet tracked; defines the data shape we want to collect.

export type ResponseSpeedLevel = 'instant' | 'fast' | 'standard' | 'slow' | 'unknown'

export interface ResponseRateSignals {
  shopId:              string
  claimedResponseTime: string | null   // from shop.responseTime field
  speedLevel:          ResponseSpeedLevel
}

export interface WhatsAppEngagementSignal {
  shopId:          string
  hasWhatsApp:     boolean
  waClicksLast30d: number
}

export interface InventoryFreshnessSignal {
  shopId:          string
  scooterCount:    number
  lastUpdated:     string | null   // ISO date of last scooter edit
  recentlyActive:  boolean         // updated within 30 days
}

export interface LeadHandlingQuality {
  shopId: string
  score:  number                   // 0-100
  signals: {
    responseRate:    ResponseSpeedLevel
    hasWhatsApp:     boolean
    inventoryFresh:  boolean
    hasPhotos:       boolean
    isVerified:      boolean
  }
}

export function computeResponseSpeedLevel(responseTime: string | null | undefined): ResponseSpeedLevel {
  if (!responseTime) return 'unknown'
  if (/< ?(5)\s*min/i.test(responseTime))     return 'instant'
  if (/< ?(10|15)\s*min/i.test(responseTime)) return 'fast'
  if (/< ?(30|60)\s*min/i.test(responseTime)) return 'standard'
  return 'slow'
}
