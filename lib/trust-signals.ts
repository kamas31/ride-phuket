// Trust Signal Engine V1 — Koh Ride Marketplace Trust Layer.
//
// Generates soft, POSITIVE trust signals from observable shop/scooter data.
// No scores, no ratings, no negative states.
//
// Philosophy:
//   Small independent renters are as valuable as big shops.
//   Signals must never shame, downgrade, or punish anyone.
//   Every signal is a reassurance to the rider, not a grade for the shop.
//
// Future hooks (V2):
//   - 'top_partner'       → response rate > threshold + verified + active
//   - 'deposit_protected' → enrolled in Koh Ride Deposit Protection
//   - 'fast_responder'    → average reply time < 10 min (from WA event timestamps)
//   - 'repeat_favorite'   → repeat visitor rate > zone average
//   - 'seasonal_popular'  → high-season demand surge detection
//   - 'shop_anniversary'  → 1-year + milestone recognition

import type { Shop, Scooter } from '@/types'
import { daysSince } from '@/lib/analytics-periods'

export type TrustTone = 'neutral' | 'positive' | 'accent'

export type TrustSignalId =
  | 'local_partner'
  | 'active_recently'
  | 'fresh_inventory'
  | 'responds_promptly'
  | 'verified_contact'
  | 'complete_profile'
  | 'real_photos'
  | 'established'
  | 'returning_visitors'
  | 'wide_selection'
  | 'auto_available'
  | 'deposit_protected'

export interface TrustSignal {
  id:       TrustSignalId
  label:    string
  icon:     string    // AppIconName key
  tone:     TrustTone
  priority: number    // lower = shown first
}

export interface TrustSignalInput {
  shop: Pick<Shop,
    'id' | 'verified' | 'phone' | 'whatsapp' | 'description' | 'address' |
    'logo' | 'openingHours' | 'gallery' | 'depositProtectedMember' | 'responseTime'
  > & { createdAt?: string }

  scooters: Pick<Scooter, 'images' | 'category' | 'createdAt' | 'available'>[]

  // Optional — pass analytics if available (shop page can omit for speed)
  analytics?: {
    whatsappClicksLast7d: number
    repeatVisitors:       number
  } | null
}

// ── Generators ────────────────────────────────────────────────────────────────

function activitySignals({ shop, scooters, analytics }: TrustSignalInput): TrustSignal[] {
  const out: TrustSignal[] = []

  // Analytics-based activity (only when data is provided)
  if (analytics && analytics.whatsappClicksLast7d > 0) {
    out.push({ id: 'active_recently', label: 'Active this week', icon: 'zap', tone: 'positive', priority: 10 })
  }

  // Fresh inventory — scooter added within last 14 days
  const hasFreshScooter = scooters.some(s => s.createdAt && daysSince(s.createdAt) <= 14)
  if (hasFreshScooter) {
    out.push({ id: 'fresh_inventory', label: 'Recently added scooters', icon: 'zap', tone: 'positive', priority: 20 })
  }

  // Prompt response time (from shop-declared field, not analytics)
  if (shop.responseTime && /< ?(5|10|15|30)\s*min/i.test(shop.responseTime)) {
    out.push({ id: 'responds_promptly', label: 'Responds promptly', icon: 'clock', tone: 'neutral', priority: 30 })
  }

  return out
}

function profileSignals({ shop, scooters }: TrustSignalInput): TrustSignal[] {
  const out: TrustSignal[] = []

  // Verified contact info — both channels present
  if (shop.phone && shop.whatsapp) {
    out.push({ id: 'verified_contact', label: 'Verified contact info', icon: 'check_circle', tone: 'positive', priority: 15 })
  }

  // Complete business profile — description + address + hours + logo all present
  const hasLogo = typeof shop.logo === 'string' && shop.logo.length > 0
  const isComplete = !!(
    shop.description && shop.description.length > 50 &&
    shop.address     && shop.address.length > 0 &&
    shop.openingHours &&
    hasLogo
  )
  if (isComplete) {
    out.push({ id: 'complete_profile', label: 'Complete business profile', icon: 'check_circle', tone: 'neutral', priority: 40 })
  }

  // Real scooter photos — majority of scooters have 4+ photos
  if (scooters.length > 0) {
    const photoRich = scooters.filter(s => (s.images?.length ?? 0) >= 4)
    if (photoRich.length / scooters.length >= 0.5) {
      out.push({ id: 'real_photos', label: 'Real scooter photos', icon: 'camera', tone: 'neutral', priority: 45 })
    }
  }

  return out
}

function marketplaceSignals({ shop, analytics }: TrustSignalInput): TrustSignal[] {
  const out: TrustSignal[] = []

  // Deposit protection (highest priority if enrolled)
  if (shop.depositProtectedMember) {
    out.push({ id: 'deposit_protected', label: 'Deposit Protected', icon: 'shield_check', tone: 'accent', priority: 5 })
  }

  // Trusted by returning visitors (analytics-based)
  if (analytics && analytics.repeatVisitors >= 3) {
    out.push({ id: 'returning_visitors', label: 'Trusted by returning visitors', icon: 'heart', tone: 'positive', priority: 12 })
  }

  // Established — account older than 90 days
  if (shop.createdAt && daysSince(shop.createdAt) >= 90) {
    out.push({ id: 'established', label: 'Established on Koh Ride', icon: 'shield', tone: 'neutral', priority: 70 })
  }

  // Always show local partner as a reassuring baseline
  out.push({ id: 'local_partner', label: 'Local Phuket rental partner', icon: 'pin', tone: 'neutral', priority: 80 })

  return out
}

function fleetSignals({ scooters }: TrustSignalInput): TrustSignal[] {
  const out: TrustSignal[] = []
  const available = scooters.filter(s => s.available)

  if (available.length >= 5) {
    out.push({ id: 'wide_selection', label: 'Wide scooter selection', icon: 'bike', tone: 'neutral', priority: 60 })
  }

  if (scooters.some(s => s.category === 'automatic' && s.available)) {
    out.push({ id: 'auto_available', label: 'Automatic scooters available', icon: 'bike', tone: 'neutral', priority: 65 })
  }

  return out
}

// ── Public API ────────────────────────────────────────────────────────────────

/** All applicable signals, sorted by priority (most relevant first) */
export function getTrustSignals(input: TrustSignalInput): TrustSignal[] {
  return [
    ...marketplaceSignals(input),
    ...activitySignals(input),
    ...profileSignals(input),
    ...fleetSignals(input),
  ].sort((a, b) => a.priority - b.priority)
}

/**
 * 1-2 primary signals for the scooter detail page sidebar.
 * Favours signals that increase conversion confidence.
 */
export function getPrimaryTrustSignals(input: TrustSignalInput): TrustSignal[] {
  const all = getTrustSignals(input)
  const preferred: TrustSignalId[] = [
    'deposit_protected',
    'active_recently',
    'returning_visitors',
    'verified_contact',
    'responds_promptly',
    'established',
    'local_partner',
  ]
  return [...all]
    .sort((a, b) => {
      const ai = preferred.indexOf(a.id)
      const bi = preferred.indexOf(b.id)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
    .slice(0, 2)
}
