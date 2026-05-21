// Typed query helpers — Server-only. Import only from Server Components,
// Route Handlers, or Server Actions ('use server' files).
// Client components must call Server Actions instead.

import type { Scooter, Shop, Booking, MileageRange } from '@/types'
import { SCOOTERS, SHOPS, MOCK_BOOKINGS } from '@/data/scooters'

function isConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// ── SCOOTERS ────────────────────────────────────────────────

export async function getScooters(filters?: {
  location?: string
  category?: string
  available?: boolean
}): Promise<Scooter[]> {
  if (!isConfigured()) return applyFilters(SCOOTERS, filters)

  const { createClient } = await import('./server')
  const supabase = await createClient()

  let query = supabase
    .from('scooters')
    .select('*, shops(*)')
    .eq('available', filters?.available ?? true)
    .order('created_at', { ascending: false })

  if (filters?.location && filters.location !== 'all') {
    query = query.ilike('location', `%${filters.location}%`)
  }
  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }

  const { data, error } = await query
  if (error || !data) return applyFilters(SCOOTERS, filters)

  return data.map(mapDbScooter)
}

export async function getScooterById(id: string): Promise<Scooter | null> {
  if (!isConfigured()) return SCOOTERS.find(s => s.id === id) ?? null

  const { createClient } = await import('./server')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('scooters')
    .select('*, shops(*)')
    .eq('id', id)
    .single()

  if (error || !data) return SCOOTERS.find(s => s.id === id) ?? null
  return mapDbScooter(data)
}

// ── BOOKINGS ────────────────────────────────────────────────

export async function getUserBookings(userId: string): Promise<Booking[]> {
  if (!isConfigured()) return MOCK_BOOKINGS

  const { createClient } = await import('./server')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select('*, scooters(*), shops(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) return MOCK_BOOKINGS
  return data as unknown as Booking[]
}

export async function createBooking(payload: {
  userId: string
  scooterId: string
  shopId: string
  startDate: string
  endDate: string
  dailyRate: number
  deliveryFee: number
  totalAmount: number
  deliveryMethod: 'delivery' | 'pickup'
  deliveryAddress?: string
  notes?: string
}): Promise<{ id: string } | null> {
  if (!isConfigured()) {
    // Return a fake booking ID in dev
    return { id: `dev-${Date.now()}` }
  }

  // Use admin client — bookings are server-side and bypass RLS safely
  // The Server Action caller already validates the user is authenticated
  const { createAdminClient } = await import('./admin')
  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('bookings')
    .insert({
      user_id: payload.userId,
      scooter_id: payload.scooterId,
      shop_id: payload.shopId,
      start_date: payload.startDate,
      end_date: payload.endDate,
      daily_rate: payload.dailyRate,
      delivery_fee: payload.deliveryFee,
      total_amount: payload.totalAmount,
      delivery_method: payload.deliveryMethod,
      delivery_address: payload.deliveryAddress ?? null,
      notes: payload.notes ?? null,
      status: 'pending',
      payment_status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createBooking] Supabase error:', error.message, '| code:', error.code)
    return null
  }
  return { id: (data as { id: string }).id }
}

// createShopApplication removed — use app/actions/partner.ts:submitPartnerApplication

// ── HELPERS ──────────────────────────────────────────────────

function applyFilters(scooters: Scooter[], filters?: { location?: string; category?: string }) {
  return scooters.filter(s => {
    if (filters?.location && filters.location !== 'all') {
      if (!s.location.toLowerCase().includes(filters.location)) return false
    }
    if (filters?.category && filters.category !== 'all') {
      if (s.category !== filters.category) return false
    }
    return true
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbScooter(row: any): Scooter {
  return {
    id: row.id,
    shopId: row.shop_id,
    shop: row.shops ? mapDbShop(row.shops) : undefined,
    name: row.name,
    brand: row.brand,
    model: row.model,
    year: row.year ?? new Date().getFullYear(),
    category: row.category,
    images: row.images ?? [],
    coverImage: row.cover_image ?? null,
    pricePerDay: row.price_per_day,
    pricePerWeek: row.price_per_week ?? undefined,
    pricePerMonth: row.price_per_month ?? undefined,
    currency: 'THB',
    location: row.location ?? '',
    lat: row.lat ?? 7.95,
    lng: row.lng ?? 98.34,
    available: row.available,
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    features: row.features ?? [],
    specs: row.specs ?? {},
    deliveryAvailable: row.delivery_available,
    deliveryFee: row.delivery_fee,
    helmetIncluded: row.helmet_included,
    insuranceIncluded: row.insurance_included,
    minRentalDays: row.min_rental_days,
    description: row.description ?? '',
    createdAt: row.created_at ?? undefined,
    mileageRange: (row.mileage_range as MileageRange) ?? undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbShop(row: any): Shop {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    logo: row.logo_url ?? '',
    location: row.location,
    address: row.address ?? '',
    lat: row.lat ?? 7.95,
    lng: row.lng ?? 98.34,
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    verified: row.verified,
    responseTime: row.response_time ?? '< 15 min',
    phone: row.phone ?? '',
    whatsapp: row.whatsapp ?? undefined,
    coverImage: row.cover_image ?? null,
    deliveryZones: row.delivery_zones ?? [],
    openingHours: row.opening_hours ?? undefined,
    instagram: row.instagram ?? undefined,
    website: row.website ?? undefined,
  }
}

// ── SHOP BY SLUG ────────────────────────────────────────────
export type ShopWithFleet = Shop & { scooters: Scooter[] }

export async function getShopBySlug(slug: string): Promise<ShopWithFleet | null> {
  if (!isConfigured()) {
    const shop = SHOPS.find(s => s.slug === slug)
    if (!shop) return null
    const scooters = SCOOTERS.filter(s => s.shopId === shop.id && s.available)
    return { ...shop, scooters }
  }

  const { createClient } = await import('./server')
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shopRow, error } = await (supabase as any)
    .from('shops')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (error || !shopRow) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: scooterRows } = await (supabase as any)
    .from('scooters')
    .select('*, shops(*)')
    .eq('shop_id', (shopRow as any).id)
    .eq('available', true)
    .order('created_at', { ascending: false })

  const shop = mapDbShop(shopRow)
  const scooters = (scooterRows ?? []).map(mapDbScooter)
  return { ...shop, scooters }
}

// ── PLATFORM STATS (real counts from DB for homepage) ─────────
export async function getStats(): Promise<{ shopCount: number; scooterCount: number }> {
  if (!isConfigured()) return { shopCount: 0, scooterCount: 0 }

  const { createClient } = await import('./server')
  const supabase = await createClient()

  const [shopRes, scooterRes] = await Promise.all([
    supabase
      .from('shops')
      .select('id', { count: 'exact', head: true })
      .eq('verified', true)
      .eq('active', true),
    supabase
      .from('scooters')
      .select('id', { count: 'exact', head: true })
      .eq('available', true),
  ])

  return {
    shopCount:    shopRes.count    ?? 0,
    scooterCount: scooterRes.count ?? 0,
  }
}
