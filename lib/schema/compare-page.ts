// Shared JSON-LD builder for /compare/[slug] pages — mirrors lib/schema/brand-page.ts.
// Created by the SEO Agent's write-compare-page mutator.

import type { ComparePageMeta } from '@/constants/compare-pages'
import { SITE_URL } from '@/constants'

export function buildComparePageBreadcrumbJsonLd(page: ComparePageMeta): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: page.title, item: `${SITE_URL}/compare/${page.slug}` },
    ],
  }
}

export function buildComparePageFaqJsonLd(page: ComparePageMeta): Record<string, unknown> | null {
  if (!page.faq.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}
