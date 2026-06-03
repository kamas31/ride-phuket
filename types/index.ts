export type PlanType = 'free' | 'pro' | 'premium' | 'founding_partner'

export type ScooterCategory = 'automatic' | 'manual' | 'electric'

export interface OpeningHoursDay {
  enabled: boolean
  open: string   // "08:00"
  close: string  // "20:00"
}

export interface OpeningHoursSchedule {
  monday:    OpeningHoursDay
  tuesday:   OpeningHoursDay
  wednesday: OpeningHoursDay
  thursday:  OpeningHoursDay
  friday:    OpeningHoursDay
  saturday:  OpeningHoursDay
  sunday:    OpeningHoursDay
}
export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
export type DeliveryMethod = 'delivery' | 'pickup'
export type MileageRange = '0-10000' | '10000-20000' | '20000-30000' | '30000-50000' | '50000+'
export type DepositType = 'cash' | 'card_hold' | 'flexible' | 'none'

export interface Shop {
  id: string
  ownerId?: string | null
  name: string
  slug: string
  description: string
  logo: string
  location: string
  address: string
  lat: number
  lng: number
  rating: number
  reviewCount: number
  verified: boolean
  responseTime: string
  phone: string
  whatsapp?: string
  // Premium shop fields (migration 005)
  coverImage?: string | null
  deliveryZones?: string[]
  openingHours?: OpeningHoursSchedule
  instagram?: string
  website?: string
  // Extended fields (migration 013)
  lineId?: string
  telegram?: string
  googleMapsLink?: string
  gallery?: string[]
  // Deposit protection (migration 011)
  depositProtectedMember?: boolean
  planType?: PlanType
  // Location visibility (migration 020)
  locationVisibility?: 'exact' | 'approximate'
  // Opening hours visibility (migration 022)
  showOpeningHours?: boolean
}

export interface Scooter {
  id: string
  shopId: string
  shop?: Shop
  name: string
  brand: string
  model: string
  year: number
  category: ScooterCategory
  images: string[]
  coverImage?: string | null  // explicit cover; falls back to images[0]
  pricePerDay: number
  pricePerWeek?: number
  pricePerMonth?: number
  currency: 'THB'
  location: string
  lat: number
  lng: number
  available: boolean
  rating: number
  reviewCount: number
  features: string[]
  specs: ScooterSpecs
  deliveryAvailable: boolean
  deliveryFee: number
  helmetIncluded: boolean
  insuranceIncluded: boolean
  minRentalDays: number
  description: string
  createdAt?: string       // ISO date — used for "New listing" badge (< 30 days)
  mileageRange?: MileageRange
  // Deposit & trust fields (migration 011)
  depositAmount?: number        // THB, refundable deposit
  depositType?: DepositType
  passportRequired?: boolean    // true for premium/high-value bikes only
  passportCopyAllowed?: boolean // true = copy OK, not original
  isPremiumBike?: boolean       // 500cc+ or high-value — legitimate to require passport
  depositNotes?: string
}

export interface ScooterSpecs {
  engine: string
  power: string
  fuelCapacity: string
  consumption: string
  weight: string
  storage: string
}

export interface Booking {
  id: string
  userId: string
  scooterId: string
  scooter?: Scooter
  shopId: string
  shop?: Shop
  status: BookingStatus
  startDate: string
  endDate: string
  totalDays: number
  dailyRate: number
  deliveryFee: number
  totalAmount: number
  deliveryMethod: DeliveryMethod
  deliveryAddress?: string
  pickupLocation?: string
  paymentStatus: 'pending' | 'paid' | 'refunded'
  createdAt: string
  notes?: string
}

export interface Review {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  scooterId?: string
  shopId?: string
  rating: number
  comment: string
  createdAt: string
  verified: boolean
}

// Full review with resolved author name — used on the shop page
export interface ShopReview {
  id: string
  userId: string
  displayName: string           // "Kevin B." — privacy-safe
  initials: string              // "KB"
  avatarUrl: string | null      // reviewer's profiles.avatar_url
  shopLogoUrl: string | null    // shop's shops.logo_url — used in owner reply attribution
  rating: number
  comment: string
  createdAt: string
  updatedAt: string
  verified: boolean
  ownerReply: string | null
  ownerReplyCreatedAt: string | null
}

export type ReviewReportReason = 'never_rented' | 'fake_review' | 'harassment' | 'spam' | 'other'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  phone?: string
  nationality?: string
  passportNumber?: string
  licenseNumber?: string
  verified: boolean
  createdAt: string
}

export interface FilterState {
  priceMin: number
  priceMax: number
  category: ScooterCategory | 'all'
  deliveryNow: boolean
  helmetIncluded: boolean
  location: string | 'all'
  sortBy: 'recommended' | 'price_asc' | 'price_desc' | 'rating' | 'distance'
  depositProtected: boolean  // Koh Ride Deposit Protection enrolled shops
  noPassport: boolean        // no passport required (standard scooters only)
}

export interface MapMarker {
  id: string
  lat: number
  lng: number
  price: number
  available: boolean
  type: 'scooter' | 'shop'
}
