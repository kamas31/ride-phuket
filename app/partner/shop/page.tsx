import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFullShopForOwner } from '@/app/actions/profile'
import ShopSettingsClient from './ShopSettingsClient'

export const metadata = { title: 'Shop Settings' }

export default async function ShopSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirect=/partner/shop')

  const shop = await getFullShopForOwner()
  if (!shop) redirect('/partner')

  return <ShopSettingsClient shop={shop} />
}
