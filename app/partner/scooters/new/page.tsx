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

  return <NewScooterForm shopId={shop.id} shopName={shop.name} shopLocation={shop.location} />
}
