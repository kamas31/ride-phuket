export const SITE_NAME = 'Ride Phuket'
export const SITE_TAGLINE = 'Premium Scooter Rentals'
export const SITE_DESCRIPTION = 'Find and contact trusted scooter rentals across Phuket. Compare shops, check availability, and connect directly — no platform fees.'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ridephuket.com'

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
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'distance', label: 'Nearest First' },
] as const

export const SCOOTER_CATEGORIES = [
  { value: 'all', label: 'All Types' },
  { value: 'automatic', label: 'Automatic' },
  { value: 'manual', label: 'Manual' },
  { value: 'electric', label: 'Electric' },
] as const

export const TRUST_BADGES = [
  { icon: 'shield', label: 'Verified Partners', desc: 'Every shop is vetted' },
  { icon: 'clock', label: 'Fast Response', desc: 'Most shops reply in minutes' },
  { icon: 'truck', label: 'Hotel Delivery', desc: 'We come to you' },
  { icon: 'headphones', label: 'WhatsApp Support', desc: 'Direct shop contact' },
] as const

export const BENEFITS = [
  {
    icon: 'MapPin',
    title: 'Delivered to You',
    description: 'Skip the taxi to the rental shop. Shops deliver directly to your hotel, villa, or address.',
  },
  {
    icon: 'Shield',
    title: 'Fully Insured',
    description: 'Every rental includes basic insurance. Upgrade for full comprehensive cover.',
  },
  {
    icon: 'Star',
    title: 'Vetted Partners',
    description: 'Only top-rated, verified rental shops. Every scooter is serviced and road-ready.',
  },
  {
    icon: 'MessageCircle',
    title: 'WhatsApp-First',
    description: 'Contact any shop directly on WhatsApp. No middlemen, no platform fees, no waiting.',
  },
] as const

export const NAV_LINKS = [
  { href: '/explore', label: 'Explore' },
  { href: '/bookings', label: 'My Rentals' },
  { href: '/profile', label: 'Profile' },
] as const
