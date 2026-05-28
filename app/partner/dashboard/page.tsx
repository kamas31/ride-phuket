import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerProfile, getShopForOwner } from '@/app/actions/profile'
import { getShopAnalytics } from '@/app/actions/shop-analytics'
import { getActivityFeed } from '@/app/actions/activity-feed'
import DashboardClient from './DashboardClient'

export const metadata = { title: 'Partner Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirect=/partner/dashboard')

  const profile = await getServerProfile()

  // Allow access if role is shop_owner OR if migration not yet applied (graceful)
  if (profile?.role && profile.role !== 'shop_owner') {
    redirect('/')
  }

  const shop = await getShopForOwner()

  // Fetch scooters for this shop
  let scooters: {
    id: string; name: string; brand: string; model: string;
    price_per_day: number; location: string; available: boolean;
    images: string[]; category: string;
  }[] = []

  let bookingStats = { pending: 0, active: 0, total: 0 }

  if (shop) {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sc } = await (admin as any)
      .from('scooters')
      .select('id,name,brand,model,price_per_day,location,available,images,category')
      .eq('shop_id', shop.id)
      .order('price_per_day')
    scooters = sc ?? []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bk } = await (supabase as any)
      .from('bookings')
      .select('status')
      .eq('shop_id', shop.id)
    const bookings: { status: string }[] = bk ?? []
    bookingStats = {
      pending: bookings.filter(b => b.status === 'pending').length,
      active:  bookings.filter(b => b.status === 'active' || b.status === 'confirmed').length,
      total:   bookings.length,
    }
  }

  const [analytics, activityFeed] = await Promise.all([
    shop ? getShopAnalytics(shop.id) : Promise.resolve(null),
    shop ? getActivityFeed(shop.id)  : Promise.resolve([]),
  ])

  return (
    <DashboardClient
      profile={profile}
      shop={shop}
      scooters={scooters}
      bookingStats={bookingStats}
      analytics={analytics}
      activityFeed={activityFeed}
    />
  )
}
