// Real, live, deterministic cross-linking across every query-driven page
// family (guides, landing pages, comparisons) — read live at render time, so
// this strengthens automatically as more pages are created, with zero manual
// re-editing of old pages. Created by the SEO Agent's write-seo-page mutator.

import { SEO_PAGES, type SeoPageMeta } from '@/constants/seo-pages'
import { COMPARE_PAGES, type ComparePageMeta } from '@/constants/compare-pages'

export interface RelatedLink {
  href: string
  label: string
}

export interface RelatedContent {
  guides: RelatedLink[]
  landings: RelatedLink[]
  compares: RelatedLink[]
}

// Site-wide terms so common that requiring literal overlap on them would say
// nothing about real topical relatedness — mirrors lib/mutators/write-seo-page.ts's
// QUERY_NOISE_WORDS in seo-agent (two separate deployable codebases, kept in
// sync by convention, not by import).
const NOISE_WORDS = new Set(['a', 'an', 'the', 'in', 'to', 'for', 'of', 'on', 'is', 'are', 'do', 'does', 'i', 'need', 'my', 'rental', 'rent', 'scooter', 'scooters', 'phuket'])

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
}
function significantTerms(s: string): Set<string> {
  return new Set(tokenize(s).filter(t => !NOISE_WORDS.has(t) && t.length > 1))
}
function overlapScore(a: Set<string>, b: Set<string>): number {
  let n = 0
  for (const t of a) if (b.has(t)) n++
  return n
}

/**
 * topicText: the CURRENT page's own query/title/name — used for topical
 * overlap matching. relevantModelSlugs: models this page already features
 * (e.g. a model page passes its own slug) — boosts comparison pages that
 * literally reference one of these models, even if raw text overlap is thin.
 * clusterId: this page's own topic cluster (constants/topic-clusters.ts) —
 * the strongest relatedness signal available (bigger than the model-match
 * bonus below), since two pages in the same cluster are related BY
 * DEFINITION even when they share few literal words (e.g. "scooter rental
 * deposit" and "scooter rental insurance" are both Pricing, but barely
 * overlap on text alone).
 */
export function getRelatedContent(opts: {
  excludeSlug?: string
  topicText: string
  relevantModelSlugs?: string[]
  clusterId?: string
  maxPerCategory?: number
}): RelatedContent {
  const max = opts.maxPerCategory ?? 4
  const topicTokens = significantTerms(opts.topicText)
  const relevantModels = new Set(opts.relevantModelSlugs ?? [])
  const clusterBonus = (pageCluster: string | undefined) => (opts.clusterId && pageCluster === opts.clusterId ? 3 : 0)

  const scoreSeoPage = (p: SeoPageMeta) => overlapScore(topicTokens, significantTerms(p.targetQuery)) + clusterBonus(p.cluster)
  const rankSeoPages = (pages: SeoPageMeta[]) =>
    pages
      .filter(p => p.slug !== opts.excludeSlug)
      .map(p => ({ page: p, score: scoreSeoPage(p) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, max)
      .map(x => x.page)

  const scoreCompare = (p: ComparePageMeta) => {
    let score = overlapScore(topicTokens, significantTerms(p.targetQuery)) + clusterBonus(p.cluster)
    if (relevantModels.has(p.modelSlugA) || relevantModels.has(p.modelSlugB)) score += 2
    return score
  }
  const rankCompares = () =>
    COMPARE_PAGES
      .filter(p => p.slug !== opts.excludeSlug)
      .map(p => ({ page: p, score: scoreCompare(p) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, max)
      .map(x => x.page)

  return {
    guides: rankSeoPages(SEO_PAGES.filter(p => p.urlStrategy === 'guide')).map(p => ({ href: `/guides/${p.slug}`, label: p.title })),
    landings: rankSeoPages(SEO_PAGES.filter(p => p.urlStrategy === 'landing')).map(p => ({ href: `/${p.slug}`, label: p.title })),
    compares: rankCompares().map(p => ({ href: `/compare/${p.slug}`, label: p.title })),
  }
}
