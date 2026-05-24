// Centralized analytics time-window helpers.
// Use these everywhere — no hardcoded date arithmetic elsewhere.

export const PERIOD = {
  ROLLING_7D:  7,
  ROLLING_30D: 30,
  ROLLING_90D: 90,
} as const

export type AnalyticsPeriodDays = typeof PERIOD[keyof typeof PERIOD]

/** ISO cutoff string for a rolling window ending now */
export function getPeriodCutoff(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

/** True if an ISO date falls within the rolling window */
export function isWithinPeriod(isoDate: string | null | undefined, days: number): boolean {
  if (!isoDate) return false
  return new Date(isoDate).getTime() >= Date.now() - days * 24 * 60 * 60 * 1000
}

/** Days elapsed since a date string (undefined → large sentinel) */
export function daysSince(isoDate: string | null | undefined): number {
  if (!isoDate) return 9999
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000)
}
