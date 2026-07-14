// Comparison SEO pages ("X vs Y") — constants/models.ts's sibling, same
// shape/conventions. Created as an empty stub by the SEO Agent's
// write-seo-page mutator because lib/related-content.ts (shared cross-linking
// infra) imports COMPARE_PAGES unconditionally — write-compare-page.ts fills
// this in for real the first time a genuine comparison mission runs; until
// then this file has zero entries.

export interface ComparePoint {
  label: string
  a: string
  b: string
}

export interface CompareFaq {
  question: string
  answer: string
}

export interface ComparePageMeta {
  slug: string
  /** The real Google query this page was built for — traceability, never rendered as keyword-stuffed anchor text. */
  targetQuery: string
  modelSlugA: string
  modelSlugB: string
  title: string
  description: string
  intro: string
  comparisonPoints: ComparePoint[]
  verdict: string
  faq: CompareFaq[]
}

export const COMPARE_PAGES: ComparePageMeta[] = []

export function getComparePage(slug: string): ComparePageMeta | undefined {
  return COMPARE_PAGES.find(p => p.slug === slug)
}
