// Pure functions for lead-focused analytics.
// No DB calls — takes pre-fetched analytics and returns computed insights.

import type { ShopAnalytics } from '@/app/actions/shop-analytics'

export type ConversionRateLevel = 'excellent' | 'good' | 'low' | 'none'

export interface ConversionInsight {
  rate: number               // 0-100 (percentage)
  level: ConversionRateLevel
  label: string
  hint: string
}

export interface EngagementScore {
  score: number              // 0-100
  breakdown: {
    viewScore: number
    contactScore: number
    repeatScore: number
  }
}

/** WA clicks / scooter views, returns 0-100 percentage */
export function computeConversionRate(views: number, waClicks: number): number {
  if (views === 0) return 0
  return Math.min(100, Math.round((waClicks / views) * 100))
}

export function classifyConversionRate(rate: number): ConversionRateLevel {
  if (rate === 0)  return 'none'
  if (rate >= 20)  return 'excellent'
  if (rate >= 8)   return 'good'
  return 'low'
}

export function getConversionInsight(views: number, waClicks: number): ConversionInsight {
  const rate  = computeConversionRate(views, waClicks)
  const level = classifyConversionRate(rate)

  const labels: Record<ConversionRateLevel, string> = {
    excellent: 'Excellent',
    good:      'Good',
    low:       'Needs work',
    none:      'No data',
  }
  const hints: Record<ConversionRateLevel, string> = {
    excellent: 'Great conversion — keep up the quality',
    good:      'Solid conversion — add more photos to push higher',
    low:       'Low conversion — consider better photos or pricing',
    none:      'No contacts yet — share your listing to get leads',
  }

  return { rate, level, label: labels[level], hint: hints[level] }
}

/** 0-100 composite engagement score, weighted toward contacts */
export function computeEngagementScore(analytics: ShopAnalytics): EngagementScore {
  const { scooterViews, whatsappClicks, phoneClicks, repeatVisitors, periodDays } = analytics
  const days = Math.max(periodDays, 1)

  const dailyViews    = scooterViews   / days
  const dailyContacts = (whatsappClicks + phoneClicks) / days
  const dailyRepeats  = repeatVisitors / days

  // Normalise to 0-100: 10 views/day = 100, 5 contacts/day = 100, 3 repeats/day = 100
  const viewScore    = Math.min(100, dailyViews    * 10)
  const contactScore = Math.min(100, dailyContacts * 20)
  const repeatScore  = Math.min(100, dailyRepeats  * 33)

  // Contacts carry 60% of weight
  const score = Math.round(viewScore * 0.25 + contactScore * 0.60 + repeatScore * 0.15)
  return {
    score,
    breakdown: {
      viewScore:    Math.round(viewScore),
      contactScore: Math.round(contactScore),
      repeatScore:  Math.round(repeatScore),
    },
  }
}

/** Total contact events across all channels */
export function totalLeads(analytics: ShopAnalytics): number {
  return analytics.whatsappClicks + analytics.phoneClicks
}
