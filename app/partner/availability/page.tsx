import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerProfile, getShopForOwner } from '@/app/actions/profile'
import AvailabilityClient from './AvailabilityClient'

export const metadata = { title: 'Availability' }

export default async function AvailabilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirect=/partner/availability')

  const profile = await getServerProfile()
  if (profile?.role && profile.role !== 'shop_owner') redirect('/')

  const shop = await getShopForOwner()
  if (!shop) redirect('/partner')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: scooters } = await (supabase as any)
    .from('scooters')
    .select('id,name,price_per_day,location,available,images,category')
    .eq('shop_id', shop.id)
    .order('name')

  return <AvailabilityClient scooters={scooters ?? []} shopName={shop.name} />
}
