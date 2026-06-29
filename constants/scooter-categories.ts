// Recommendation categories for the "Which Scooter Should You Rent?" engine
// (app/which-scooter). This is NOT a second model list — MODELS in
// constants/models.ts stays the single source of truth for scooter content.
// This file only adds a thin "which category does this model belong to"
// annotation, plus the real-world characteristics of each category, so the
// scoring engine (lib/recommend-scooter.ts) never branches per-model.
//
// Adding a future model to MODELS only requires one new line in
// MODEL_CATEGORY below — nothing else needs to change.

import { MODELS } from './models'

export type PriorityKey = 'comfort' | 'storage' | 'performance' | 'fuelEconomy' | 'style'
export type UsageKey = 'city' | 'beach' | 'touring' | 'hills' | 'mixed'
export type ExperienceKey = 'beginner' | 'some' | 'experienced'
export type BudgetKey = 'budget' | 'mid' | 'premium'

export interface CategoryProfile {
  id: string
  label: string
  summary: string
  /** Minimum riding experience generally recommended for this category. */
  minExperience: ExperienceKey
  /** Comfortable carrying a passenger for normal day-to-day riding. */
  passengerFriendly: boolean
  /** Trip types this category is commonly well-suited to. */
  usage: UsageKey[]
  /** Rough relative price positioning vs. the rest of the fleet. */
  priceTier: BudgetKey
  /** Strength (0–5) of this category against each quiz priority. */
  priorities: Record<PriorityKey, number>
}

export const CATEGORIES: CategoryProfile[] = [
  {
    id: 'small_city',
    label: 'Small & Easy',
    summary: 'Light, simple, and budget-friendly — best for solo riders staying close to town.',
    minExperience: 'beginner',
    passengerFriendly: false,
    usage: ['city', 'mixed'],
    priceTier: 'budget',
    priorities: { comfort: 1, storage: 2, performance: 0, fuelEconomy: 3, style: 1 },
  },
  {
    id: 'comfort_125',
    label: 'Comfortable All-Rounder',
    summary: 'Smooth, upright, and easy to ride — the most popular all-purpose automatic in Phuket.',
    minExperience: 'beginner',
    passengerFriendly: true,
    usage: ['city', 'beach', 'mixed'],
    priceTier: 'mid',
    priorities: { comfort: 3, storage: 2, performance: 1, fuelEconomy: 2, style: 1 },
  },
  {
    id: 'sporty_155',
    label: 'Sporty & Stylish',
    summary: 'A sportier ride with more presence and storage — for riders who want a bit more edge.',
    // 'beginner', not 'some' — the NMAX is fully automatic with a similar
    // weight/handling profile to the PCX (its direct competitor in
    // comfort_125). The real difference is styling/storage preference, not
    // a higher skill requirement, so beginners must not be penalized for it.
    minExperience: 'beginner',
    passengerFriendly: true,
    usage: ['beach', 'hills', 'mixed'],
    priceTier: 'mid',
    priorities: { comfort: 2, storage: 3, performance: 2, fuelEconomy: 1, style: 3 },
  },
  {
    id: 'adventure_160',
    label: 'Adventure & Crossover',
    summary: 'Bigger wheels and more ground clearance for riders who want one bike for town and exploring.',
    minExperience: 'some',
    passengerFriendly: true,
    usage: ['hills', 'touring', 'mixed'],
    priceTier: 'mid',
    priorities: { comfort: 3, storage: 2, performance: 2, fuelEconomy: 1, style: 2 },
  },
  {
    id: 'maxi_scooter',
    label: 'Maxi-Scooter Touring',
    summary: 'Bigger, more powerful scooters built for comfort over longer distances.',
    minExperience: 'some',
    passengerFriendly: true,
    usage: ['touring', 'hills', 'mixed'],
    priceTier: 'premium',
    priorities: { comfort: 3, storage: 3, performance: 3, fuelEconomy: 1, style: 2 },
  },
  {
    id: 'premium_big_scooter',
    label: 'Premium & Powerful',
    summary: 'The biggest, most powerful options — for confident riders who want maximum performance.',
    minExperience: 'experienced',
    passengerFriendly: true,
    usage: ['touring', 'hills'],
    priceTier: 'premium',
    priorities: { comfort: 2, storage: 2, performance: 5, fuelEconomy: 0, style: 3 },
  },
]

// Every model slug here must exist in MODELS (constants/models.ts).
// Real-world characteristics behind each assignment:
//  - pcx:   ~150cc, upright, comfort/beginner-first-choice           -> comfort_125
//  - nmax:  ~155cc, sportier styling/storage than PCX                -> sporty_155
//  - adv:   crossover styling, larger wheels, more clearance         -> adventure_160
//  - xadv:  larger/more powerful DCT crossover, step up from ADV     -> premium_big_scooter
//  - forza: maxi-scooter, comfort-touring focused                    -> maxi_scooter
//  - xmax:  maxi-scooter, sportier handling than Forza                -> maxi_scooter
//  - click: light, economical, beginner commuter                    -> small_city
//  - lead:  step-through, practical storage, beginner commuter      -> small_city
//  - tmax:  most powerful maxi-scooter, experienced-riders-only      -> premium_big_scooter
export const MODEL_CATEGORY: Record<string, string> = {
  pcx: 'comfort_125',
  nmax: 'sporty_155',
  adv: 'adventure_160',
  xadv: 'premium_big_scooter',
  forza: 'maxi_scooter',
  xmax: 'maxi_scooter',
  click: 'small_city',
  lead: 'small_city',
  tmax: 'premium_big_scooter',
}

export function getCategory(id: string): CategoryProfile | undefined {
  return CATEGORIES.find(c => c.id === id)
}

export function getCategoryForModel(slug: string): CategoryProfile | undefined {
  const id = MODEL_CATEGORY[slug]
  return id ? getCategory(id) : undefined
}

// Any model present in MODELS but missing from MODEL_CATEGORY — surfaced so a
// future model added to constants/models.ts is never silently unrecommendable.
export const UNCATEGORIZED_MODEL_SLUGS: string[] = MODELS
  .map(m => m.slug)
  .filter(slug => !(slug in MODEL_CATEGORY))
