import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isAdminUser } from '@/lib/supabase/admin'
import { adminGetShopDetail } from '@/app/actions/admin-shops'
import AdminShopDetailClient from './AdminShopDetailClient'

export const metadata = { title: 'Admin · Shop' }

interface PageProps {
  params: Promise<{ shopId: string }>
}

export default async function AdminShopDetailPage({ params }: PageProps) {
  const { shopId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/admin/shops')

  const admin = createAdminClient()
  if (!(await isAdminUser(admin, user.id))) redirect('/')

  const shop = await adminGetShopDetail(shopId)
  if (!shop) notFound()

  return <AdminShopDetailClient shop={shop} />
}
