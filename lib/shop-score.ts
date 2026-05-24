// Shop quality scoring — 0-100.
// Used for ranking and private partner insights.
// Never expose raw numbers in UI.
//
// TODO (future): incorporate response-rate signals from lib/response-rate.ts
// TODO (future): factor in repeat-customer rate when that data is tracked

export interface ShopScoreInput {
  isVerified:           boolean
  isActive:             boolean
  hasLogo:              boolean
  hasCoverImage:        boolean
  hasDescription:       boolean
  descriptionLength:    number
  hasPhone:             boolean
  hasWhatsApp:          boolean
  hasAddress:           boolean
  hasOpeningHours:      boolean
  hasGallery:           boolean
  scooterCount:         number
  availableScooterCount: number
  avgScooterPhotoCount:  number   // average photos per scooter
  recentActivityDays:    number   // days since last recorded event or scooter update
}

export interface ShopScoreBreakdown {
  total:             number   // 0–100
  completenessScore: number
  activityScore:     number
  fleetScore:        number
  trustScore:        number
}

export interface ShopCompletenessItem {
  label:  string
  done:   boolean
  impact: 'high' | 'medium' | 'low'
}

// ── Sub-scores ────────────────────────────────────────────────────────────────

function completeness(i: ShopScoreInput): number {
  let s = 0
  if (i.hasLogo)                                              s += 8
  if (i.hasCoverImage)                                        s += 8
  if (i.hasWhatsApp)                                          s += 8
  if (i.hasDescription && i.descriptionLength > 80)          s += 8
  if (i.hasOpeningHours)                                      s += 8
  if (i.hasAddress)                                           s += 5
  if (i.hasPhone)                                             s += 5
  if (i.hasGallery)                                           s += 6
  return Math.min(56, s)
}

function activity(i: ShopScoreInput): number {
  const d = i.recentActivityDays
  if (d <=  7) return 16
  if (d <= 30) return 12
  if (d <= 60) return  6
  if (d <= 90) return  2
  return 0
}

function fleet(i: ShopScoreInput): number {
  let s = 0
  if (i.scooterCount >= 1)            s += 4
  if (i.scooterCount >= 3)            s += 4
  if (i.scooterCount >= 5)            s += 4
  if (i.availableScooterCount > 0)    s += 4
  if (i.avgScooterPhotoCount >= 5)    s += 4
  return Math.min(20, s)
}

function trust(i: ShopScoreInput): number {
  return (
    (i.isVerified  ?  6 : 0) +
    (!i.hasWhatsApp ? -6 : 0)  // WhatsApp is the primary contact channel
  )
}

// ── Public API ────────────────────────────────────────────────────────────────

export function computeShopQualityScore(i: ShopScoreInput): ShopScoreBreakdown {
  const completenessScore = completeness(i)
  const activityScore     = activity(i)
  const fleetScore        = fleet(i)
  const trustScore        = trust(i)
  const total             = Math.max(0, Math.min(100, completenessScore + activityScore + fleetScore + trustScore))
  return { total, completenessScore, activityScore, fleetScore, trustScore }
}

/** Returns incomplete items ordered by impact, highest-impact undone items first */
export function getShopCompleteness(i: ShopScoreInput): ShopCompletenessItem[] {
  const items: ShopCompletenessItem[] = [
    { label: 'Upload a shop logo',     done: i.hasLogo,                                  impact: 'high'   },
    { label: 'Add cover photo',        done: i.hasCoverImage,                            impact: 'high'   },
    { label: 'Add WhatsApp number',    done: i.hasWhatsApp,                              impact: 'high'   },
    { label: 'Write shop description', done: i.hasDescription && i.descriptionLength > 80, impact: 'medium' },
    { label: 'Set opening hours',      done: i.hasOpeningHours,                          impact: 'medium' },
    { label: 'Add shop address',       done: i.hasAddress,                               impact: 'medium' },
    { label: 'Add gallery photos',     done: i.hasGallery,                               impact: 'low'    },
  ]

  const impactOrder = { high: 0, medium: 1, low: 2 }
  return items.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return impactOrder[a.impact] - impactOrder[b.impact]
  })
}
