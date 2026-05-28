import Fuse, { type IFuseOptions } from 'fuse.js'
import type { Scooter } from '@/types'

// ── Fuse options ──────────────────────────────────────────────────────────────

export const HOME_FUSE_OPTIONS: IFuseOptions<Scooter> = {
  keys: [
    { name: 'name',        weight: 0.40 },
    { name: 'model',       weight: 0.35 },
    { name: 'brand',       weight: 0.15 },
    { name: 'description', weight: 0.10 },
  ],
  threshold: 0.40,
  ignoreLocation: true,
  minMatchCharLength: 2,
  includeScore: true,
}

// Explore adds location so "Patong", "Karon" etc. still work
export const EXPLORE_FUSE_OPTIONS: IFuseOptions<Scooter> = {
  keys: [
    { name: 'name',        weight: 0.35 },
    { name: 'model',       weight: 0.30 },
    { name: 'brand',       weight: 0.15 },
    { name: 'location',    weight: 0.15 },
    { name: 'description', weight: 0.05 },
  ],
  threshold: 0.40,
  ignoreLocation: true,
  minMatchCharLength: 2,
  includeScore: true,
}

// ── Scooter family / tier system ─────────────────────────────────────────────

export type ScooterTier = 'maxi' | 'adventure' | 'mid' | 'city' | 'electric'

interface TierDef {
  // Normalized query fragments that map to this tier (spaces/dashes stripped, lowercased)
  queries: string[]
  // Terms matched against scooter name+model+brand (substring, case-insensitive)
  matchTerms: string[]
  // Price-based fallback when no name match exists
  priceMin: number
  priceMax: number
  // Human-readable label shown in "Similar scooters" header
  suggestion: string
}

const TIERS: Record<ScooterTier, TierDef> = {
  maxi: {
    queries: [
      'tmax', 'tmx', 'tmaxtechmax', 'techmax',
      'xmax', 'xmx',
      'forza', 'forza7', 'forza75',
      'ak550', 'ak',
      'integra', 'nm4',
      'burgman', 'majesty', 'silverwing',
      'kymco', 'maxsym',
      'xforce', 'tricity',
    ],
    matchTerms: [
      'tmax', 'xmax', 'forza', 'ak550', 'integra', 'nm4',
      'silver wing', 'burgman', 'majesty', 'maxsym',
    ],
    priceMin: 700,
    priceMax: 99999,
    suggestion: 'Similar premium maxi-scooters',
  },
  adventure: {
    queries: [
      'adv', 'xadv', 'xadv750', 'adv160', 'adv150',
      'adventure', 'dual', 'offroad',
      'crf', 'crossrunner',
    ],
    matchTerms: ['adv', 'x-adv', 'xadv', 'crf', 'crossrunner', 'adventure'],
    priceMin: 500,
    priceMax: 99999,
    suggestion: 'Similar adventure-style scooters',
  },
  mid: {
    queries: [
      'nmax', 'nmx', 'nmaxx',
      'pcx', 'px',
      'aerox', 'vario', 'sh', 'sh300', 'sh125',
      'forza3', 'forza350', 'forza300', 'forza125',
      'medley', 'vespa', 'sprint', 'gts', 'gts300',
    ],
    matchTerms: [
      'nmax', 'pcx', 'aerox', 'vario', 'sh300', 'sh125',
      'forza 3', 'medley', 'vespa', 'gts', 'sprint',
    ],
    priceMin: 300,
    priceMax: 700,
    suggestion: 'Similar 125–300cc scooters',
  },
  city: {
    queries: [
      'click', 'clik', 'click160', 'click125',
      'scoopy', 'scopy',
      'fino', 'mio', 'beat',
      'wave', 'dream', 'cub',
      'airblade', 'airblad', 'vision',
      'dio', 'freego',
    ],
    matchTerms: [
      'click', 'scoopy', 'fino', 'mio', 'beat',
      'wave', 'dream', 'air blade', 'airblade', 'vision', 'dio', 'freego',
    ],
    priceMin: 0,
    priceMax: 400,
    suggestion: 'Similar city & beginner scooters',
  },
  electric: {
    queries: ['electric', 'ev', 'electrique', 'elec', 'niu', 'vmoto', 'supersoco', 'gogoro'],
    matchTerms: ['electric', 'ev', 'niu', 'vmoto', 'super soco', 'gogoro'],
    priceMin: 0,
    priceMax: 99999,
    suggestion: 'Electric scooters available',
  },
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[\s\-_]/g, '')
}

export function detectTier(query: string): ScooterTier | null {
  if (!query.trim()) return null
  const n = norm(query)
  if (n.length < 2) return null

  for (const [tier, def] of Object.entries(TIERS) as [ScooterTier, TierDef][]) {
    for (const q of def.queries) {
      const nq = norm(q)
      // Handles: "tmax"="tmax", "tma"⊂"tmax", "xmx"≈"xmax", "nmaxx"⊃"nmax"
      if (nq === n || nq.startsWith(n) || n.startsWith(nq) || nq.includes(n)) {
        return tier
      }
    }
  }
  return null
}

export function getSimilarScooters(
  query: string,
  allScooters: Scooter[],
): { scooters: Scooter[]; label: string } {
  const tier = detectTier(query)

  if (tier) {
    const def = TIERS[tier]
    const haystack = (s: Scooter) => `${s.name} ${s.model} ${s.brand}`.toLowerCase()

    const byName = allScooters.filter(s =>
      def.matchTerms.some(t => haystack(s).includes(t.toLowerCase()))
    )
    // Fall back to price-range heuristic when name terms don't match current fleet
    const byPrice = allScooters.filter(
      s => s.pricePerDay >= def.priceMin && s.pricePerDay < def.priceMax
    )

    const pool = byName.length >= 2 ? byName : byPrice
    if (pool.length > 0) return { scooters: pool.slice(0, 8), label: def.suggestion }
  }

  return { scooters: allScooters.slice(0, 4), label: 'Popular scooters' }
}

// ── Convenience factory so components don't import Fuse directly ──────────────

export function createHomeFuse(scooters: Scooter[]): Fuse<Scooter> {
  return new Fuse(scooters, HOME_FUSE_OPTIONS)
}

export function createExploreFuse(scooters: Scooter[]): Fuse<Scooter> {
  return new Fuse(scooters, EXPLORE_FUSE_OPTIONS)
}
