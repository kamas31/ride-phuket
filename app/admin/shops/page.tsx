import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isAdminUser } from '@/lib/supabase/admin'
import { adminListShops } from '@/app/actions/admin-shops'
import AdminShopsClient from './AdminShopsClient'

export const metadata = { title: 'Admin · Shops' }

export default async function AdminShopsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/admin/shops')

  const admin = createAdminClient()
  if (!(await isAdminUser(admin, user.id))) redirect('/')

  const shops = await adminListShops()

  return <AdminShopsClient shops={shops ?? []} />
}
