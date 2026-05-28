export const SITE_NAME = 'Koh Ride'
export const SITE_TAGLINE = 'Premium Scooter Rentals'
export const SITE_DESCRIPTION = 'Find and contact scooter rentals across Phuket. Compare listings, check availability, and connect directly — no platform fees.'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kohride.com'

export const CURRENCY = 'THB'
export const CURRENCY_SYMBOL = '฿'

export const PHUKET_CENTER = { lat: 7.9519, lng: 98.3381 }

export const LOCATIONS = [
  { id: 'all', label: 'All Phuket' },
  { id: 'patong', label: 'Patong' },
  { id: 'kata', label: 'Kata' },
  { id: 'karon', label: 'Karon' },
  { id: 'rawai', label: 'Rawai' },
  { id: 'phuket-town', label: 'Phuket Town' },
  { id: 'bang-tao', label: 'Bang Tao' },
  { id: 'kamala', label: 'Kamala' },
  { id: 'surin', label: 'Surin' },
] as const

export const PRICE_RANGE = { min: 150, max: 2000 }

export const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_asc',   label: 'Price: Low to High' },
  { value: 'price_desc',  label: 'Price: High to Low' },
  { value: 'rating',      label: 'Top Rated' },
  { value: 'distance',    label: 'Nearest First' },
] as const

export const SCOOTER_CATEGORIES = [
  { value: 'all', label: 'All Types' },
  { value: 'automatic', label: 'Automatic' },
  { value: 'manual', label: 'Manual' },
  { value: 'electric', label: 'Electric' },
] as const

export const TRUST_BADGES = [
  { icon: 'shield', label: 'Local Listings', desc: 'Scooters across Phuket' },
  { icon: 'clock', label: 'Fast Response', desc: 'Most shops reply in minutes' },
  { icon: 'mapPin', label: 'Local Shops', desc: 'Across all Phuket areas' },
  { icon: 'headphones', label: 'WhatsApp Support', desc: 'Direct shop contact' },
] as const

export const BENEFITS = [
  {
    icon: 'Shield',
    title: 'Direct Rentals',
    description: 'Scooters from local shops and independent owners. Real photos, honest pricing.',
  },
  {
    icon: 'MessageCircle',
    title: 'WhatsApp-First',
    description: 'Contact any shop directly on WhatsApp. No middlemen, no platform fees, no waiting.',
  },
] as const
