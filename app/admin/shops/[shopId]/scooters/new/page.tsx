import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isAdminUser } from '@/lib/supabase/admin'
import { adminGetShopDetail } from '@/app/actions/admin-shops'
import NewScooterForm from '@/app/partner/scooters/new/NewScooterForm'

export const metadata = { title: 'Admin · Add Scooter' }

interface PageProps {
  params: Promise<{ shopId: string }>
}

export default async function AdminNewScooterPage({ params }: PageProps) {
  const { shopId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/admin/shops')

  const admin = createAdminClient()
  if (!(await isAdminUser(admin, user.id))) redirect('/')

  const shop = await adminGetShopDetail(shopId)
  if (!shop) notFound()

  return <NewScooterForm shopId={shop.id} shopName={shop.name} shopLocation={shop.location} />
}
