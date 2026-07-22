// Topic Clusters — the Brain's topical organization of every SEO/compare
// page (lib/brain/topic-cluster-classifier.ts in seo-agent reads this via
// the same sandboxed reader as MODELS/AREAS/SCOOTER_BRANDS). Pure data, zero
// imports, same reasons as models.ts/areas.ts. Adding a new cluster is one
// entry here — it never requires touching the classifier, the dashboard, or
// any mutator.
//
// matchRule.kind:
//   'entity-type' — a REAL, already-computed structural signal (this query
//                    matched a model page, an area page, or a comparison —
//                    lib/brain/query-classifier.ts already knows this before
//                    the cluster classifier is ever consulted). Checked
//                    first, across every cluster, before any text is read.
//   'keywords'    — fallback for plain guide/landing SEO pages, where no
//                    structural signal distinguishes one cluster from
//                    another (e.g. nothing about a "cheap scooter rental"
//                    query is structurally different from a "is it safe to
//                    ride a scooter" query except the words themselves).

export interface TopicClusterMatchRule {
  kind: 'entity-type' | 'keywords'
  types?: Array<'model' | 'area' | 'compare'>
  keywords?: string[]
}

export interface TopicClusterMeta {
  id: string
  name: string
  description: string
  matchRule: TopicClusterMatchRule
}

export const TOPIC_CLUSTERS: TopicClusterMeta[] = [
  {
    id: 'pricing',
    name: 'Pricing',
    description: 'Cost, price comparisons, deposits, and insurance for scooter rental in Phuket.',
    matchRule: {
      kind: 'keywords',
      keywords: ['price', 'prices', 'pricing', 'cost', 'costs', 'cheap', 'cheapest', 'expensive', 'average', 'budget', 'deposit', 'insurance'],
    },
  },
  {
    id: 'license-laws',
    name: 'License & Laws',
    description: "Legal requirements for renting and riding a scooter in Thailand: licenses, permits, and local law.",
    matchRule: {
      kind: 'keywords',
      keywords: ['license', 'licence', 'permit', 'permits', 'law', 'laws', 'legal', 'tourist', 'tourists', 'international', 'driving', 'allowed'],
    },
  },
  {
    id: 'safety',
    name: 'Safety',
    description: 'Riding safely in Phuket: accidents, road conditions, weather, and first-time-rider tips.',
    matchRule: {
      kind: 'keywords',
      keywords: ['safe', 'safety', 'accident', 'accidents', 'tips', 'dangerous', 'danger', 'rain', 'rainy', 'first', 'time', 'road', 'roads', 'helmet', 'scam', 'scams'],
    },
  },
  {
    id: 'models',
    name: 'Scooter Models',
    description: 'Individual scooter model pages and model-vs-model comparisons.',
    matchRule: { kind: 'entity-type', types: ['model', 'compare'] },
  },
  {
    id: 'phuket-guides',
    name: 'Phuket Guides',
    description: 'Area guides, routes, and things to see around Phuket by scooter.',
    matchRule: { kind: 'entity-type', types: ['area'] },
  },
  {
    id: 'rental-options',
    name: 'Rental Options',
    description: 'How and where to rent: airport pickup, delivery, and daily/weekly/monthly rental terms.',
    matchRule: {
      kind: 'keywords',
      keywords: ['airport', 'delivery', 'deliver', 'long', 'term', 'daily', 'weekly', 'monthly', 'pickup', 'drop'],
    },
  },
]
