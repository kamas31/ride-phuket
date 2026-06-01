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
  const admin = createAdminClient()

  // Fetch scooters for this shop
  let scooters: {
    id: string; name: string; brand: string; model: string;
    price_per_day: number; location: string; available: boolean;
    images: string[]; category: string;
    specs: Record<string, string>;
  }[] = []

  let bookingStats = { pending: 0, active: 0, total: 0 }

  if (shop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sc } = await (admin as any)
      .from('scooters')
      .select('id,name,brand,model,price_per_day,location,available,images,category,specs')
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

  // Unread review count for dashboard alert
  let unreadReviewCount = 0
  if (shop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: shopFull } = await (admin as any)
      .from('shops')
      .select('reviews_last_seen_at')
      .eq('id', shop.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (admin as any)
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shop.id)
      .gt('created_at', shopFull?.reviews_last_seen_at ?? '1970-01-01T00:00:00Z')

    unreadReviewCount = count ?? 0
  }

  // Unread count + preview for the dashboard alert
  let unreadCount = 0
  let unreadPreview: { senderName: string | null; messageText: string | null; scooterName: string | null } | null = null

  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: convos } = await (supabase as any)
      .from('conversations')
      .select('id')
      .or(`client_id.eq.${user.id},owner_id.eq.${user.id}`)

    if (convos?.length) {
      const ids = convos.map((c: { id: string }) => c.id)

      // Count and latest unread message in parallel
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [{ count }, { data: latestMsg }] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', ids)
          .neq('sender_id', user.id)
          .is('read_at', null),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (admin as any)
          .from('messages')
          .select('content, sender_id, conversation_id')
          .in('conversation_id', ids)
          .neq('sender_id', user.id)
          .is('read_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      unreadCount = count ?? 0

      if (latestMsg) {
        // Sender name + scooter name in parallel
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [{ data: senderProfile }, { data: convoWithScooter }] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (admin as any)
            .from('profiles')
            .select('name')
            .eq('id', latestMsg.sender_id)
            .maybeSingle(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (admin as any)
            .from('conversations')
            .select('scooters(name)')
            .eq('id', latestMsg.conversation_id)
            .maybeSingle(),
        ])

        unreadPreview = {
          senderName:  senderProfile?.name ?? null,
          messageText: latestMsg.content   ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          scooterName: (convoWithScooter as any)?.scooters?.name ?? null,
        }
      }
    }
  }

  return (
    <DashboardClient
      profile={profile}
      shop={shop}
      scooters={scooters}
      bookingStats={bookingStats}
      analytics={analytics}
      activityFeed={activityFeed}
      unreadCount={unreadCount}
      unreadPreview={unreadPreview}
      unreadReviewCount={unreadReviewCount}
    />
  )
}
