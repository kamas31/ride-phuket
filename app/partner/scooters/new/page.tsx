import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerProfile, getShopForOwner } from '@/app/actions/profile'
import NewScooterForm from './NewScooterForm'

export const metadata = { title: 'Add Scooter — Partner Dashboard' }

export default async function NewScooterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirect=/partner/scooters/new')

  const profile = await getServerProfile()
  if (profile?.role !== 'shop_owner') redirect('/')

  const shop = await getShopForOwner()
  if (!shop) redirect('/partner')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from('scooters')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shop.id)
  const isFirstListing = (count ?? 0) === 0

  return <NewScooterForm shopId={shop.id} shopName={shop.name} shopLocation={shop.location} isFirstListing={isFirstListing} />
}
