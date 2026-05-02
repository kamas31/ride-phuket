import { getScooters } from '@/lib/supabase/queries'
import ExploreClient from './ExploreClient'

export const revalidate = 60 // revalidate every 60s

export default async function ExplorePage() {
  const scooters = await getScooters({ available: true })
  return <ExploreClient initialScooters={scooters} />
}
