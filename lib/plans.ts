// Single source of truth for shop plans, capabilities, and limits.
// ALL UI that gates features should consume helpers from this file —
// never hardcode conditions directly in components.
//
// Phase 1 (now):  founding_partner = everything unlocked, no paywalls
// Phase 2 (later): soft differentiation, featured placement
// Phase 3 (later): hard limits, tiered visibility

import type { PlanType } from '@/types'

export interface PlanCapabilities {
  maxScooters: number           // Infinity = unlimited
  maxPhotosPerScooter: number   // Infinity = unlimited
  canUseCustomCover: boolean
  canUseGallery: boolean
  canAppearFeatured: boolean
  canUsePremiumBranding: boolean
  canShowVerifiedBadge: boolean
  priorityRankingWeight: number // 1.0 = normal; higher = better map/list rank
  // Analytics capability tiers — use the helper functions below, not these directly
  canAccessBasicAnalytics: boolean      // view/click counts (all plans)
  canAccessAdvancedAnalytics: boolean   // conversion rates
  canAccessLeadInsights: boolean        // hot scooters, underperformers
  canAccessPerformanceTrends: boolean   // week-over-week trends
  canAccessShopBenchmarking: boolean    // compare vs zone average
  canAccessHotScooters: boolean         // hot scooter scoring labels
  canAccessZoneIntelligence: boolean    // zone-level lead breakdown
  canAccessPhotoAnalytics: boolean      // photo performance data
  canAccessResponseRateData: boolean    // response speed signals
  canAccessExports: boolean             // data export
}

export const PLAN_CAPABILITIES: Record<PlanType, PlanCapabilities> = {
  free: {
    maxScooters: 3,
    maxPhotosPerScooter: 5,
    canUseCustomCover: false,
    canUseGallery: false,
    canAppearFeatured: false,
    canUsePremiumBranding: false,
    canShowVerifiedBadge: false,
    priorityRankingWeight: 1.0,
    canAccessBasicAnalytics: true,
    canAccessAdvancedAnalytics: false,
    canAccessLeadInsights: false,
    canAccessPerformanceTrends: false,
    canAccessShopBenchmarking: false,
    canAccessHotScooters: false,
    canAccessZoneIntelligence: false,
    canAccessPhotoAnalytics: false,
    canAccessResponseRateData: false,
    canAccessExports: false,
  },
  pro: {
    maxScooters: 15,
    maxPhotosPerScooter: 10,
    canUseCustomCover: true,
    canUseGallery: true,
    canAppearFeatured: false,
    canUsePremiumBranding: true,
    canShowVerifiedBadge: true,
    priorityRankingWeight: 1.2,
    canAccessBasicAnalytics: true,
    canAccessAdvancedAnalytics: true,
    canAccessLeadInsights: true,
    canAccessPerformanceTrends: false,
    canAccessShopBenchmarking: false,
    canAccessHotScooters: true,
    canAccessZoneIntelligence: false,
    canAccessPhotoAnalytics: false,
    canAccessResponseRateData: true,
    canAccessExports: false,
  },
  premium: {
    maxScooters: Infinity,
    maxPhotosPerScooter: Infinity,
    canUseCustomCover: true,
    canUseGallery: true,
    canAppearFeatured: true,
    canUsePremiumBranding: true,
    canShowVerifiedBadge: true,
    priorityRankingWeight: 1.5,
    canAccessBasicAnalytics: true,
    canAccessAdvancedAnalytics: true,
    canAccessLeadInsights: true,
    canAccessPerformanceTrends: true,
    canAccessShopBenchmarking: true,
    canAccessHotScooters: true,
    canAccessZoneIntelligence: true,
    canAccessPhotoAnalytics: true,
    canAccessResponseRateData: true,
    canAccessExports: true,
  },
  founding_partner: {
    maxScooters: Infinity,
    maxPhotosPerScooter: Infinity,
    canUseCustomCover: true,
    canUseGallery: true,
    canAppearFeatured: true,
    canUsePremiumBranding: true,
    canShowVerifiedBadge: true,
    priorityRankingWeight: 1.5,
    canAccessBasicAnalytics: true,
    canAccessAdvancedAnalytics: true,
    canAccessLeadInsights: true,
    canAccessPerformanceTrends: true,
    canAccessShopBenchmarking: true,
    canAccessHotScooters: true,
    canAccessZoneIntelligence: true,
    canAccessPhotoAnalytics: true,
    canAccessResponseRateData: true,
    canAccessExports: true,
  },
}

export const PLAN_LABELS: Record<PlanType, string> = {
  free:              'Free',
  pro:               'Pro',
  premium:           'Premium',
  founding_partner:  'Founding Partner',
}

export function getPlanCapabilities(planType: PlanType | string | undefined): PlanCapabilities {
  return PLAN_CAPABILITIES[(planType as PlanType) ?? 'founding_partner']
    ?? PLAN_CAPABILITIES.founding_partner
}

export function canAddScooter(planType: PlanType | string | undefined, currentCount: number): boolean {
  return currentCount < getPlanCapabilities(planType).maxScooters
}

export function isFoundingPartner(planType: PlanType | string | undefined): boolean {
  return planType === 'founding_partner'
}

// ── Analytics capability helpers ─────────────────────────────────────────────
// Always use these in components — never read PlanCapabilities fields directly.

export function canAccessBasicAnalytics(planType: PlanType | string | undefined): boolean {
  return getPlanCapabilities(planType).canAccessBasicAnalytics
}

export function canAccessAdvancedAnalytics(planType: PlanType | string | undefined): boolean {
  return getPlanCapabilities(planType).canAccessAdvancedAnalytics
}

export function canAccessLeadInsights(planType: PlanType | string | undefined): boolean {
  return getPlanCapabilities(planType).canAccessLeadInsights
}

export function canAccessPerformanceTrends(planType: PlanType | string | undefined): boolean {
  return getPlanCapabilities(planType).canAccessPerformanceTrends
}

export function canAccessShopBenchmarking(planType: PlanType | string | undefined): boolean {
  return getPlanCapabilities(planType).canAccessShopBenchmarking
}

export function canAccessHotScooters(planType: PlanType | string | undefined): boolean {
  return getPlanCapabilities(planType).canAccessHotScooters
}

export function canAccessZoneIntelligence(planType: PlanType | string | undefined): boolean {
  return getPlanCapabilities(planType).canAccessZoneIntelligence
}

export function canAccessPhotoAnalytics(planType: PlanType | string | undefined): boolean {
  return getPlanCapabilities(planType).canAccessPhotoAnalytics
}

export function canAccessResponseRateData(planType: PlanType | string | undefined): boolean {
  return getPlanCapabilities(planType).canAccessResponseRateData
}

export function canAccessExports(planType: PlanType | string | undefined): boolean {
  return getPlanCapabilities(planType).canAccessExports
}

// Soft messaging shown to founding partners (not a paywall — a thank-you)
export const FOUNDING_PARTNER_PERKS = [
  'Unlimited scooters & photos',
  'Premium shop page',
  'Priority map placement',
  'Early analytics access',
]
