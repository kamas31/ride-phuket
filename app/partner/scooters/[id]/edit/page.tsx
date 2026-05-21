import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getScooterById } from '@/lib/supabase/queries'
import EditScooterForm from './EditScooterForm'

interface EditScooterPageProps {
  params: Promise<{ id: string }>
}

export default async function EditScooterPage({ params }: EditScooterPageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/partner/dashboard')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id) redirect('/partner')

  const scooter = await getScooterById(id)
  if (!scooter || scooter.shopId !== profile.shop_id) notFound()

  return <EditScooterForm scooter={scooter} shopId={profile.shop_id} />
}
