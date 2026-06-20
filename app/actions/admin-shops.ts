'use server'

import { createAdminClient, isAdminUser } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface AdminShopListItem {
  id: string
  name: string
  slug: string
  location: string
  ownerStatus: string
  hasOwner: boolean
  active: boolean
  createdAt: string
}

// Admin-only: lists all shops with ownership/status fields for the admin
// shop management screen. Returns null when the caller is not an admin.
export async function adminListShops(): Promise<AdminShopListItem[] | null> {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  if (!(await isAdminUser(admin, user.id))) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('shops')
    .select('id,name,slug,location,owner_id,owner_status,active,created_at')
    .order('created_at', { ascending: false })

  if (error || !data) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(row => ({
    id:          row.id,
    name:        row.name,
    slug:        row.slug,
    location:    row.location,
    ownerStatus: row.owner_status ?? 'claimed',
    hasOwner:    row.owner_id != null,
    active:      Boolean(row.active),
    createdAt:   row.created_at,
  }))
}

export interface AdminShopDetail {
  id: string
  name: string
  slug: string
  location: string
  ownerStatus: string
  hasOwner: boolean
  active: boolean
  scooters: {
    id: string
    name: string
    pricePerDay: number
    available: boolean
    images: string[]
  }[]
}

// Admin-only: fetches a single shop plus its scooters for the admin detail
// screen. Returns null when the caller is not an admin or the shop is missing.
export async function adminGetShopDetail(shopId: string): Promise<AdminShopDetail | null> {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  if (!(await isAdminUser(admin, user.id))) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shop } = await (admin as any)
    .from('shops')
    .select('id,name,slug,location,owner_id,owner_status,active')
    .eq('id', shopId)
    .single()

  if (!shop) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: scooters } = await (admin as any)
    .from('scooters')
    .select('id,name,price_per_day,available,images')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  return {
    id:          shop.id,
    name:        shop.name,
    slug:        shop.slug,
    location:    shop.location,
    ownerStatus: shop.owner_status ?? 'claimed',
    hasOwner:    shop.owner_id != null,
    active:      Boolean(shop.active),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scooters: ((scooters ?? []) as any[]).map(s => ({
      id:          s.id,
      name:        s.name,
      pricePerDay: s.price_per_day,
      available:   Boolean(s.available),
      images:      Array.isArray(s.images) ? s.images : [],
    })),
  }
}
