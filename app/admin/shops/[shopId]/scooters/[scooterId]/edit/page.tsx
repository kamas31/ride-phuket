import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isAdminUser } from '@/lib/supabase/admin'
import { adminGetShopDetail } from '@/app/actions/admin-shops'
import { normalizeScooter } from '@/lib/normalize/normalize-scooter'
import EditScooterForm from '@/app/partner/scooters/[id]/edit/EditScooterForm'

export const metadata = { title: 'Admin · Edit Scooter' }

interface PageProps {
  params: Promise<{ shopId: string; scooterId: string }>
}

export default async function AdminEditScooterPage({ params }: PageProps) {
  const { shopId, scooterId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/admin/shops')

  const admin = createAdminClient()
  if (!(await isAdminUser(admin, user.id))) redirect('/')

  const shop = await adminGetShopDetail(shopId)
  if (!shop) notFound()

  // Fetch via the admin client (not getScooterById) — that helper uses the
  // RLS-scoped client and would 404 on unavailable scooters for a caller
  // who isn't the shop owner.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row } = await (admin as any)
    .from('scooters')
    .select('*, shops(*)')
    .eq('id', scooterId)
    .single()

  if (!row || row.shop_id !== shopId) notFound()

  const scooter = normalizeScooter(row)

  return (
    <EditScooterForm
      scooter={scooter}
      shopId={shop.id}
      shopName={shop.name}
      shopLocation={shop.location}
    />
  )
}
