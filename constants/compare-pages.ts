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

export const COMPARE_PAGES: ComparePageMeta[] = [  {
    slug: 'pcx-vs-nmax',
    targetQuery: 'pcx vs nmax',
    modelSlugA: 'pcx',
    modelSlugB: 'nmax',
    title: 'Honda PCX vs Yamaha NMAX: Which to Rent in Phuket?',
    description: 'Compare the Honda PCX and Yamaha NMAX for scooter rental in Phuket — engine size, storage, price, and which one to choose for your trip.',
    intro: 'Both the Honda PCX and Yamaha NMAX are popular automatic scooters to rent in Phuket, but they suit different riders. Here’s how the PCX and NMAX compare on size, storage, price, and where each one shines around the island.',
    comparisonPoints: [
      { label: 'Riding style', a: 'Compact and upright — smooth automatic transmission, easy for first-time riders', b: 'Sportier styling and riding position, with a larger frame' },
      { label: 'Engine size (live listings)', a: '150–160cc automatic', b: '155cc automatic' },
      { label: 'Storage & practicality', a: 'Comfortable for day-to-day exploring with strong fuel economy', b: 'Larger under-seat storage, useful for day-trip gear' },
      { label: 'Best for', a: 'First-time riders and shorter or solo trips', b: 'Two-up riding, longer stays, and hill roads like Patong and Kata' },
      { label: 'Rental price (live listings)', a: '฿200–500/day', b: '฿200–350/day' },
    ],
    verdict: 'Both are fully automatic and easy to ride, so the choice mostly comes down to size and use case. Choose the Honda PCX if you want a compact, comfortable scooter for day-to-day exploring or as your first time on two wheels — it’s a common first pick for solo riders or lighter-passenger trips. Choose the Yamaha NMAX if you want a sportier ride with more under-seat storage and stability for two-up riding or longer stints on Phuket’s hill roads around Patong and Kata. Both are available island-wide — compare live listings and current pricing from real Phuket shops before you book.',
    faq: [
      { question: 'Is the PCX or NMAX better for a first-time rider in Phuket?', answer: 'Both are fully automatic with no clutch or gears, but the Honda PCX’s compact, upright seating makes it the more common first choice for riders new to scooters. The Yamaha NMAX is manageable too, but its larger frame suits riders with a bit more scooter experience.' },
      { question: 'Which is better for two people, the PCX or NMAX?', answer: 'The NMAX’s longer seat and larger frame make it the more common pick for two riders, while the PCX seats two but is best suited to lighter riders or shorter trips with a passenger.' },
      { question: 'Is the PCX or NMAX cheaper to rent in Phuket?', answer: 'Based on current live listings, PCX rentals run about ฿200–500/day and NMAX rentals run about ฿200–350/day, though pricing varies by shop and rental length — compare live listings below for today’s rates.' },
      { question: 'Which is better on Phuket’s hill roads, like Patong or Kata?', answer: 'Riders generally find the NMAX more stable on hill roads thanks to its slightly larger engine and wheelbase, but the PCX is still a capable, comfortable choice for most of the island’s roads.' },
    ],
  },
]

export function getComparePage(slug: string): ComparePageMeta | undefined {
  return COMPARE_PAGES.find(p => p.slug === slug)
}
