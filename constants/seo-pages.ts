// Query-driven SEO pages — constants/models.ts's sibling, same shape/
// conventions, for real Google queries that don't map to one specific model,
// brand, or area. Created by the SEO Agent's write-seo-page mutator.
// urlStrategy decides which route renders an entry: 'guide' → /guides/[slug]
// (informational intent), 'landing' → /[slug] (commercial/modifier intent,
// root-level — validated against a reserved-slug denylist before creation so
// it can never shadow an existing route). Data-only, no imports, so it can be
// safely read by seo-agent's read-constants.ts sandboxed parser exactly like
// MODELS/AREAS/BRANDS already are.

export interface SeoPageFaq {
  question: string
  answer: string
}

export interface SeoContentSection {
  heading: string
  body: string
}

export interface SeoPageFilter {
  maxPricePerDay?: number
  category?: 'automatic' | 'manual' | 'electric'
  requiresMonthlyRate?: boolean
}

export interface SeoPageMeta {
  urlStrategy: 'guide' | 'landing'
  slug: string
  /** The real Google query this page was built for — traceability, never rendered as keyword-stuffed anchor text. */
  targetQuery: string
  title: string
  h1: string
  description: string
  longDescription: string
  contentSections: SeoContentSection[]
  highlights: string[]
  faq: SeoPageFaq[]
  /** Drives which REAL scooters this page lists — never a fabricated list. Optional: a purely informational guide may have none. */
  filter?: SeoPageFilter
}

export const SEO_PAGES: SeoPageMeta[] = [
  {
    urlStrategy: 'landing',
    slug: 'best-scooter-rental-phuket',
    targetQuery: 'best scooter rental phuket',
    title: 'Best Scooter Rental in Phuket | Koh Ride',
    h1: 'Best Scooter Rental in Phuket',
    description: 'The best scooter rental in Phuket: 65 real automatic scooters from 16 verified shops, all with helmet and insurance included, from 150 THB/day.',
    longDescription: 'Looking for the best scooter rental in Phuket? Koh Ride lists 65 real, available automatic scooters from 16 verified shops across Patong, Kata, Kathu, Chalong, Rawai, and Phuket Town — compare prices from 150 THB/day, monthly rates, and delivery options before you book.',
    contentSections: [
      { heading: 'How we determine the best scooter rental in Phuket', body: 'Koh Ride only surfaces real, currently available inventory — no fake listings or stock photos. To find the best scooter rental in Phuket, this page defaults to automatic scooters from verified shops, since automatics make up the vast majority (65 of 73) of the real listings on the platform and are the easiest option for tourists riding in Phuket traffic.' },
      { heading: 'Automatic vs. manual: which is best for Phuket roads', body: 'Automatic scooters like the Honda Click, Honda PCX, and Yamaha NMAX don’t require shifting gears, making them the best scooter rental choice for most visitors riding Phuket’s hills and traffic. Manual motorcycles are also available on Koh Ride for experienced riders, but they’re listed separately from this scooter-focused selection.' },
    ],
    highlights: ['65 real automatic scooters live across Phuket today, from Honda, Yamaha, and GPX', 'Helmet and insurance included on every listing — no hidden extras', '16 verified shops spread across all 6 areas of Phuket: Patong, Kata, Kathu, Chalong, Rawai, and Phuket Town', '56 of 65 scooters offer a discounted monthly rate for longer stays', 'Prices start at 150 THB/day, with delivery available on 28 listings'],
    faq: [
      { question: 'What’s the best scooter rental option in Phuket?', answer: 'For most riders, an automatic scooter is the best scooter rental option in Phuket — no clutch to manage in traffic, and Koh Ride currently lists 65 real automatic scooters from 16 verified shops across the island, starting at 150 THB/day.' },
      { question: 'How much does the best scooter rental in Phuket cost per day?', answer: 'Automatic scooter rentals on Koh Ride start at 150 THB/day, with most everyday models (Honda Click, Honda PCX, Yamaha NMAX, Yamaha Aerox) priced between 200 and 500 THB/day depending on the shop and season.' },
      { question: 'Do Phuket scooter rentals include a helmet and insurance?', answer: 'Yes — every automatic scooter listed on Koh Ride includes a helmet and insurance as standard, with no extra add-on fees.' },
      { question: 'Can I rent a scooter for a full month in Phuket?', answer: 'Yes — 56 of the 65 automatic scooters currently listed offer a discounted monthly rate, which usually works out cheaper per day than a short daily rental.' },
    ],
    filter: { category: 'automatic' },
  },
  {
    urlStrategy: 'landing',
    slug: 'monthly-scooter-rental-phuket',
    targetQuery: 'monthly scooter rental phuket',
    title: 'Monthly Scooter Rental Phuket | Koh Ride',
    h1: 'Monthly Scooter Rental in Phuket',
    description: 'Monthly scooter rental in Phuket: 56 real automatic scooters with a discounted monthly rate from 3,500 THB, across 15 verified shops in 6 areas.',
    longDescription: 'Planning to stay in Phuket for a month or longer? Koh Ride lists 56 real automatic scooters from 15 verified shops that offer a discounted monthly rental rate, starting from 3,500 THB/month. Every one of them works out cheaper per day than booking short-term, with a typical saving of around 44%. Compare monthly rates across Rawai, Chalong, Patong, Phuket Town, Kathu, and Kata before you book.',
    contentSections: [
      { heading: 'How monthly scooter rental pricing works in Phuket', body: 'Shops on Koh Ride set a separate, discounted price for renters staying a full month. Every one of the 56 automatic scooters with a monthly rate here works out cheaper per day than that same shop’s standard daily rate, with savings ranging from 6% to 77% and a median of about 44%. Monthly rental is the better deal for anyone staying in Phuket longer than a couple of weeks.' },
      { heading: 'Which scooters are available for monthly rental', body: 'Monthly rates are most common on everyday automatics: Honda Click, Honda PCX, Honda XADV, Honda ADV, Yamaha NMAX, and Yamaha AEROX all have real listings with a monthly rate on Koh Ride today. Prices start at 3,500 THB/month for a Yamaha Grand Filano or Honda Click, rising for larger-displacement models like the Honda XADV.' },
    ],
    highlights: ['56 real automatic scooters currently offer a discounted monthly rental rate', '15 verified shops across 6 areas of Phuket offer monthly scooter rental', 'Every monthly rate is cheaper per day than the daily rate, with a median saving around 44%', 'Monthly rates start from 3,500 THB, with helmet and insurance included on every listing', '26 of the 56 monthly-rate scooters offer delivery'],
    faq: [
      { question: 'How much does monthly scooter rental cost in Phuket?', answer: 'Monthly scooter rental on Koh Ride starts from 3,500 THB/month for models like the Yamaha Grand Filano or Honda Click, rising to around 45,000 THB/month for larger automatics like the Honda XADV. 56 real listings currently offer a monthly rate.' },
      { question: 'Is monthly scooter rental cheaper than daily rental in Phuket?', answer: 'Yes. Every one of the 56 automatic scooters with a monthly rate on Koh Ride works out cheaper per day than that shop’s standard daily rate, with a typical saving of around 44%.' },
      { question: 'Which areas of Phuket offer monthly scooter rental?', answer: 'Monthly scooter rental is available from 15 verified shops across 6 areas: Rawai, Chalong, Patong, Phuket Town, Kathu, and Kata.' },
      { question: 'Does monthly scooter rental in Phuket include a helmet and insurance?', answer: 'Yes. Every monthly-rate scooter listed on Koh Ride includes a helmet and insurance, with no separate add-on fee.' },
    ],
    filter: { category: 'automatic', requiresMonthlyRate: true },
  },
]

export function getSeoPage(slug: string, urlStrategy: 'guide' | 'landing'): SeoPageMeta | undefined {
  return SEO_PAGES.find(p => p.slug === slug && p.urlStrategy === urlStrategy)
}
