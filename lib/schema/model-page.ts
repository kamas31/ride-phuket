// Shared JSON-LD builder for /models/[slug] pages — keeps schema shape consistent
// across all model pages instead of letting each page improvise its own (per TECHNICAL_SEO.md #4).
// Product+AggregateOffer (price range, not a single Offer) since a model page represents
// many listings, not one — do not reuse the per-listing Product pattern from /scooter/[id].

import type { ModelMeta } from '@/constants/models'
import type { ModelPriceRange } from '@/lib/live-models'
import { SITE_URL } from '@/constants'

export function buildModelProductJsonLd(
  model: ModelMeta,
  scooterCount: number,
  priceRange: ModelPriceRange | null
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: model.name,
    description: model.description,
    brand: { '@type': 'Brand', name: model.brand },
    url: `${SITE_URL}/models/${model.slug}`,
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

export function buildModelBreadcrumbJsonLd(model: ModelMeta): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: `${model.name} Rental`, item: `${SITE_URL}/models/${model.slug}` },
    ],
  }
}

export function buildModelFaqJsonLd(model: ModelMeta): Record<string, unknown> | null {
  if (!model.faq.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: model.faq.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}
