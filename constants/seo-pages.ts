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
  /** Recognized synonym/word-order variants that resolve to this SAME page (lib/brain/canonical-query.ts) — never a reason to create a new page, only Brain-awareness + content enrichment. Optional: absent on pages created before this field existed. */
  alternateQueries?: string[]
  title: string
  h1: string
  description: string
  longDescription: string
  contentSections: SeoContentSection[]
  highlights: string[]
  faq: SeoPageFaq[]
  /** Drives which REAL scooters this page lists — never a fabricated list. Optional: a purely informational guide may have none. */
  filter?: SeoPageFilter
  /** Structural facets for the internal-linking graph (lib/related-content.ts) — real constants/models.ts / constants/areas.ts slugs, never fabricated. Optional: absent on pages created before this field existed. */
  relevantModelSlugs?: string[]
  areaSlugs?: string[]
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
  {
    urlStrategy: 'guide',
    slug: 'do-i-need-a-license-to-rent-a-scooter-in-phuket',
    targetQuery: 'do i need a license to rent a scooter in phuket',
    title: 'Do You Need a License to Rent a Scooter in Phuket?',
    h1: 'Do You Need a License to Rent a Scooter in Phuket?',
    description: 'Yes — Thai law requires a motorcycle license or International Driving Permit to legally rent a scooter in Phuket. Here’s what you need to know.',
    longDescription: 'If you’re planning to rent a scooter in Phuket, the short answer is yes — Thailand requires a valid motorcycle license to ride one legally. That means either a Thai driving license with a motorcycle endorsement, or an International Driving Permit (IDP) carrying the Category A motorcycle class alongside your home country license. Many shops will still hand over the keys without checking, but that doesn’t make it legal, and it can leave you exposed if something goes wrong.',
    contentSections: [
      { heading: 'What license do you actually need', body: 'Thai law recognizes two ways to legally ride a scooter: a Thai driving license with a motorcycle category, or a foreign motorcycle license paired with an International Driving Permit (IDP) that carries the Category A endorsement — a car-only IDP does not count. One exception applies: riders holding a national driving license from an ASEAN member country, including Malaysia, Singapore, and the Philippines, can ride without an IDP.' },
      { heading: 'What happens if you’re stopped without a valid license', body: 'Riding without a valid motorcycle license or IDP is an offense in Thailand and can mean a fine at a police checkpoint. More importantly, most travel and medical insurance policies exclude coverage for accidents that happen while riding without a legally recognized license — so the bigger risk isn’t the fine, it’s being uninsured if you’re hurt.' },
      { heading: 'How to get ready before you arrive', body: 'An International Driving Permit has to be issued in your home country before you travel — Thailand does not issue them to visitors, so this isn’t something you can sort out after landing in Phuket. Apply through your home country’s motoring authority, confirm the motorcycle category is included, and bring it along with your regular driving license and passport when you pick up your scooter.' },
    ],
    highlights: ['A Thai motorcycle license or an International Driving Permit with the Category A motorcycle endorsement is legally required to ride a scooter in Phuket', 'Riders with a national driving license from an ASEAN country can ride without an IDP', 'An IDP must be arranged in your home country before you travel — it can’t be issued in Thailand', 'Riding without a valid license risks a fine and can void your travel insurance if you’re in an accident'],
    faq: [
      { question: 'Do I need an International Driving Permit (IDP) to rent a scooter in Phuket?', answer: 'In most cases, yes. Alongside your home country motorcycle license, you need an IDP with the Category A motorcycle endorsement to ride legally in Phuket — a car-only IDP isn’t valid for a scooter. The one exception is riders from ASEAN countries, who can use their national license without an IDP.' },
      { question: 'What happens if I rent a scooter in Phuket without a license?', answer: 'Shops may still rent to you without checking, but Thai police can fine you at a checkpoint for riding without a valid motorcycle license or IDP — and just as importantly, your travel or medical insurance can refuse to cover an accident if you weren’t legally licensed to ride.' },
      { question: 'Can I get an International Driving Permit after I arrive in Phuket?', answer: 'No. An IDP has to be issued by your home country’s motoring authority before you travel — Thailand doesn’t issue them to visitors, so this needs to be sorted out before you land.' },
    ],
    filter: undefined,
  },
  {
    urlStrategy: 'landing',
    slug: 'scooter-rental-phuket',
    targetQuery: 'scooter rental phuket',
    alternateQueries: [],
    title: 'Scooter Rental Phuket | 65 Real Listings',
    h1: 'Scooter Rental in Phuket',
    description: 'Scooter rental in Phuket made simple: 65 real, available automatic scooters across 16 verified shops, from ฿150/day, helmet and insurance included.',
    longDescription: 'Searching for scooter rental in Phuket? Koh Ride lists 65 real, available automatic scooters from 16 verified shops across all six areas of the island — Rawai, Phuket Town, Chalong, Patong, Kathu, and Kata. Every listing includes a helmet and insurance as standard, prices start from ฿150/day, and you contact each shop directly to book — no OTA markup, no middleman fees.',
    contentSections: [
      { heading: 'What’s included with every scooter rental in Phuket on Koh Ride', body: 'All 65 automatic scooters listed here include a helmet and insurance as standard, so there’s no separate add-on fee to negotiate with the shop. 28 of the 65 listings also offer delivery, so the shop can drop the scooter at your hotel or villa instead of you needing to collect it in person.' },
      { heading: 'Where to rent a scooter across Phuket', body: 'Koh Ride’s 16 verified shops offering scooter rental cover all six areas of Phuket: Rawai (21 listings), Phuket Town (19), Chalong (11), Patong (9), Kathu (3), and Kata (2) — so wherever you’re staying, there’s a real rental option nearby.' },
    ],
    highlights: ['65 real automatic scooters available right now, from Honda, Yamaha, and GPX', '16 verified shops across all 6 areas of Phuket: Rawai, Phuket Town, Chalong, Patong, Kathu, and Kata', 'Helmet and insurance included on every single listing, no extra fees', 'Prices from ฿150/day, with 56 scooters also offering a discounted monthly rate', '28 listings offer delivery to your hotel or villa'],
    faq: [
      { question: 'How much does scooter rental cost in Phuket?', answer: 'Scooter rental in Phuket on Koh Ride starts from ฿150/day for an automatic scooter, with most everyday models (Honda Click, Honda PCX, Yamaha NMAX) priced between ฿200 and ฿500/day depending on the shop. 65 real listings are available right now, all including helmet and insurance.' },
      { question: 'Which areas of Phuket have scooter rental shops?', answer: 'Koh Ride’s 16 verified shops offering scooter rental cover all six areas of Phuket: Rawai, Phuket Town, Chalong, Patong, Kathu, and Kata — so you can rent close to wherever you’re staying.' },
      { question: 'Does scooter rental in Phuket include a helmet and insurance?', answer: 'Yes — every one of the 65 automatic scooters listed on Koh Ride includes a helmet and insurance as standard, with no separate add-on fee.' },
      { question: 'Can I get a scooter delivered to my hotel in Phuket?', answer: 'Yes — 28 of the 65 available scooter listings on Koh Ride offer delivery, so the shop can drop the scooter off at your hotel or villa instead of you collecting it in person.' },
    ],
    filter: { category: 'automatic' },
    relevantModelSlugs: ['pcx', 'nmax', 'click'],
    areaSlugs: ['rawai', 'phuket-town', 'chalong', 'patong', 'kathu', 'kata'],
  },
  {
    urlStrategy: 'landing',
    slug: 'license-thailand-tourists-scooter',
    targetQuery: 'license thailand tourists scooter',
    alternateQueries: [],
    title: 'Scooter License for Tourists in Thailand',
    h1: 'Scooter License Requirements for Tourists in Thailand',
    description: 'Tourists need a motorcycle license or IDP with Category A to ride a scooter in Thailand. Browse 66 real automatic scooters across Phuket from ฿150/day.',
    longDescription: 'If you’re a tourist wondering what license you need to ride a scooter in Thailand, here’s the real answer: a Thai motorcycle license, or a foreign motorcycle license paired with an International Driving Permit carrying the Category A endorsement. Once you have it, Koh Ride lists 66 real automatic scooters from 16 verified shops across Phuket, ready to rent from ฿150/day with helmet and insurance included.',
    contentSections: [
      { heading: 'What license lets a tourist rent legally', body: 'Thailand recognizes two ways for a tourist to legally ride a scooter: a Thai driving license with a motorcycle category, or a foreign motorcycle license paired with an International Driving Permit (IDP) carrying the Category A endorsement — a car-only IDP does not count. Riders holding a national driving license from an ASEAN member country, including Malaysia, Singapore, and the Philippines, can ride without an IDP.' },
      { heading: 'Why it matters beyond avoiding a fine', body: 'Riding without a valid motorcycle license or IDP is an offense in Thailand and can mean a fine at a police checkpoint. More importantly, most travel and medical insurance policies exclude coverage for accidents that happen while riding without a legally recognized license, so the real risk isn’t the fine — it’s being uninsured if you’re hurt. An IDP has to be arranged in your home country before you travel; Thailand does not issue them to visitors.' },
      { heading: 'Automatic scooters ready for tourists in Phuket', body: 'Once your license or IDP is sorted, Koh Ride lists 66 real, available automatic scooters from 16 verified shops across all six areas of Phuket. Every listing includes a helmet and insurance as standard, prices start from ฿150/day, and 29 of the 66 listings offer delivery straight to your hotel.' },
    ],
    highlights: ['66 real automatic scooters are available now across 16 verified Phuket shops for tourists with a valid motorcycle license or IDP', 'A Thai motorcycle license or an International Driving Permit with the Category A endorsement lets tourists legally rent and ride', 'Riders from ASEAN countries, including Malaysia, Singapore, and the Philippines, can rent using just their national license, no IDP required', 'Every listed scooter includes helmet and insurance at no extra cost, with prices from ฿150/day', '29 of the 66 automatic scooters offer delivery, so the shop can bring it straight to your hotel'],
    faq: [
      { question: 'Can tourists rent a scooter in Thailand without a license?', answer: 'No — Thai law requires a motorcycle license or an International Driving Permit (IDP) with the Category A endorsement to legally ride a scooter, even as a tourist. Some shops may still hand over the keys without checking, but riding without one risks a fine and can void your travel insurance.' },
      { question: 'What license do I need as a tourist to rent a scooter in Thailand?', answer: 'You need either a Thai motorcycle license, or your home country’s motorcycle license paired with an International Driving Permit carrying the Category A endorsement — a car-only IDP doesn’t count. Riders from ASEAN countries can use their national license without an IDP.' },
      { question: 'How many automatic scooters can I rent in Phuket right now?', answer: 'Koh Ride currently lists 66 real, available automatic scooters from 16 verified shops across Phuket, priced from ฿150/day with helmet and insurance included, and 29 of them offer delivery.' },
    ],
    filter: { category: 'automatic' },
    relevantModelSlugs: ['xadv', 'pcx', 'click'],
    areaSlugs: ['rawai', 'phuket-town', 'chalong', 'patong', 'kathu', 'kata'],
  },
]

export function getSeoPage(slug: string, urlStrategy: 'guide' | 'landing'): SeoPageMeta | undefined {
  return SEO_PAGES.find(p => p.slug === slug && p.urlStrategy === urlStrategy)
}
