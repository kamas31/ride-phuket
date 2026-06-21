import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isAdminUser } from '@/lib/supabase/admin'
import { getFullShopForAdmin } from '@/app/actions/profile'
import ShopSettingsClient from '@/app/partner/shop/ShopSettingsClient'

export const metadata = { title: 'Admin · Edit Shop' }

interface PageProps {
  params: Promise<{ shopId: string }>
}

export default async function AdminEditShopPage({ params }: PageProps) {
  const { shopId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/admin/shops')

  const admin = createAdminClient()
  if (!(await isAdminUser(admin, user.id))) redirect('/')

  const shop = await getFullShopForAdmin(shopId)
  if (!shop) notFound()

  return (
    <ShopSettingsClient
      shop={shop}
      isAdmin
      backHref={`/admin/shops/${shopId}`}
      backLabel="Shop"
      redirectTo={`/admin/shops/${shopId}`}
    />
  )
}
