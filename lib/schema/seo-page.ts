// Shared JSON-LD builder for /guides/[slug] and /[slug] (landing) pages —
// mirrors lib/schema/brand-page.ts. Created by the SEO Agent's
// write-seo-page mutator.

import type { SeoPageMeta } from '@/constants/seo-pages'
import { SITE_URL } from '@/constants'

function urlFor(page: SeoPageMeta): string {
  return page.urlStrategy === 'guide' ? `${SITE_URL}/guides/${page.slug}` : `${SITE_URL}/${page.slug}`
}

// Product/AggregateOffer schema only makes sense when the page actually
// lists real matching inventory — "lorsque c'est pertinent", never fabricated
// for a purely informational guide with no filter.
export function buildSeoPageProductJsonLd(
  page: SeoPageMeta,
  scooterCount: number,
  priceRange: { min: number; max: number } | null
): Record<string, unknown> | null {
  if (!page.filter) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: page.title,
    description: page.description,
    url: urlFor(page),
    ...(priceRange && scooterCount > 0 && {
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: priceRange.min,
        highPrice: priceRange.max,
        priceCurrency: 'THB',
        offerCount: scooterCount,
      },
    }),
  }
}

export function buildSeoPageBreadcrumbJsonLd(page: SeoPageMeta): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: page.title, item: urlFor(page) },
    ],
  }
}

export function buildSeoPageFaqJsonLd(page: SeoPageMeta): Record<string, unknown> | null {
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
