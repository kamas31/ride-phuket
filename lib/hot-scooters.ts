// Lightweight hot scooter scoring — deterministic heuristics, no LLM.
// Signal weights mirror lib/ranking.ts: WA click = 8× a view.

export interface HotScooterSignals {
  scooterId:       string
  name:            string
  views:           number
  waClicks:        number
  phoneClicks:     number
  periodDays:      number
  daysSinceCreated?: number  // for rising_fast detection
}

export type HotStatus =
  | 'hot'             // high sustained overall score
  | 'trending'        // strong contact-to-view ratio
  | 'most_contacted'  // most WA/phone clicks in fleet
  | 'high_interest'   // many views but few contacts (opportunity)
  | 'rising_fast'     // new listing already gaining traction
  | null

export interface HotScooterScore {
  scooterId: string
  name:      string
  score:     number    // 0-100
  status:    HotStatus
  signals:   HotScooterSignals
}

/**
 * Composite hot score.
 * WA = 8 pts, phone = 6 pts, view = 1 pt — per unit per day, normalised to 0-100.
 */
export function computeHotScore(signals: HotScooterSignals): number {
  const { views, waClicks, phoneClicks, periodDays } = signals
  const daily = (waClicks * 8 + phoneClicks * 6 + views) / Math.max(periodDays, 1)
  return Math.min(100, Math.round(daily * 5))
}

export function classifyHotStatus(
  score: number,
  signals: HotScooterSignals,
  allSignals: HotScooterSignals[],
): HotStatus {
  const { views, waClicks, phoneClicks, daysSinceCreated } = signals
  const contacts = waClicks + phoneClicks

  if (score >= 50) return 'hot'

  // New listing already receiving contacts — early traction signal
  const isNew = daysSinceCreated !== undefined && daysSinceCreated <= 14
  if (isNew && contacts >= 1) return 'rising_fast'

  // Most contacted in the fleet
  const maxContacts = Math.max(...allSignals.map(s => s.waClicks + s.phoneClicks))
  if (contacts > 0 && contacts === maxContacts && allSignals.length > 1) return 'most_contacted'

  // High contact-to-view ratio with enough views
  if (views >= 5 && contacts / views >= 0.2) return 'trending'

  // Many views but nobody contacts — conversion opportunity
  if (views >= 8 && contacts === 0) return 'high_interest'

  return null
}

/** Rank a fleet by hot score, highest first */
export function rankScootersByHotScore(signals: HotScooterSignals[]): HotScooterScore[] {
  return signals
    .map(s => {
      const score = computeHotScore(s)
      return {
        scooterId: s.scooterId,
        name:      s.name,
        score,
        status:    classifyHotStatus(score, s, signals),
        signals:   s,
      }
    })
    .sort((a, b) => b.score - a.score)
}

const HOT_STATUS_LABELS: Record<NonNullable<HotStatus>, string> = {
  hot:            'Hot this week',
  trending:       'Trending',
  most_contacted: 'Most contacted',
  high_interest:  'High interest',
  rising_fast:    'Rising fast',
}

export function getHotStatusLabel(status: HotStatus): string | null {
  if (!status) return null
  return HOT_STATUS_LABELS[status]
}
