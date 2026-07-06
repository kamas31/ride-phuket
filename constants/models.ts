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
    longDescription: 'The Yamaha NMAX is a sportier, larger-bodied automatic scooter — popular with riders who want more presence and storage than entry-level models while staying fully automatic. It’s a common pick for longer-stay visitors covering more ground around Phuket. Many riders also pick the NMAX as a comfortable option for two people, given its longer seat and larger frame compared to entry-level scooters.',
    whyChooseIt: [
      'Sportier styling and riding position than the PCX',
      'Larger under-seat storage, useful for day-trip gear',
      'Stable on Phuket’s hill roads (Patong, Kata)',
      'Popular with longer-stay riders covering more ground',
      'A natural step up for riders who’ve outgrown a 125cc scooter',
      'Twist-and-go automatic — no clutch or gear changes to learn',
      'Sits between compact scooters like the Click and full maxi-scooters like the XMAX',
    ],
    faq: [
      { question: 'Is the NMAX bigger than the PCX?', answer: 'Yes — the NMAX has a larger body and more under-seat storage, while the PCX is generally considered the more comfortable, upright option for shorter riders.' },
      { question: 'What license do I need for an NMAX in Phuket?', answer: 'The same as any scooter rental in Thailand: a valid motorcycle license (international or Thai). Confirm specific requirements with the shop before booking.' },
      { question: 'Is the NMAX good for Phuket’s hills?', answer: 'Yes — riders generally find the NMAX stable and confident on hill roads like those around Patong and Kata, thanks to its slightly larger engine and wheelbase versus entry-level scooters.' },
      { question: 'Can I rent an NMAX for a month?', answer: 'Some shops offer monthly rates — check the live listings below for current pricing, or message a shop directly to ask about long-term rates.' },
      { question: 'Is the NMAX comfortable for two riders?', answer: 'Its longer seat and larger frame make it a common choice for two people in Phuket — confirm comfort and any weight guidance directly with the rental shop.' },
      { question: 'How much does it cost to rent an NMAX in Phuket?', answer: 'Prices vary by shop and how long you rent — daily, weekly, and monthly rates all differ. Browse the live NMAX listings below to compare current pricing from real Phuket shops before you book.' },
      { question: 'Is the NMAX a good scooter for beginners?', answer: 'It’s fully automatic and straightforward to ride, but it’s a little larger and sportier than entry-level scooters like the Click or Lead. Riders with some scooter experience tend to feel most at home on it, while complete first-timers sometimes prefer starting on a lighter model.' },
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
  {
    slug: 'xadv',
    modelQuery: 'XADV',
    name: 'Honda X-ADV',
    label: 'X-ADV',
    brand: 'Honda',
    description: 'Rent a Honda X-ADV in Phuket. Compare real listings from local shops by area and price, then message the shop directly to arrange pickup.',
    longDescription: 'The Honda X-ADV is a larger, more premium crossover than the regular ADV — built with a dual-clutch automatic transmission, off-road-inspired styling, and more power for riders who want a bigger, more capable bike for covering Phuket end to end.',
    whyChooseIt: [
      'Dual-clutch automatic — no clutch, but with manual-style paddle shift if you want it',
      'Larger and more powerful than the standard ADV',
      'Off-road-inspired styling and ground clearance',
      'Suited to confident riders who want one bike for town and longer routes',
    ],
    faq: [
      { question: 'How is the X-ADV different from the regular ADV?', answer: 'The X-ADV is larger, more powerful, and uses Honda’s dual-clutch automatic transmission (DCT) rather than a standard CVT. It’s positioned as a step up from the ADV for riders who want more performance.' },
      { question: 'Is the X-ADV harder to ride than other automatics in Phuket?', answer: 'It’s taller and heavier than a PCX, NMAX, or standard ADV, so it suits riders with some scooter or motorcycle experience rather than complete beginners.' },
      { question: 'Do I need a special license for the X-ADV?', answer: 'You need a valid motorcycle license, same as any scooter rental in Thailand — check the engine size against your license class with the shop directly before booking.' },
    ],
    relatedModelSlugs: ['adv', 'nmax'],
  },
  {
    slug: 'forza',
    modelQuery: 'FORZA',
    name: 'Honda Forza',
    label: 'Forza',
    brand: 'Honda',
    description: 'Rent a Honda Forza in Phuket. Compare real listings from local shops by area and price, then message the shop directly.',
    longDescription: 'The Honda Forza is a maxi-scooter built for comfort over distance — a more upright, wind-protected riding position, generous underseat storage, and a smooth automatic transmission that suits longer days of exploring or daily commuting around Phuket.',
    whyChooseIt: [
      'Maxi-scooter comfort for longer rides between areas',
      'Large underseat storage — useful for shopping, beach gear, or day-trip bags',
      'Wind protection from the full-size front fairing',
      'Smooth automatic transmission, easy for most riders',
    ],
    faq: [
      { question: 'Is the Forza good for long rides around Phuket?', answer: 'Yes — its upright seating, wind protection, and larger frame make it more comfortable than entry-level scooters for longer days exploring the island.' },
      { question: 'How much storage does the Forza have?', answer: 'The Forza has generous underseat storage, typically enough for a full-face helmet plus a day bag — check with the shop for the exact capacity of their listing.' },
      { question: 'What license do I need for a Forza in Phuket?', answer: 'A valid motorcycle license is required, the same as any scooter rental in Thailand. Confirm specific requirements with the shop before booking.' },
    ],
    relatedModelSlugs: ['xmax', 'adv'],
  },
  {
    slug: 'xmax',
    modelQuery: 'XMAX',
    name: 'Yamaha XMAX',
    label: 'XMAX',
    brand: 'Yamaha',
    description: 'Rent a Yamaha XMAX in Phuket. Compare real listings from local shops by area and price, then message the shop directly.',
    longDescription: 'The Yamaha XMAX is a sporty maxi-scooter — sharper handling than touring-focused alternatives, a confident riding position, and enough power and storage to comfortably cover Phuket’s beach roads and hill routes in one bike.',
    whyChooseIt: [
      'Sportier handling than other maxi-scooters',
      'Strong enough for hill roads and longer routes around Phuket',
      'Comfortable upright seating with good wind protection',
      'Popular with riders who want presence and performance in one bike',
    ],
    faq: [
      { question: 'Is the XMAX good on Phuket’s hill roads?', answer: 'Yes — riders generally find the XMAX confident and stable on hill roads like those around Patong, Kata, and Karon, thanks to its larger engine and sportier chassis.' },
      { question: 'How does the XMAX compare to the Forza?', answer: 'Both are maxi-scooters in a similar class — the XMAX tends to feel sportier and more performance-focused, while the Forza leans toward comfort-first touring. Either works well for longer Phuket rides.' },
      { question: 'What license do I need for an XMAX in Phuket?', answer: 'A valid motorcycle license is required, the same as any scooter rental in Thailand. Confirm specific requirements with the shop before booking.' },
    ],
    relatedModelSlugs: ['forza', 'adv'],
  },
  {
    slug: 'click',
    modelQuery: 'CLICK',
    name: 'Honda Click',
    label: 'Click',
    brand: 'Honda',
    description: 'Rent a Honda Click in Phuket. Compare real listings from local shops by area and price, then message the shop directly.',
    longDescription: 'The Honda Click is a lightweight, economical automatic scooter — easy to handle in traffic, simple to park, and a practical, budget-friendly choice for getting around Phuket’s towns and beach areas day to day.',
    whyChooseIt: [
      'Lightweight and easy to handle, even for newer riders',
      'Budget-friendly daily rental option',
      'Easy to park in busy areas like Patong or Phuket Town',
      'Simple, low-maintenance automatic transmission',
    ],
    faq: [
      { question: 'Is the Honda Click a good choice for beginners?', answer: 'Yes — it’s one of the lighter, easier-to-handle automatics available in Phuket, which makes it a common pick for riders newer to scooters.' },
      { question: 'Is the Click good for two people?', answer: 'It’s best suited to a single rider or light passenger and short trips — for frequent two-up riding, a larger model like the PCX or NMAX may be more comfortable.' },
      { question: 'Do I need a license to rent a Click in Phuket?', answer: 'Yes — a valid motorcycle license (international or Thai) is required to legally rent and ride any scooter in Phuket, including the Click.' },
    ],
    relatedModelSlugs: ['lead', 'pcx'],
  },
  {
    slug: 'lead',
    modelQuery: 'LEAD',
    name: 'Honda Lead',
    label: 'Lead',
    brand: 'Honda',
    description: 'Rent a Honda Lead in Phuket. Compare real listings from local shops by area and price, then message the shop directly.',
    longDescription: 'The Honda Lead is a practical step-through commuter scooter known for its spacious underseat storage and easy, low-speed handling — a comfortable everyday choice for running errands, beach trips, and getting around Phuket without fuss.',
    whyChooseIt: [
      'Step-through frame — easy to get on and off, even with bags',
      'Spacious underseat storage for everyday use',
      'Light and easy to handle at low speed and in traffic',
      'Practical, comfortable choice for day-to-day riding',
    ],
    faq: [
      { question: 'What makes the Honda Lead different from other small scooters?', answer: 'The Lead is known for its step-through frame and generous underseat storage, making it especially practical for everyday errands, shopping, and beach trips.' },
      { question: 'Is the Lead good for beginners?', answer: 'Yes — it’s light, easy to handle at low speed, and straightforward for riders newer to scooters, similar to the Click.' },
      { question: 'Do I need a license to rent a Lead in Phuket?', answer: 'Yes — a valid motorcycle license (international or Thai) is required to legally rent and ride any scooter in Phuket, including the Lead.' },
    ],
    relatedModelSlugs: ['click', 'pcx'],
  },
  {
    slug: 'tmax',
    modelQuery: 'TMAX',
    name: 'Yamaha TMAX',
    label: 'TMAX',
    brand: 'Yamaha',
    description: 'Rent a Yamaha TMAX in Phuket. Compare real listings from local shops by area and price, then message the shop directly.',
    longDescription: 'The Yamaha TMAX is the most powerful maxi-scooter commonly available to rent in Phuket — built for experienced riders who want serious performance, sharp handling, and motorcycle-level presence in a fully automatic package.',
    whyChooseIt: [
      'Most powerful maxi-scooter commonly available to rent in Phuket',
      'Sharp, motorcycle-like handling despite being fully automatic',
      'Strong on hill roads and longer routes around the island',
      'Suited to experienced riders who want more performance than a standard maxi-scooter',
    ],
    faq: [
      { question: 'Is the Yamaha TMAX a good choice for beginners?', answer: 'No — the TMAX is one of the largest and most powerful automatic scooters available, so it suits experienced riders rather than those new to scooters or motorcycles.' },
      { question: 'What license do I need for a TMAX in Phuket?', answer: 'A valid motorcycle license is required, the same as any scooter rental in Thailand — check the engine size against your license class with the shop directly before booking, since the TMAX is a larger-displacement bike.' },
      { question: 'How does the TMAX compare to the XMAX or Forza?', answer: 'The TMAX is larger, more powerful, and more expensive than both — positioned as the top-tier maxi-scooter option, while the XMAX and Forza are closer in size and price to each other.' },
    ],
    relatedModelSlugs: ['xmax', 'forza'],
  },
]

export function getModel(slug: string): ModelMeta | undefined {
  return MODELS.find(m => m.slug === slug)
}
