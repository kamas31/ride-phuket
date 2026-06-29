// Reusable scooter recommendation engine for /which-scooter.
// Deliberately NOT a per-model if/else: every model just references a
// CategoryProfile (constants/scooter-categories.ts), and this file only
// scores categories against quiz answers, then maps the winning categories
// back to real MODELS entries. Adding a future model never touches this file.

import { MODELS, type ModelMeta } from '@/constants/models'
import {
  CATEGORIES,
  MODEL_CATEGORY,
  type CategoryProfile,
  type PriorityKey,
  type UsageKey,
  type ExperienceKey,
  type BudgetKey,
} from '@/constants/scooter-categories'

export interface QuizAnswers {
  riders: 1 | 2
  experience: ExperienceKey
  usage: UsageKey
  budget: BudgetKey
  /** Up to 3 selected priorities, most important first. */
  priorities: PriorityKey[]
}

export interface ScooterRecommendation {
  model: ModelMeta
  category: CategoryProfile
}

export interface RecommendationResult {
  best: ScooterRecommendation
  alternates: ScooterRecommendation[]
}

const EXPERIENCE_RANK: Record<ExperienceKey, number> = { beginner: 0, some: 1, experienced: 2 }
const BUDGET_RANK: Record<BudgetKey, number> = { budget: 0, mid: 1, premium: 2 }

function scoreCategory(profile: CategoryProfile, answers: QuizAnswers): number {
  let score = 0

  // Experience: a category that needs more experience than the rider has is a
  // real mismatch; a rider with more experience than required is never penalized.
  const expGap = EXPERIENCE_RANK[profile.minExperience] - EXPERIENCE_RANK[answers.experience]
  score += expGap > 0 ? -expGap * 3 : 1

  if (answers.riders === 2) score += profile.passengerFriendly ? 2 : -2

  score += profile.usage.includes(answers.usage) ? 3 : 0

  const budgetGap = Math.abs(BUDGET_RANK[profile.priceTier] - BUDGET_RANK[answers.budget])
  score += budgetGap === 0 ? 2 : budgetGap === 1 ? 0 : -2

  for (const priority of answers.priorities) {
    score += profile.priorities[priority] ?? 0
  }

  return score
}

// Within a category shared by more than one model (e.g. maxi_scooter has both
// Forza and XMAX), prefer whichever currently has live inventory — never
// headline a model with zero listings when a same-category alternative has
// real stock right now. Falls back to MODELS array order if both/neither have stock.
function pickModelForCategory(
  category: CategoryProfile,
  modelCounts: Record<string, number>,
): ModelMeta | null {
  const candidates = MODELS.filter(m => MODEL_CATEGORY[m.slug] === category.id)
  if (!candidates.length) return null

  return [...candidates].sort(
    (a, b) => (modelCounts[b.slug] ?? 0) - (modelCounts[a.slug] ?? 0),
  )[0]
}

export function recommendScooters(
  answers: QuizAnswers,
  modelCounts: Record<string, number> = {},
): RecommendationResult | null {
  const ranked = [...CATEGORIES]
    .map(profile => ({ profile, score: scoreCategory(profile, answers) }))
    .sort((a, b) => b.score - a.score)

  const picks: ScooterRecommendation[] = []
  for (const { profile } of ranked) {
    const model = pickModelForCategory(profile, modelCounts)
    if (model && !picks.some(p => p.model.slug === model.slug)) {
      picks.push({ model, category: profile })
    }
    if (picks.length >= 3) break
  }

  if (!picks.length) return null
  return { best: picks[0], alternates: picks.slice(1, 3) }
}
