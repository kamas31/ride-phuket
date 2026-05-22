import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getShopBookings } from '@/lib/supabase/queries'
import BookingsClient from './BookingsClient'

export const revalidate = 0  // always fresh — booking status changes in real time

export default async function PartnerBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/partner/bookings')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'shop_owner') redirect('/')
  if (!profile?.shop_id) redirect('/partner')

  const bookings = await getShopBookings(profile.shop_id)

  return <BookingsClient bookings={bookings} shopId={profile.shop_id} />
}
