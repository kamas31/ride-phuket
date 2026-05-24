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
  canAccessAnalytics: boolean
  canShowVerifiedBadge: boolean
  priorityRankingWeight: number // 1.0 = normal; higher = better map/list rank
}

export const PLAN_CAPABILITIES: Record<PlanType, PlanCapabilities> = {
  free: {
    maxScooters: 3,
    maxPhotosPerScooter: 5,
    canUseCustomCover: false,
    canUseGallery: false,
    canAppearFeatured: false,
    canUsePremiumBranding: false,
    canAccessAnalytics: false,
    canShowVerifiedBadge: false,
    priorityRankingWeight: 1.0,
  },
  pro: {
    maxScooters: 15,
    maxPhotosPerScooter: 10,
    canUseCustomCover: true,
    canUseGallery: true,
    canAppearFeatured: false,
    canUsePremiumBranding: true,
    canAccessAnalytics: false,
    canShowVerifiedBadge: true,
    priorityRankingWeight: 1.2,
  },
  premium: {
    maxScooters: Infinity,
    maxPhotosPerScooter: Infinity,
    canUseCustomCover: true,
    canUseGallery: true,
    canAppearFeatured: true,
    canUsePremiumBranding: true,
    canAccessAnalytics: true,
    canShowVerifiedBadge: true,
    priorityRankingWeight: 1.5,
  },
  founding_partner: {
    maxScooters: Infinity,
    maxPhotosPerScooter: Infinity,
    canUseCustomCover: true,
    canUseGallery: true,
    canAppearFeatured: true,
    canUsePremiumBranding: true,
    canAccessAnalytics: true,
    canShowVerifiedBadge: true,
    priorityRankingWeight: 1.5,
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

// Soft messaging shown to founding partners (not a paywall — a thank-you)
export const FOUNDING_PARTNER_PERKS = [
  'Unlimited scooters & photos',
  'Premium shop page',
  'Priority map placement',
  'Early analytics access',
]
