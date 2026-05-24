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
    highlights: ['Largest selection in Patong', '10+ verified shops', 'Central island location'],
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
]

export function getArea(slug: string): AreaMeta | undefined {
  return AREAS.find(a => a.slug === slug)
}
