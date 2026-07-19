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
  /** Recognized synonym/word-order variants that resolve to this SAME page (lib/brain/canonical-query.ts). Optional: absent on pages created before this field existed. */
  alternateQueries?: string[]
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
  {
    slug: 'xadv-vs-tmax',
    targetQuery: 'xadv vs tmax',
    alternateQueries: [],
    modelSlugA: 'xadv',
    modelSlugB: 'tmax',
    title: 'Honda X-ADV vs Yamaha TMAX: Which to Rent in Phuket?',
    description: 'Compare the Honda X-ADV and Yamaha TMAX for scooter rental in Phuket — engine size, transmission, price, and availability, so you can pick the right one.',
    intro: 'The Honda X-ADV and Yamaha TMAX are two of the largest, most powerful automatic scooters available to rent in Phuket — built for confident riders who want more performance than a standard maxi-scooter. Here’s how the X-ADV and TMAX compare on engine size, transmission, price, and real-world availability across the island.',
    comparisonPoints: [
      { label: 'Riding style', a: 'Larger, more powerful crossover than the regular ADV — off-road-inspired styling with real ground clearance', b: 'The most powerful maxi-scooter commonly available in Phuket — sharp, motorcycle-like handling in a fully automatic package' },
      { label: 'Engine size (live listings)', a: '750cc automatic', b: '560cc automatic' },
      { label: 'Transmission', a: 'Honda dual-clutch automatic (DCT) with an optional manual-style paddle shift', b: 'Fully automatic twist-and-go — no DCT or paddle shift' },
      { label: 'Rider experience needed', a: 'Suits confident riders with some scooter or motorcycle experience — not a beginner bike', b: 'Suits experienced riders only — one of the largest, most powerful automatics available to rent' },
      { label: 'Availability & price (live listings)', a: '16 listings across 6 shops in Chalong, Patong, Phuket Town & Rawai — ฿1,000–2,998/day', b: 'Currently limited to 1 listing from a single shop in Patong — ฿2,000/day' },
    ],
    verdict: 'Both are premium, larger-than-average automatics built for confident riders rather than beginners. Choose the Honda X-ADV if you want Honda’s dual-clutch automatic transmission (DCT) with optional paddle-shift control, off-road-inspired styling, and the wider choice of availability — it’s currently listed by six shops across Chalong, Patong, Phuket Town, and Rawai. Choose the Yamaha TMAX if outright power and sharp, motorcycle-like handling matter most and you don’t mind fewer options — right now it’s listed by just one shop in Patong, so confirm availability directly with the shop before you plan around it. Compare live listings and current pricing from real Phuket shops before you book.',
    faq: [
      { question: 'Is the X-ADV or TMAX better for a first-time rider in Phuket?', answer: 'Neither is a good first bike — both are larger, heavier automatics built for riders with some scooter or motorcycle experience. If you’re new to riding, a Honda PCX or Yamaha NMAX is a better starting point.' },
      { question: 'What’s the difference in engine size between the X-ADV and TMAX?', answer: 'Based on current live listings, the Honda X-ADV runs a 750cc engine and the Yamaha TMAX runs a 560cc engine — the X-ADV is the larger of the two.' },
      { question: 'Is the TMAX harder to find than the X-ADV in Phuket?', answer: 'Yes, right now — live listings show the X-ADV available from 6 shops across 4 areas (Chalong, Patong, Phuket Town, Rawai), while the TMAX is currently listed by just one shop in Patong. Confirm availability directly with the shop before planning around a TMAX rental.' },
      { question: 'Does the X-ADV or TMAX use a dual-clutch transmission?', answer: 'The X-ADV does — Honda’s dual-clutch automatic (DCT) with an optional manual-style paddle shift. The TMAX uses a standard fully-automatic (twist-and-go) transmission, with no DCT.' },
    ],
  },
]

export function getComparePage(slug: string): ComparePageMeta | undefined {
  return COMPARE_PAGES.find(p => p.slug === slug)
}
