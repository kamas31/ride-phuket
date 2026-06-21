export interface AreaMeta {
  slug: string
  name: string
  label: string
  description: string
  longDescription: string
  highlights: string[]
  nearbyAttractions: string[]
  priceFrom: number
}

export const AREAS: AreaMeta[] = [
  {
    slug: 'patong',
    name: 'Patong',
    label: 'Patong Beach',
    description: 'Rent a scooter in Patong Beach, Phuket. Contact local shops directly from ฿250/day.',
    longDescription: 'Patong is the heart of Phuket — vibrant, central, and perfectly positioned to explore the entire island. A scooter here gives you access to everything from the famous Bangla Road to viewpoints, temples, and quiet beaches just 20 minutes away.',
    highlights: ['Largest selection in Patong', 'Multiple rental shops', 'Central island location'],
    nearbyAttractions: ['Bangla Road', 'Patong Beach', 'Kalim Beach', 'Phuket Viewpoint', 'Big Buddha (25 min)'],
    priceFrom: 250,
  },
  {
    slug: 'kata',
    name: 'Kata',
    label: 'Kata Beach',
    description: 'Rent a scooter in Kata Beach, Phuket. Premium scooters from ฿250/day — contact shops directly.',
    longDescription: 'Kata is one of Phuket\'s most beautiful beaches — relaxed, photogenic, and ideal for exploring the southern end of the island. Rent here and reach Karon, Rawai, Promthep Cape, and Kata Noi in minutes.',
    highlights: ['Quiet beach area', 'Premium scooter selection', 'Close to Karon & Rawai'],
    nearbyAttractions: ['Kata Noi Beach', 'Karon Beach', 'Promthep Cape', 'Rawai Seafood Market', 'Tiger Park'],
    priceFrom: 250,
  },
  {
    slug: 'karon',
    name: 'Karon',
    label: 'Karon Beach',
    description: 'Rent a scooter in Karon Beach, Phuket. Contact local shops directly from ฿250/day.',
    longDescription: 'Karon Beach is the quieter, more family-friendly alternative to Patong. Wide beach, calm atmosphere, and excellent access to Phuket\'s interior. A scooter lets you explore at your own pace.',
    highlights: ['Family-friendly area', 'Less crowded than Patong', 'Great road access'],
    nearbyAttractions: ['Karon Viewpoint', 'Dino Park', 'Kata Beach', 'Patong (15 min)', 'Phuket Town (20 min)'],
    priceFrom: 250,
  },
  {
    slug: 'rawai',
    name: 'Rawai',
    label: 'Rawai',
    description: 'Rent a scooter in Rawai, Phuket. Best prices in the south from ฿180/day.',
    longDescription: 'Rawai is where expats and long-term visitors base themselves — authentic, affordable, and rich in local culture. From here, explore Chalong pier, Promthep Cape, and the sea gypsy village, all by scooter.',
    highlights: ['Best prices in Phuket south', 'Expat-friendly area', 'Authentic local vibe'],
    nearbyAttractions: ['Promthep Cape', 'Chalong Temple', 'Sea Gypsy Village', 'Nai Harn Beach', 'Ao Yon Beach'],
    priceFrom: 180,
  },
  {
    slug: 'bang-tao',
    name: 'Bang Tao',
    label: 'Bang Tao & Laguna',
    description: 'Rent a scooter in Bang Tao, Phuket. Explore the luxury north from ฿250/day.',
    longDescription: 'Bang Tao is Phuket\'s luxury northern coast — home to the Laguna complex, long white beaches, and some of the island\'s best restaurants. A scooter is the perfect way to explore the north without tuk-tuks.',
    highlights: ['Luxury villa area', 'Long peaceful beach', 'North Phuket access'],
    nearbyAttractions: ['Laguna Beach', 'Surin Beach', 'Cherngtalay market', 'Kamala Beach', 'Layan Beach'],
    priceFrom: 250,
  },
  {
    slug: 'phuket-town',
    name: 'Phuket Town',
    label: 'Phuket Town',
    description: 'Rent a scooter in Phuket Town. Explore the Old Town and beyond from ฿250/day.',
    longDescription: 'Phuket Town is the cultural and historical capital of the island — Sino-Portuguese architecture, incredible street food, and far fewer tourists than the beach areas. A scooter gives you the freedom to discover it all.',
    highlights: ['Cultural exploration base', 'Central island location', 'Near airport & pier'],
    nearbyAttractions: ['Old Town & Thalang Road', 'Sunday Walking Street', 'Rang Hill Viewpoint', 'Khao Rang', 'Central Festival Mall'],
    priceFrom: 250,
  },
  {
    slug: 'kamala',
    name: 'Kamala',
    label: 'Kamala Beach',
    description: 'Rent a scooter in Kamala Beach, Phuket. Peaceful village location from ฿250/day.',
    longDescription: 'Kamala is a peaceful mid-coast village between Patong and Surin — ideal for visitors wanting a quieter beach holiday without sacrificing access. From here, Patong, Surin, and Bang Tao are all under 15 minutes by scooter.',
    highlights: ['Quiet village atmosphere', 'Between Patong and Surin', 'Family-friendly area'],
    nearbyAttractions: ['Surin Beach', 'Patong (10 min)', 'Kamala Elephant Sanctuary', 'Fantasea Show', 'Bang Tao (20 min)'],
    priceFrom: 250,
  },
  {
    slug: 'surin',
    name: 'Surin',
    label: 'Surin Beach',
    description: 'Rent a scooter in Surin Beach, Phuket. Premium beach location from ฿250/day.',
    longDescription: 'Surin is one of Phuket\'s most upscale beach areas — calm, clear water, and perfectly positioned between the luxury north and the lively Patong area. A scooter connects you to Bang Tao, Kamala, and Cherngtalay in minutes.',
    highlights: ['Upscale beach area', 'Near Bang Tao & Kamala', 'Crystal clear water'],
    nearbyAttractions: ['Kamala Beach', 'Bang Tao Beach', 'Cherngtalay Market', 'Catch Beach Club', 'Laguna Golf Course'],
    priceFrom: 250,
  },
  {
    slug: 'chalong',
    name: 'Chalong',
    label: 'Chalong',
    description: 'Rent a scooter in Chalong, Phuket. Gateway to temples, islands, and south Phuket from ฿200/day.',
    longDescription: 'Chalong is the spiritual and maritime hub of south Phuket — home to the famous Wat Chalong temple and the main pier for day trips to Racha and Coral islands. A scooter here connects you to Rawai, Phuket Town, and all major south island attractions with ease.',
    highlights: ['Near Wat Chalong temple', 'Island day-trip pier', 'Central south Phuket location'],
    nearbyAttractions: ['Wat Chalong', 'Chalong Pier', 'Chalong Bay Rum Distillery', 'Rawai (5 min)', 'Big Buddha (10 min)'],
    priceFrom: 200,
  },
  {
    slug: 'nai-harn',
    name: 'Nai Harn',
    label: 'Nai Harn',
    description: 'Rent a scooter in Nai Harn, Phuket. One of Phuket\'s most beautiful beaches from ฿200/day.',
    longDescription: 'Nai Harn is consistently rated one of Phuket\'s most beautiful beaches — crystal clear water, a peaceful lake behind the beach, and proximity to the spectacular Promthep Cape viewpoint. Base yourself here and explore the entire southern tip of Phuket by scooter.',
    highlights: ['Stunning beach and lake', 'Near Promthep Cape viewpoint', 'Quiet and uncrowded'],
    nearbyAttractions: ['Nai Harn Lake', 'Promthep Cape', 'Ao Sane Beach', 'Rawai Seafood Market', 'Kata (10 min)'],
    priceFrom: 200,
  },
  {
    slug: 'cherng-talay',
    name: 'Cherng Talay',
    label: 'Cherng Talay',
    description: 'Rent a scooter in Cherng Talay, Phuket. North Phuket\'s expat hub from ฿250/day.',
    longDescription: 'Cherng Talay is the beating heart of north Phuket\'s expat and long-stay community — walkable village streets, Boat Avenue Market, quality restaurants, and proximity to the island\'s finest beaches. A scooter lets you reach Bang Tao, Surin, and Kamala in minutes.',
    highlights: ['Expat-friendly hub', 'Near Boat Avenue Market', 'Between Bang Tao & Surin'],
    nearbyAttractions: ['Boat Avenue Market', 'Bang Tao Beach', 'Surin Beach', 'Canal Village', 'Catch Beach Club'],
    priceFrom: 250,
  },
  {
    slug: 'kata-noi',
    name: 'Kata Noi',
    label: 'Kata Noi',
    description: 'Rent a scooter at Kata Noi, Phuket. Secluded cove beach from ฿250/day.',
    longDescription: 'Kata Noi is a small, secluded cove just south of Kata Beach — quieter, less developed, and frequently cited as one of Phuket\'s most photogenic spots. A scooter gives you quick access to Kata, Karon Viewpoint, and the entire southern coastline.',
    highlights: ['Secluded cove setting', 'Quiet and scenic', 'Steps from Kata Beach'],
    nearbyAttractions: ['Kata Beach', 'Karon Viewpoint', 'Tiger Park', 'Karon Beach (10 min)', 'Promthep Cape (25 min)'],
    priceFrom: 250,
  },
  {
    slug: 'mai-khao',
    name: 'Mai Khao',
    label: 'Mai Khao & Airport',
    description: 'Rent a scooter near Phuket Airport in Mai Khao. Northern Phuket\'s quiet beach from ฿250/day.',
    longDescription: 'Mai Khao is Phuket\'s northernmost district — home to the island\'s longest beach, Sirinat National Park, and Phuket International Airport. Perfect for visitors arriving at the airport who want wheels immediately, or long-stay visitors seeking the quietest corner of Phuket.',
    highlights: ['Closest to Phuket Airport', 'Long uncrowded beach', 'Sirinat National Park'],
    nearbyAttractions: ['Phuket International Airport', 'Nai Yang Beach', 'Sirinat National Park', 'Turtle nesting beach', 'Thalang (15 min)'],
    priceFrom: 250,
  },
  {
    slug: 'thalang',
    name: 'Thalang',
    label: 'Thalang',
    description: 'Rent a scooter in Thalang, central Phuket. Historical heart of the island from ฿230/day.',
    longDescription: 'Thalang is Phuket\'s historical district — site of the Heroines Monument, Thalang National Museum, and the ancient Wat Phra Thong temple. Centrally located, it\'s an ideal base for exploring both coasts and the island\'s interior on two wheels.',
    highlights: ['Historical and cultural district', 'Central island location', 'Near Khao Phra Thaeo rainforest'],
    nearbyAttractions: ['Heroines Monument', 'Thalang National Museum', 'Wat Phra Thong', 'Khao Phra Thaeo wildlife sanctuary', 'Bang Tao (15 min)'],
    priceFrom: 230,
  },
  {
    slug: 'cape-panwa',
    name: 'Cape Panwa',
    label: 'Cape Panwa',
    description: 'Rent a scooter at Cape Panwa, Phuket. Southeast peninsula with sea views from ฿250/day.',
    longDescription: 'Cape Panwa is a quiet, upscale peninsula on Phuket\'s southeast coast — dramatic sea views, the Phuket Aquarium, and a relaxed atmosphere far from the crowds. A scooter gives you easy access to Phuket Town, Ao Yon Beach, and ferry routes to nearby islands.',
    highlights: ['Upscale southeast peninsula', 'Sea views over islands', 'Near Phuket Aquarium'],
    nearbyAttractions: ['Phuket Aquarium', 'Ao Yon Beach', 'Phuket Town (15 min)', 'Ko Lon island views', 'Chalong (20 min)'],
    priceFrom: 250,
  },
  {
    slug: 'ko-sirey',
    name: 'Ko Sirey',
    label: 'Ko Sirey',
    description: 'Rent a scooter on Ko Sirey island, Phuket. Sea gypsy village and local life from ฿230/day.',
    longDescription: 'Ko Sirey is a small island connected to Phuket Town by a short bridge — famous for its Chao Leh (sea gypsy) community and authentic local atmosphere. Just minutes from Phuket Town, a scooter lets you explore the island\'s temples, seafood spots, and scenic coastal roads.',
    highlights: ['Authentic sea gypsy community', 'Connected to Phuket Town', 'Local and uncrowded'],
    nearbyAttractions: ['Sea Gypsy Village', 'Ko Sirey Temple', 'Phuket Town (10 min)', 'Ao Yon Beach (20 min)', 'Rawai (25 min)'],
    priceFrom: 230,
  },
  {
    slug: 'kathu',
    name: 'Kathu',
    label: 'Kathu',
    description: 'Rent a scooter in Kathu, Phuket. Central location minutes from Patong from ฿250/day.',
    longDescription: 'Kathu sits inland between Patong and Phuket Town, home to the scenic Kathu Waterfall and a quieter, more local pace than the nearby beach strip. A scooter here puts Patong\'s nightlife, Phuket Town\'s old quarter, and the island\'s interior all within easy reach.',
    highlights: ['Central, inland location', 'Near Kathu Waterfall', 'Minutes from Patong'],
    nearbyAttractions: ['Kathu Waterfall', 'Patong Beach (10 min)', 'Phuket Town (20 min)', 'Bangla Road (10 min)'],
    priceFrom: 250,
  },
]

export function getArea(slug: string): AreaMeta | undefined {
  return AREAS.find(a => a.slug === slug)
}

const LOCATION_ALIASES: Record<string, string> = {
  'cherngtalay': 'cherng-talay',
  'cherng talay': 'cherng-talay',
  'nai yang': 'mai-khao',
  'nai yang beach': 'mai-khao',
  'airport': 'mai-khao',
  'phuket airport': 'mai-khao',
  'koh sirey': 'ko-sirey',
  'koh siray': 'ko-sirey',
  'ko siray': 'ko-sirey',
  'kata noi': 'kata-noi',
  'nai harn': 'nai-harn',
  'naiharn': 'nai-harn',
  'bang tao': 'bang-tao',
  'bangtao': 'bang-tao',
  'cape panwa': 'cape-panwa',
  'panwa': 'cape-panwa',
}

export function getAreaForLocation(location: string): AreaMeta | undefined {
  const loc = location.toLowerCase().trim()
  const aliasSlug = LOCATION_ALIASES[loc]
  if (aliasSlug) return AREAS.find(a => a.slug === aliasSlug)
  return AREAS.find(a => loc.includes(a.name.toLowerCase()))
}
