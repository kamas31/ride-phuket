'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface DevShopRow {
  id: string
  name: string
  location: string
  scootersOn: boolean   // true = at least one scooter is available
  scooterCount: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(admin: any): Promise<void> {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not admin')
}

export async function listDevShops(): Promise<DevShopRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  try { await assertAdmin(admin) } catch { return [] }

  // Find all auth users with @dev.kohride.com email
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const devUserIds: string[] = (users as any[])
    .filter((u: { email?: string }) => u.email?.endsWith('@dev.kohride.com'))
    .map((u: { id: string }) => u.id)

  if (devUserIds.length === 0) return []

  const { data: shops } = await admin
    .from('shops')
    .select('id, name, location')
    .in('owner_id', devUserIds)
    .order('name')

  if (!shops?.length) return []

  const shopIds: string[] = shops.map((s: { id: string }) => s.id)

  // Fetch scooter availability for each dev shop
  const { data: scooters } = await admin
    .from('scooters')
    .select('shop_id, available')
    .in('shop_id', shopIds)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scootersByShop = new Map<string, { total: number; available: number }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const sc of (scooters ?? []) as any[]) {
    const entry = scootersByShop.get(sc.shop_id) ?? { total: 0, available: 0 }
    entry.total++
    if (sc.available) entry.available++
    scootersByShop.set(sc.shop_id, entry)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return shops.map((s: any) => {
    const counts = scootersByShop.get(s.id) ?? { total: 0, available: 0 }
    return {
      id:           s.id,
      name:         s.name,
      location:     s.location,
      scootersOn:   counts.available > 0,
      scooterCount: counts.total,
    } satisfies DevShopRow
  })
}

export async function setDevShopScootersAvailable(
  shopId: string,
  available: boolean,
): Promise<{ error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  try { await assertAdmin(admin) } catch { return { error: 'Unauthorized' } }

  const { error } = await admin
    .from('scooters')
    .update({ available })
    .eq('shop_id', shopId)

  if (error) return { error: error.message }

  revalidatePath('/explore')
  return {}
}
