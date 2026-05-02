export type ScooterCategory = 'automatic' | 'manual' | 'electric'
export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
export type DeliveryMethod = 'delivery' | 'pickup'

export interface Shop {
  id: string
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
  sortBy: 'price_asc' | 'price_desc' | 'rating' | 'distance'
}

export interface MapMarker {
  id: string
  lat: number
  lng: number
  price: number
  available: boolean
  type: 'scooter' | 'shop'
}
