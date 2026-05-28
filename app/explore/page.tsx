import { getScooters } from '@/lib/supabase/queries'
import ExploreClient from './ExploreClient'

export const revalidate = 60

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const scooters = await getScooters({ available: true })
  return <ExploreClient initialScooters={scooters} initialSearch={q ?? ''} />
}
