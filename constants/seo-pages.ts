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
    urlStrategy: 'guide',
    slug: 'car-license-ride-thailand-with-scooter',
    targetQuery: 'car license ride thailand with scooter',
    alternateQueries: [],
    title: 'Can You Ride a Scooter in Thailand with a Car License?',
    h1: 'Can You Ride a Scooter in Thailand with a Car License?',
    description: 'A car license alone isn’t enough to ride a scooter in Thailand. Here’s the real rule on car licenses, motorcycle licenses, and IDPs for tourists.',
    longDescription: 'If you’re wondering whether a car license lets you ride a scooter in Thailand, the answer is no — a car license doesn’t work, and neither does an IDP issued only for a car. Thai law requires a real motorcycle license, or an IDP with the Category A motorcycle endorsement, before you can legally ride a scooter with that license here. The one exception is riders with a national driving license from an ASEAN country, who can ride without needing an IDP at all.',
    contentSections: [
      { heading: 'Why a car license isn’t enough for a scooter', body: 'A driving license (or IDP) for cars only covers 4-wheeled vehicles under Thai law — it has no bearing on a 2-wheeled scooter or motorcycle. To ride a scooter, motorbike, or moped in Thailand you need a separate motorcycle license, or an IDP that specifically carries the Category A motorcycle class, issued in your home country alongside your regular license.' },
      { heading: 'What tourists with only a car license should do', body: 'If you only hold a car license, renting and riding a scooter in Thailand without also getting a motorcycle license or a Category A International Driving Permit means you’re riding without a valid license — which can mean a fine at a checkpoint, and just as importantly, can void your travel insurance if you’re in an accident. Riders from ASEAN countries are the one exception, and can use their national license without needing an IDP.' },
    ],
    highlights: ['A car license or car-only IDP does not cover riding a scooter in Thailand — a real legal fact, not a shop policy', 'You need either a motorcycle license or an IDP with the Category A motorcycle endorsement to ride legally', 'Riders with a national driving license from an ASEAN country can ride without needing an IDP', 'Riding on a car license alone risks a fine and can void your travel insurance if you’re in an accident'],
    faq: [
      { question: 'Can I ride a scooter in Thailand with just a car license?', answer: 'No. A car license, or an IDP issued only for cars, doesn’t cover riding a scooter in Thailand. You need a motorcycle license, or an IDP with the Category A motorcycle endorsement, to ride legally.' },
      { question: 'Is an International Driving Permit for cars enough to rent a scooter?', answer: 'No — a car-category IDP doesn’t cover motorcycles or scooters. You need an IDP that specifically includes the Category A motorcycle class, paired with your home country motorcycle license.' },
      { question: 'What if I only have a car license and want to ride a scooter in Phuket?', answer: 'You’d need to get a motorcycle license or a Category A IDP before you travel — Thailand doesn’t issue IDPs to visitors after arrival. The one exception is riders from ASEAN countries, who can ride on their national license without an IDP.' },
    ],
    filter: undefined,
    relevantModelSlugs: [],
    areaSlugs: [],
  },
  {
    urlStrategy: 'landing',
    slug: 'laws-thailand-tourists-scooter',
    targetQuery: 'laws thailand tourists scooter',
    alternateQueries: [],
    title: 'Scooter Laws in Thailand for Tourists',
    h1: 'Scooter Laws in Thailand for Tourists',
    description: 'Thailand’s scooter laws for tourists cover license and IDP rules, helmet requirements, insurance, and traffic rules you need before renting in Phuket.',
    longDescription: 'Every tourist renting a scooter in Thailand is bound by real, enforced laws, not just shop policy — a valid motorcycle license or International Driving Permit, a helmet for every rider and passenger, and Thailand’s compulsory third-party insurance. Koh Ride only lists real automatic scooters with helmet and insurance included as standard, and this page breaks down exactly what these laws mean for tourists riding in Phuket.',
    contentSections: [
      { heading: 'License and International Driving Permit (IDP) rules', body: 'Thai law requires a valid motorcycle license to ride any scooter — either a Thai driving license with a motorcycle endorsement, or a foreign motorcycle license paired with an International Driving Permit (IDP) carrying the Category A motorcycle class. A car-only IDP does not count. IDPs are recognized under the 1949 Geneva Road Traffic Convention and are issued by your home country’s motoring authority (AA, AAA, ADAC, RAC, and similar) before you travel — Thailand does not issue them to visitors. One exception: tourists holding a national driving license from an ASEAN country, including Malaysia, Singapore, and the Philippines, can ride without an IDP.' },
      { heading: 'Helmet law and fines', body: 'Wearing a helmet is compulsory by Thai law for both the rider and any pillion passenger. Police checkpoints — especially in busy tourist areas like Patong and Kata — do issue on-the-spot fines for riding without one, typically around ฿500. Riding without a valid motorcycle license or IDP is a separate offense and can mean a further fine of ฿500–฿1,000 at the same checkpoint.' },
      { heading: 'Insurance: what’s covered and what voids it', body: 'Thailand’s compulsory third-party insurance (Por Ror Bor) is required on every registered vehicle and should already be included in any legitimate rental — every automatic scooter listed on Koh Ride includes it as standard. It only covers injury to third parties, not damage to the scooter, your own injuries, or theft. Just as importantly, riding without a valid license typically voids this coverage, and can void your personal travel or medical insurance too if you’re in an accident.' },
      { heading: 'Traffic rules and passport safety every tourist should know', body: 'Thailand drives on the left, the same as the UK, Australia, and Japan. Speed limits are generally 30–50 km/h near beaches and towns, up to 80 km/h on urban roads, and up to 90 km/h on highways, with speed cameras and police patrols active on main routes. If a shop asks for your original passport as a security deposit, that’s technically illegal under Thai law — a cash deposit (typically ฿2,000–฿5,000) or a passport copy is the safer, legal alternative. If you’re in an accident, call the tourist police at 1155 or the regular police at 191 before moving any vehicles.' },
    ],
    highlights: ['A Thai motorcycle license or an International Driving Permit with the Category A endorsement is legally required to ride a scooter in Thailand', 'Helmets are compulsory by law for rider and passenger — checkpoint fines apply for going without one', '66 real automatic scooters on Koh Ride include Thailand’s compulsory third-party insurance and a helmet as standard, from ฿150/day', 'Handing over your original passport as a deposit is technically illegal — ask for a cash deposit or passport copy instead', 'Riding without a valid license can void both your Thai insurance and your personal travel insurance'],
    faq: [
      { question: 'What laws do tourists need to follow to ride a scooter in Thailand?', answer: 'Tourists need a valid motorcycle license — a Thai license or an International Driving Permit with the Category A motorcycle endorsement — plus a helmet for every rider and passenger, and Thailand’s compulsory third-party insurance, which should already be included in any legitimate rental.' },
      { question: 'Is it illegal to ride a scooter in Thailand without a helmet?', answer: 'Yes. Helmets are compulsory by law for both the rider and any pillion passenger, and police checkpoints — especially in tourist areas like Patong and Kata — issue on-the-spot fines of around ฿500 for riding without one.' },
      { question: 'Can tourists rent a scooter in Thailand without an International Driving Permit?', answer: 'Only if they hold a national driving license from an ASEAN country such as Malaysia, Singapore, or the Philippines. Everyone else needs an IDP with the Category A motorcycle class, arranged in their home country before travel — Thailand doesn’t issue IDPs to visitors.' },
      { question: 'Is it legal for a scooter shop to hold my passport as a deposit in Thailand?', answer: 'No — asking for your original passport as security is technically illegal under Thai law. A cash deposit, typically ฿2,000–฿5,000, or a passport copy, is the safer and legal alternative most shops will accept.' },
    ],
    filter: { category: 'automatic' },
    relevantModelSlugs: [],
    areaSlugs: [],
  },
  {
    urlStrategy: 'landing',
    slug: 'ride-tourists-scooter-phuket',
    targetQuery: 'ride tourists scooter phuket',
    alternateQueries: [],
    title: 'Can Tourists Ride Scooters in Phuket?',
    h1: 'Yes, Tourists Can Ride Scooters in Phuket',
    description: 'Yes — tourists can legally ride and rent scooters in Phuket with a valid motorcycle license or IDP. Browse 66 real automatic scooters from ฿150/day.',
    longDescription: 'Yes, tourists can rent and ride scooters in Phuket — it’s one of the most common ways visitors get around the island. Thai law allows it for any tourist holding a valid motorcycle license or an International Driving Permit (IDP) with the Category A endorsement alongside their home license. Koh Ride lists 66 real, available automatic scooters from 16 verified shops across the island, so once you have the right paperwork, you can compare real inventory and book directly — no OTA markup, no middleman fees.',
    contentSections: [
      { heading: 'Yes, tourists can ride scooters in Phuket', body: 'Renting and riding a scooter is completely normal for tourists visiting Phuket — thousands of visitors do it every day to get around the island independently. To ride legally, you need a valid motorcycle license or an International Driving Permit (IDP) carrying the Category A motorcycle endorsement alongside your home country license; riders holding a national license from an ASEAN country can ride without an IDP. Shops don’t always check, but riding without the right license can void your travel insurance if you’re in an accident.' },
      { heading: 'What to expect renting as a tourist in Phuket', body: 'Koh Ride lists 66 real, available automatic scooters from 16 verified shops across Phuket, all including a helmet and insurance as standard, so there’s nothing extra to negotiate at pickup. Automatic scooters like the Honda PCX, Yamaha NMAX, and Honda Click are the easiest option for tourists, since there’s no clutch to manage in Phuket’s traffic — and 29 of the current listings offer delivery straight to your hotel or villa.' },
    ],
    highlights: ['66 real automatic scooters available right now for tourists to rent across Phuket', 'A valid motorcycle license or International Driving Permit (Category A) is all tourists need to ride legally', '16 verified shops across the island, all including helmet and insurance as standard', 'Automatic models like the Honda PCX, Yamaha NMAX, and Honda Click are the easiest choice for first-time tourist riders', '29 listings offer delivery straight to your hotel or villa'],
    faq: [
      { question: 'Can tourists legally ride scooters in Phuket?', answer: 'Yes — tourists can ride scooters in Phuket as long as they hold a valid motorcycle license or an International Driving Permit (IDP) with the Category A motorcycle endorsement alongside their home license. Riders from ASEAN countries can use their national license without an IDP.' },
      { question: 'Do tourists need a license to rent a scooter in Phuket?', answer: 'Yes. Thai law requires a motorcycle license or IDP to ride legally — shops may not always check, but riding without one can void your travel insurance if you’re in an accident.' },
      { question: 'How much does it cost for a tourist to rent a scooter in Phuket?', answer: 'Automatic scooter rental for tourists on Koh Ride starts from ฿150/day, with 66 real listings currently available from 16 verified shops, all including helmet and insurance.' },
      { question: 'Is it easy for tourists to ride scooters in Phuket?', answer: 'Automatic scooters like the Honda Click and Honda PCX are the easiest option for tourists new to riding in Phuket traffic, since there’s no clutch to manage — every listing on Koh Ride also includes a helmet and insurance as standard.' },
    ],
    filter: { category: 'automatic' },
    relevantModelSlugs: ['pcx', 'nmax', 'click'],
    areaSlugs: ['rawai', 'phuket-town', 'chalong', 'patong', 'kathu', 'kata'],
  },
  {
    urlStrategy: 'landing',
    slug: 'driving-international-permit-thailand-scooter',
    targetQuery: 'driving international permit thailand scooter',
    alternateQueries: [],
    title: 'International Driving Permit for Thailand Scooter Rental',
    h1: 'International Driving Permit (IDP) for a Thailand Scooter Rental',
    description: 'Yes — an International Driving Permit is required to legally rent a scooter in Thailand. See real IDP rules, plus 66 automatic scooters from ฿150/day.',
    longDescription: 'Planning to rent a scooter in Thailand? An International Driving Permit (IDP) with the Category A motorcycle endorsement is legally required alongside your home country license before you can ride — a car-only IDP does not count, and it has to be arranged before you travel. Koh Ride lists 66 real automatic scooters from 16 verified shops across Phuket, all with helmet and insurance included, so once your International Driving Permit is sorted you can compare real inventory from ฿150/day and book directly with the shop.',
    contentSections: [
      { heading: 'What International Driving Permit you need for a scooter in Thailand', body: 'Thai law recognizes two ways to legally ride a scooter: a Thai motorcycle license, or a foreign motorcycle license paired with an International Driving Permit that carries the Category A endorsement — a car-only International Driving Permit does not count. Riders holding a national driving license from an ASEAN country, including Malaysia, Singapore, and the Philippines, can ride without an IDP.' },
      { heading: 'Getting your International Driving Permit ready before you travel', body: 'An International Driving Permit has to be issued by your home country’s motoring authority before you arrive — Thailand does not issue them to visitors, so this isn’t something you can sort out after landing. Bring it along with your regular driving license and passport when you pick up your scooter; riding without a valid IDP or license risks a fine and can void your travel insurance if you’re in an accident.' },
      { heading: 'Renting a scooter in Phuket once your IDP is sorted', body: 'Once you have a valid International Driving Permit, Koh Ride lists 66 real automatic scooters from 16 verified shops across Phuket, all with helmet and insurance included as standard. Prices start from ฿150/day, and 57 of these scooters offer a discounted monthly rate for longer stays.' },
    ],
    highlights: ['A Category A motorcycle endorsement on your International Driving Permit is legally required to ride a scooter in Thailand — a car-only IDP does not count', 'Your International Driving Permit must be issued in your home country before you travel — Thailand does not issue them to visitors', 'Riders with a national driving license from an ASEAN country can ride without an IDP', '66 real automatic scooters are available right now from 16 verified shops across Phuket, all with helmet and insurance included', 'Prices start from ฿150/day, with 57 scooters offering a discounted monthly rate for longer stays'],
    faq: [
      { question: 'Do I need an International Driving Permit to rent a scooter in Thailand?', answer: 'Yes. Alongside your home country motorcycle license, Thai law requires an International Driving Permit with the Category A motorcycle endorsement to ride a scooter legally — a car-only IDP is not valid. Riders from ASEAN countries can use their national license instead.' },
      { question: 'What class of International Driving Permit do I need for a Thailand scooter rental?', answer: 'You need the Category A (motorcycle) endorsement on your International Driving Permit. A standard car-only IDP does not cover riding a scooter or motorbike in Thailand.' },
      { question: 'Can I get an International Driving Permit after I arrive in Thailand?', answer: 'No. An International Driving Permit has to be issued by your home country’s motoring authority before you travel — Thailand does not issue them to visitors, so this needs to be arranged before you land.' },
      { question: 'Which scooters can I rent in Phuket with an International Driving Permit?', answer: 'Once your IDP is sorted, Koh Ride lists 66 real automatic scooters from 16 verified shops across Phuket — Honda PCX, Honda Click, and Yamaha NMAX are among the most popular — all including helmet and insurance, from ฿150/day.' },
    ],
    filter: { category: 'automatic' },
    relevantModelSlugs: ['pcx', 'click', 'nmax'],
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
  {
    urlStrategy: 'landing',
    slug: 'helmet-law-thailand-scooter',
    targetQuery: 'helmet law thailand scooter',
    alternateQueries: [],
    title: 'Thailand Helmet Law for Scooter Riders in Phuket',
    h1: 'Thailand’s Helmet Law for Scooter Riders',
    description: 'Thailand’s helmet law requires a helmet for every scooter rider and passenger, enforced in Phuket too — and every scooter on Koh Ride already includes one.',
    longDescription: 'Thailand’s helmet law is simple but real: every rider and passenger on a scooter or motorbike must wear an approved helmet, on every road in the country, including here in Phuket. It isn’t a suggestion — police checkpoints do enforce it, and it applies to visitors exactly the same as Thai residents. The good news is that renting through Koh Ride makes compliance automatic: every one of the 74 available scooters listed today already includes a helmet, with no separate fee, so you’re covered under the law before you even leave the shop.',
    contentSections: [
      { heading: 'What Thailand’s helmet law actually requires', body: 'Thailand’s Land Traffic Act requires every rider and every passenger on a scooter or motorbike to wear an approved helmet, on every road in the country — this includes Phuket, not just Bangkok. The law makes no exception for tourists or short-term rentals: if you’re on a scooter, a helmet is legally required, full stop.' },
      { heading: 'What happens if you’re stopped without one', body: 'Police checkpoints across Phuket, including on routes into Patong, Kata, and Chalong, do check for helmets, and riding without one can mean an on-the-spot fine. Beyond the legal risk, a helmet is also the single most effective piece of safety equipment on a scooter — Phuket’s mix of hills, sudden traffic, and unfamiliar roads makes it worth wearing even where enforcement is light.' },
      { heading: 'How Koh Ride makes this easy', body: 'Every one of the 74 available scooters listed on Koh Ride already includes a helmet as standard — there’s nothing extra to negotiate with the shop, so you’re compliant with Thailand’s helmet law from the moment you pick up the keys.' },
    ],
    highlights: ['Thailand’s helmet law requires an approved helmet for both the rider and any passenger, with no exemption for tourists or short-term rentals', 'All 74 available scooters on Koh Ride — automatic and manual — already include a helmet, so you’re compliant before you even leave the shop', '16 verified shops across Phuket hand over a helmet with every scooter, with no separate fee to negotiate', '66 automatic scooters, the easiest choice for riders new to Thailand’s roads, are available from ฿150/day', '57 of the 66 automatic scooters also offer a discounted monthly rate for longer stays'],
    faq: [
      { question: 'Is it actually the law to wear a helmet on a scooter in Thailand?', answer: 'Yes. Thailand’s Land Traffic Act requires an approved helmet for both the rider and any passenger on a scooter or motorbike, on every road in the country, including Phuket. It applies to tourists exactly the same as it applies to Thai residents.' },
      { question: 'Does my scooter rental in Phuket come with a helmet, or do I need to bring my own?', answer: 'On Koh Ride, yes — every one of the 74 available scooters currently listed includes a helmet as standard, with no separate fee. You don’t need to bring or buy your own to comply with Thailand’s helmet law.' },
      { question: 'What happens if I’m stopped riding without a helmet in Phuket?', answer: 'Riding without a helmet is an offense under Thai law, and police checkpoints across Phuket — including routes into Patong, Kata, and Chalong — do check. Being stopped can mean an on-the-spot fine, on top of the real safety risk of riding without one.' },
      { question: 'Does the helmet law apply to passengers too, not just the driver?', answer: 'Yes — Thailand’s helmet law applies to both the rider and any passenger on the scooter. If you’re riding two-up, check with the shop when you book to make sure a second helmet is provided.' },
    ],
    filter: { category: 'automatic' },
    relevantModelSlugs: ['xadv', 'pcx', 'click'],
    areaSlugs: ['rawai', 'phuket-town', 'chalong', 'patong', 'kathu', 'kata'],
  },
  {
    urlStrategy: 'guide',
    slug: 'cost-how-it-much-scooter-rental-phuket',
    targetQuery: 'cost how it much scooter rental phuket',
    alternateQueries: [],
    title: 'How Much Does It Cost to Rent a Scooter in Phuket?',
    h1: 'How Much Does It Cost to Rent a Scooter in Phuket?',
    description: 'How much does it cost to rent a scooter in Phuket? From ฿150-500/day for everyday models, up to ฿2,998/day for bigger automatics, or ฿3,500+/month.',
    longDescription: 'How much does it cost to rent a scooter in Phuket? On Koh Ride, 66 real automatic scooters from 16 verified shops are live right now, with everyday models like the Honda Click, Honda PCX, and Yamaha NMAX priced from ฿150 to ฿500 per day. Bigger automatics like the Honda XADV and Yamaha TMAX cost more, up to ฿2,998/day, and 57 of the 66 listings also offer a discounted monthly rate from ฿3,500 - a median saving of about 43% over paying daily.',
    contentSections: [
      { heading: 'What it actually costs to rent a scooter in Phuket, by duration', body: 'Day-to-day, scooter rental in Phuket ranges from ฿150 to ฿2,998, depending on the model - most everyday automatics (Honda Click, Honda PCX, Yamaha NMAX) cost ฿200-500/day. Renting by the month works out cheaper: 57 of the 66 available automatic scooters offer a discounted monthly rate, starting from ฿3,500/month, with a median saving of around 43% compared to paying the daily rate for a full month.' },
      { heading: 'Why some scooters cost more than others', body: 'The biggest cost driver is the model, not the shop. Everyday scooters - Honda Click, Honda PCX, Yamaha NMAX - sit at ฿150-500/day. Larger automatics cost noticeably more: the Honda ADV runs ฿400-700/day, the Honda Forza ฿700-900/day, and the Honda XADV and Yamaha TMAX ฿1,000-2,998/day. If you just need something to get around town, an everyday model keeps the cost down; a bigger automatic is a real cost jump, not a small upgrade fee.' },
      { heading: 'What’s included, and what can add to the cost', body: 'Every one of the 66 automatic scooters on Koh Ride already includes a helmet and insurance in the listed price - there’s no separate add-on fee to budget for. One thing that can affect your total cost: 19 of the 66 listings have a 7-day minimum rental, so a short 2-3 day trip on one of those isn’t available at the daily rate - factor that in before you book. Delivery is available on 29 listings if you’d rather not collect the scooter yourself.' },
    ],
    highlights: ['66 real automatic scooters live now, priced from ฿150/day', 'Everyday models (Honda Click, Honda PCX, Yamaha NMAX) cost ฿200-500/day', 'Bigger automatics like the Honda XADV cost more, up to ฿2,998/day', '57 of 66 scooters offer a discounted monthly rate from ฿3,500, saving a median of 43% vs daily', 'Helmet and insurance included in every price - no hidden add-on fees'],
    faq: [
      { question: 'How much does it cost to rent a scooter in Phuket per day?', answer: 'Day rates on Koh Ride range from ฿150 to ฿2,998 depending on the model. Everyday automatics like the Honda Click, Honda PCX, and Yamaha NMAX cost ฿200-500/day, while bigger automatics like the Honda XADV cost more, up to ฿2,998/day.' },
      { question: 'Is it cheaper to rent a scooter in Phuket by the month?', answer: 'Yes. 57 of the 66 automatic scooters on Koh Ride offer a discounted monthly rate, starting from ฿3,500/month, with a median saving of around 43% compared to paying the daily rate every day for a month.' },
      { question: 'Does the rental cost include a helmet and insurance in Phuket?', answer: 'Yes - every one of the 66 automatic scooters listed on Koh Ride includes a helmet and insurance in the price shown, with no separate add-on fee.' },
      { question: 'Are there any hidden costs when renting a scooter in Phuket?', answer: 'The main one to watch for is a minimum rental period: 19 of the 66 listings require at least 7 days, so a very short rental isn’t available at the daily rate on those. Otherwise, helmet, insurance, and (on 29 listings) delivery are already included in the price shown - there’s no separate markup.' },
    ],
    filter: { category: 'automatic' },
    relevantModelSlugs: ['click', 'pcx', 'nmax', 'adv', 'xadv', 'forza', 'tmax'],
    areaSlugs: ['rawai', 'phuket-town', 'chalong', 'patong', 'kathu', 'kata'],
  },
]

export function getSeoPage(slug: string, urlStrategy: 'guide' | 'landing'): SeoPageMeta | undefined {
  return SEO_PAGES.find(p => p.slug === slug && p.urlStrategy === urlStrategy)
}