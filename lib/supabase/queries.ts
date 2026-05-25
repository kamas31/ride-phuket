// Typed query helpers — Server-only. Import only from Server Components,
// Route Handlers, or Server Actions ('use server' files).
// Client components must call Server Actions instead.

import type { Scooter, Shop, Booking, MileageRange, PlanType } from '@/types'
import { getZoneForLocation } from '@/lib/zones'

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
  if (!isConfigured()) return []

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
  if (error || !data) return []

  return data.map(mapDbScooter)
}

export async function getScooterById(id: string): Promise<Scooter | null> {
  if (!isConfigured()) return null

  const { createClient } = await import('./server')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('scooters')
    .select('*, shops(*)')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return mapDbScooter(data)
}

// ── BOOKINGS ────────────────────────────────────────────────

export async function getUserBookings(userId: string): Promise<Booking[]> {
  if (!isConfigured()) return []

  const { createClient } = await import('./server')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select('*, scooters(*), shops(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as unknown as Booking[]
}

// ── SHOP BOOKINGS (for partner dashboard) ───────────────────────
export interface ShopBookingRow {
  id: string
  scooter_id: string
  user_id: string
  shop_id: string
  status: string
  start_date: string
  end_date: string
  total_days: number
  daily_rate: number
  delivery_fee: number
  total_amount: number
  delivery_method: string
  delivery_address: string | null
  notes: string | null
  created_at: string
  scooters: { id: string; name: string; images: string[]; cover_image: string | null } | null
  rider: { id: string; name: string; phone: string | null; avatar_url: string | null } | null
}

export async function getShopBookings(shopId: string): Promise<ShopBookingRow[]> {
  if (!isConfigured()) return []

  const { createAdminClient } = await import('./admin')
  const admin = createAdminClient()

  // Look back 30 days + all future bookings
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bookings, error } = await (admin as any)
    .from('bookings')
    .select('*, scooters(id, name, images, cover_image)')
    .eq('shop_id', shopId)
    .gte('end_date', cutoff)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !bookings) return []

  // Fetch rider profiles separately (admin bypasses RLS)
  const riderIds = [...new Set((bookings as { user_id: string }[]).map(b => b.user_id))]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: riders } = await (admin as any)
    .from('profiles')
    .select('id, name, phone, avatar_url')
    .in('id', riderIds)

  const riderMap = new Map<string, ShopBookingRow['rider']>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (riders ?? []).map((r: any) => [r.id, r])
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (bookings as any[]).map(b => ({
    ...b,
    rider: riderMap.get(b.user_id) ?? null,
  }))
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

  // ── Availability check (double protection: DB trigger also catches this) ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: available, error: availErr } = await (admin as any).rpc(
    'is_scooter_available',
    {
      p_scooter_id: payload.scooterId,
      p_start_date: payload.startDate,
      p_end_date:   payload.endDate,
      p_exclude_id: null,
    }
  )

  if (availErr) {
    console.error('[createBooking] availability check failed:', availErr.message)
    // Don't block if the function doesn't exist yet — migration may not have run
  } else if (available === false) {
    console.warn('[createBooking] scooter not available for', payload.startDate, payload.endDate)
    return null  // caller treats null as "unavailable"
  }

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
    // Prefer shop precise coordinates (set via PinPickerMap), fall back to scooter's own,
    // then zone centre, then Phuket island centre.
    // Use || (not ??) so that 0 values also fall through to the next candidate.
    lat: row.shops?.lat || row.lat || getZoneForLocation(row.location ?? '')?.lat || 7.9519,
    lng: row.shops?.lng || row.lng || getZoneForLocation(row.location ?? '')?.lng || 98.3381,
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
    depositAmount: row.deposit_amount ?? undefined,
    depositType: row.deposit_type ?? undefined,
    passportRequired: row.passport_required ?? false,
    passportCopyAllowed: row.passport_copy_allowed ?? true,
    isPremiumBike: row.is_premium_bike ?? false,
    depositNotes: row.deposit_notes ?? undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbShop(row: any): Shop {
  let openingHours
  if (row.opening_hours) {
    try {
      openingHours = typeof row.opening_hours === 'string'
        ? JSON.parse(row.opening_hours)
        : row.opening_hours
    } catch { /* malformed JSON — treat as unset */ }
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    logo: row.logo_url ?? '',
    location: row.location,
    address: row.address ?? '',
    lat: row.lat ?? getZoneForLocation(row.location ?? '')?.lat ?? 7.9519,
    lng: row.lng ?? getZoneForLocation(row.location ?? '')?.lng ?? 98.3381,
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    verified: row.verified,
    responseTime: row.response_time ?? '< 15 min',
    phone: row.phone ?? '',
    whatsapp: row.whatsapp ?? undefined,
    coverImage: row.cover_image ?? null,
    deliveryZones: row.delivery_zones ?? [],
    openingHours,
    instagram: row.instagram ?? undefined,
    website: row.website ?? undefined,
    lineId: row.line_id ?? undefined,
    telegram: row.telegram ?? undefined,
    googleMapsLink: row.google_maps_link ?? undefined,
    gallery: row.gallery ?? [],
    depositProtectedMember: row.deposit_protected_member ?? false,
    planType: (row.plan_type as PlanType) ?? 'founding_partner',
  }
}

// ── SCOOTERS BY IDS (wishlist / saved page) ─────────────────
export async function getScootersByIds(ids: string[]): Promise<Scooter[]> {
  if (!ids.length) return []
  if (!isConfigured()) return []

  const { createClient } = await import('./server')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('scooters')
    .select('*, shops(*)')
    .in('id', ids)

  if (error || !data) return []
  return data.map(mapDbScooter)
}

// ── SHOP BY SLUG ────────────────────────────────────────────
export type ShopWithFleet = Shop & { scooters: Scooter[] }

export async function getShopBySlug(slug: string): Promise<ShopWithFleet | null> {
  if (!isConfigured()) return null

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
