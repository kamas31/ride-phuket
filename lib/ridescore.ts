// Central RideScore ranking engine.
// Single source of truth for all marketplace ranking decisions.
// ALL weight tuning lives in SCORE_WEIGHTS — never scatter magic numbers elsewhere.
//
// Architecture:
//   computeRideScore()      → full score, requires analytics data (server-side)
//   computeRideScoreProxy() → quality proxy, uses Scooter type only (client-side Explore)
//   sortByRecommended()     → stable sort helper for Explore grid
//
// Phase 1: organic signals only (quality, freshness, engagement)
// Phase 2: plan weight → premiumBoostMultiplier becomes meaningful
// Phase 3: manual boosts, auction-based featured slots
//
// TODO (Phase 2): wire premiumBoostMultiplier from shop plan_type
// TODO (future):  seasonal ranking (high vs low tourist season)
// TODO (future):  geographic conversion intelligence (zone × category affinity)
// TODO (future):  fake lead detection / fraud signals
// TODO (future):  AI image quality scoring
// TODO (future):  shop response quality integration

import type { Scooter } from '@/types'

// ── Centralized weights ───────────────────────────────────────────────────────
// Future product team: tune marketplace behaviour from this single table.

export const SCORE_WEIGHTS = {
  // Engagement signals (per event over the analytics period)
  whatsappLead:     8,   // strongest buyer-intent signal
  phoneLead:        6,
  scooterView:      1,
  repeatVisitor:    3,

  // Trust signals (flat bonuses)
  verifiedShop:     12,
  depositProtected:  5,

  // Listing quality — photos are the #1 conversion lever
  photos5plus:      12,
  photos3to4:        6,
  photos1to2:       -5,
  photos0:         -15,

  // Listing completeness
  hasDescription:    5,
  hasEngineSpec:     3,
  hasPricePerWeek:   4,

  // Freshness — keeps marketplace feeling alive
  fresh7d:           8,   // edited / created within 7 days
  fresh30d:          0,   // neutral
  stale46d:         -6,   // 31–45 days without update
  stale90d:        -12,   // 46–90 days
  stale90dPlus:    -20,   // >90 days

  // Availability
  available:        20,
  unavailable:     -30,   // sinks unavailable listings — they still exist, just rank low

  // Conversion quality bonus (dampened by confidence at low volume)
  highConversionBonus: 10,  // >20% conversion when confidence is sufficient

  // Underperforming penalty (private signal — not shown publicly)
  underperformingPenalty: -10,  // >150 views, zero contacts

  // Premium boost (Phase 2 placeholder)
  premiumBoostMultiplier: 1,    // default multiplier — unused in Phase 1
} as const

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RideScoreInput {
  // Analytics signals (zero when not available)
  views:            number
  waClicks:         number
  phoneClicks:      number
  repeatVisitors:   number

  // Listing data
  photoCount:       number
  descriptionLength: number
  hasEngine:        boolean
  hasPricePerWeek:  boolean
  isAvailable:      boolean

  // Freshness (days since last relevant update)
  daysSinceUpdated: number

  // Trust
  isVerified:          boolean
  isDepositProtected:  boolean

  // Phase 2 placeholder — default to 1, not yet wired to plan
  premiumBoostMultiplier?: number
}

export interface RideScoreBreakdown {
  total:            number
  engagementScore:  number
  conversionScore:  number
  freshnessScore:   number
  qualityScore:     number
  trustScore:       number
  premiumBoostMultiplier: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Confidence multiplier for conversion score based on view volume.
 * Prevents a listing with 1 view + 1 click from gaming the ranking.
 * Full confidence only above 50 views.
 */
function conversionConfidence(views: number): number {
  if (views < 5)  return 0.0
  if (views < 20) return (views - 5) / 15 * 0.5          // 0 → 0.5
  if (views < 50) return 0.5 + (views - 20) / 30 * 0.5  // 0.5 → 1.0
  return 1.0
}

function freshnessScore(daysSinceUpdated: number): number {
  const d = daysSinceUpdated
  if (d <= 7)  return SCORE_WEIGHTS.fresh7d
  if (d <= 30) return SCORE_WEIGHTS.fresh30d
  if (d <= 45) return SCORE_WEIGHTS.stale46d
  if (d <= 90) return SCORE_WEIGHTS.stale90d
  return SCORE_WEIGHTS.stale90dPlus
}

function photoScore(count: number): number {
  if (count === 0) return SCORE_WEIGHTS.photos0
  if (count <= 2)  return SCORE_WEIGHTS.photos1to2
  if (count <= 4)  return SCORE_WEIGHTS.photos3to4
  return SCORE_WEIGHTS.photos5plus
}

// ── Core scoring ──────────────────────────────────────────────────────────────

export function computeRideScore(input: RideScoreInput): RideScoreBreakdown {
  const w     = SCORE_WEIGHTS
  const boost = input.premiumBoostMultiplier ?? 1

  const engagementScore = (
    input.views          * w.scooterView  +
    input.waClicks       * w.whatsappLead +
    input.phoneClicks    * w.phoneLead    +
    input.repeatVisitors * w.repeatVisitor
  )

  const contacts       = input.waClicks + input.phoneClicks
  const convRate       = input.views > 0 ? contacts / input.views : 0
  const confidence     = conversionConfidence(input.views)
  const isHighConv     = convRate >= 0.2
  const isUnderperform = input.views >= 150 && contacts === 0
  const conversionScore = (
    (isHighConv ? w.highConversionBonus : 0) * confidence +
    (isUnderperform ? w.underperformingPenalty : 0)
  )

  const fScore = freshnessScore(input.daysSinceUpdated)

  const qualityScore = (
    photoScore(input.photoCount) +
    (input.descriptionLength > 50 ? w.hasDescription : 0) +
    (input.hasEngine               ? w.hasEngineSpec  : 0) +
    (input.hasPricePerWeek        ? w.hasPricePerWeek : 0) +
    (input.isAvailable             ? w.available      : w.unavailable)
  )

  const trustScore = (
    (input.isVerified         ? w.verifiedShop      : 0) +
    (input.isDepositProtected ? w.depositProtected   : 0)
  )

  const raw   = engagementScore + conversionScore + fScore + qualityScore + trustScore
  const total = Math.round(raw * boost)

  return {
    total,
    engagementScore:  Math.round(engagementScore),
    conversionScore:  Math.round(conversionScore),
    freshnessScore:   Math.round(fScore),
    qualityScore:     Math.round(qualityScore),
    trustScore:       Math.round(trustScore),
    premiumBoostMultiplier: boost,
  }
}

/**
 * Lightweight proxy score for client-side Explore sorting.
 * Uses only Scooter type fields — no analytics required.
 * Produces stable, quality-based ranking that degrades gracefully on low traffic.
 *
 * This is intentionally NOT the full RideScore — it's a listing quality signal only.
 * When analytics are attached to the Scooter type (Phase 2), this will be enriched.
 */
export function computeRideScoreProxy(scooter: Scooter): number {
  const w = SCORE_WEIGHTS

  const photoCount     = scooter.images?.length ?? 0
  const pScore         = photoScore(photoCount)

  const daysSince      = scooter.createdAt
    ? Math.floor((Date.now() - new Date(scooter.createdAt).getTime()) / 86_400_000)
    : 9999
  const fScore         = freshnessScore(daysSince)

  const availScore     = scooter.available ? w.available : w.unavailable

  const tScore         = (
    (scooter.shop?.verified               ? w.verifiedShop      : 0) +
    (scooter.shop?.depositProtectedMember ? w.depositProtected   : 0)
  )

  const qScore         = (
    pScore +
    availScore +
    ((scooter.description?.length ?? 0) > 50 ? w.hasDescription : 0) +
    (scooter.specs?.engine                    ? w.hasEngineSpec  : 0) +
    (scooter.pricePerWeek                     ? w.hasPricePerWeek : 0)
  )

  // Light social proof: reviews are real evidence of prior contacts
  const reviewBonus    = Math.min(8, (scooter.reviewCount ?? 0) * 0.8)

  // Minimal contact-info boost — complete shops are marginally better to surface
  // This is intentionally tiny: we never want to penalise shops without both channels
  const contactBoost   = (scooter.shop?.whatsapp ? 2 : 0) + (scooter.shop?.phone ? 1 : 0)

  return Math.round(fScore + qScore + tScore + reviewBonus + contactBoost)
}

/** Sort a scooter array by recommended (proxy RideScore), highest first */
export function sortByRecommended(scooters: Scooter[]): Scooter[] {
  return [...scooters].sort((a, b) => {
    const aPos = a.explorePosition ?? Infinity
    const bPos = b.explorePosition ?? Infinity
    // Pinned scooters first, ascending by position number
    if (aPos !== bPos) return aPos - bPos
    // Among unpinned (both Infinity): fall back to score
    return computeRideScoreProxy(b) - computeRideScoreProxy(a)
  })
}

// Deterministic seeded PRNG (Lehmer/Park-Miller). Given the same seed it
// always produces the same sequence — used so the default Explore shuffle
// is stable within a session (one seed generated per page load) without
// depending on Math.random() during the sort itself.
function seededRandom(seed: number): () => number {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 48271) % 2147483647
    return (s - 1) / 2147483646
  }
}

/**
 * Default Explore ordering (no active filters/search/sort): admin-pinned
 * scooters (explore_position) stay on top, ascending by position, exactly
 * as in sortByRecommended(). Everyone else is shuffled with a seeded PRNG
 * instead of ranked by computeRideScoreProxy(), so the same handful of
 * high-scoring listings don't always appear first. Pass a fresh seed per
 * page session (e.g. generated once via useState) to keep the order stable
 * while the user browses, but different across visits.
 */
export function shuffleUnpinned(scooters: Scooter[], seed: number): Scooter[] {
  const pinned = scooters
    .filter(s => s.explorePosition != null)
    .sort((a, b) => (a.explorePosition as number) - (b.explorePosition as number))
  const unpinned = scooters.filter(s => s.explorePosition == null)

  const rand = seededRandom(seed)
  const shuffled = [...unpinned]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return [...pinned, ...shuffled]
}
