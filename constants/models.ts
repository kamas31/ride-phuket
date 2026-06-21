export interface ModelFAQ {
  question: string
  answer: string
}

export interface SubModel {
  label: string     // "ADV 350"
  pattern: RegExp   // tested against the scooter's `name` field — never a static count
}

export interface ModelMeta {
  slug: string
  /** Exact value to match against the DB `model` column (case-insensitive, no substring). */
  modelQuery: string
  name: string           // "Honda PCX"
  label: string          // "PCX" — short form for compact UI
  brand: 'Honda' | 'Yamaha'
  description: string
  longDescription: string
  whyChooseIt: string[]
  faq: ModelFAQ[]
  relatedModelSlugs: string[]
  /** Optional sub-variant split (e.g. ADV 160 vs 350) — counts computed live, never assumed. */
  subModels?: SubModel[]
}

export const MODELS: ModelMeta[] = [
  {
    slug: 'pcx',
    modelQuery: 'PCX',
    name: 'Honda PCX',
    label: 'PCX',
    brand: 'Honda',
    description: 'Find Honda PCX scooters for rent across Phuket. Compare real listings from local shops by area and price, then message the shop directly.',
    longDescription: 'The Honda PCX is one of the most popular automatic scooters to rent in Phuket — comfortable, fuel-efficient, and easy to ride for both first-timers and experienced riders. Its smooth automatic transmission and upright seating make it a common first choice for visitors getting around the island.',
    whyChooseIt: [
      'Fully automatic — no clutch or gear shifting',
      'Comfortable seating, good for longer rides between areas',
      'Strong fuel economy for day-to-day exploring',
      'Popular choice for first-time scooter riders in Phuket',
    ],
    faq: [
      { question: 'Is the Honda PCX automatic or manual?', answer: 'Automatic. The PCX has a CVT transmission with no clutch or gear shifting, which is why it’s a common choice for riders who are new to scooters.' },
      { question: 'Do I need a motorcycle license for a PCX in Phuket?', answer: 'Yes — Thai law requires a valid motorcycle license (international or Thai) to legally rent and ride a scooter like the PCX. Check the shop directly for their specific document requirements.' },
      { question: 'How much does it cost to rent a PCX in Phuket?', answer: 'Pricing varies by shop and rental length. Browse the live listings below for current day, week, and month rates from real shops.' },
      { question: 'Is the PCX good for two people?', answer: 'The PCX seats two, but it’s best suited to lighter riders or shorter trips with a passenger. For frequent two-up riding, some renters prefer a larger model like the ADV.' },
    ],
    relatedModelSlugs: ['nmax', 'adv'],
  },
  {
    slug: 'nmax',
    modelQuery: 'NMAX',
    name: 'Yamaha NMAX',
    label: 'NMAX',
    brand: 'Yamaha',
    description: 'Rent a Yamaha NMAX in Phuket. Browse real listings from local rental shops by area and price, then contact the shop directly.',
    longDescription: 'The Yamaha NMAX is a sportier, larger-bodied automatic scooter — popular with riders who want more presence and storage than entry-level models while staying fully automatic. It’s a common pick for longer-stay visitors covering more ground around Phuket.',
    whyChooseIt: [
      'Sportier styling and riding position than the PCX',
      'Larger under-seat storage, useful for day-trip gear',
      'Stable on Phuket’s hill roads (Patong, Kata)',
      'Popular with longer-stay riders covering more ground',
    ],
    faq: [
      { question: 'Is the NMAX bigger than the PCX?', answer: 'Yes — the NMAX has a larger body and more under-seat storage, while the PCX is generally considered the more comfortable, upright option for shorter riders.' },
      { question: 'What license do I need for an NMAX in Phuket?', answer: 'The same as any scooter rental in Thailand: a valid motorcycle license (international or Thai). Confirm specific requirements with the shop before booking.' },
      { question: 'Is the NMAX good for Phuket’s hills?', answer: 'Yes — riders generally find the NMAX stable and confident on hill roads like those around Patong and Kata, thanks to its slightly larger engine and wheelbase versus entry-level scooters.' },
      { question: 'Can I rent an NMAX for a month?', answer: 'Some shops offer monthly rates — check the live listings below for current pricing, or message a shop directly to ask about long-term rates.' },
    ],
    relatedModelSlugs: ['pcx', 'adv'],
  },
  {
    slug: 'adv',
    modelQuery: 'ADV',
    name: 'Honda ADV',
    label: 'ADV',
    brand: 'Honda',
    description: 'Rent a Honda ADV in Phuket — ADV 160 or ADV 350. Compare real listings from local shops, then message the shop directly to arrange pickup.',
    longDescription: 'The Honda ADV brings adventure-style, crossover looks to Phuket’s rental fleets — larger wheels, more ground clearance, and a riding position suited to riders who want one bike for both town traffic and exploring further afield.',
    whyChooseIt: [
      'Adventure/crossover styling with larger wheels and ground clearance',
      'Comfortable for longer rides between beach areas',
      'Popular with riders who want one bike for both town and exploration',
      'Roomy storage for day-trip essentials',
    ],
    faq: [
      { question: 'What’s the difference between the ADV 160 and ADV 350?', answer: 'The ADV 350 has a larger engine and more power than the ADV 160, but both share the same adventure-style design. Check the live listings below to see which is currently available from Phuket shops.' },
      { question: 'Is the ADV harder to ride than a PCX or NMAX?', answer: 'It’s slightly taller and heavier than the PCX or NMAX, but still fully automatic and manageable for most riders with some scooter experience.' },
      { question: 'Can I take an ADV up to viewpoints or hill roads?', answer: 'Yes — the ADV’s extra ground clearance and stability make it a solid choice for hill roads and viewpoint routes around Patong, Kata, and Karon.' },
    ],
    relatedModelSlugs: ['pcx', 'nmax'],
    subModels: [
      { label: 'ADV 160', pattern: /160/ },
      { label: 'ADV 350', pattern: /350/ },
    ],
  },
]

export function getModel(slug: string): ModelMeta | undefined {
  return MODELS.find(m => m.slug === slug)
}
