import type { Metadata } from 'next'
import { getScooters } from '@/lib/supabase/queries'
import { SITE_URL } from '@/constants'
import ExploreClient from './ExploreClient'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Scooter Rentals in Phuket — Browse All Available Scooters',
  description: 'Browse all scooters available for rent across Phuket. Compare models, prices, and rental shops. Honda Click, NMAX, PCX, ADV and more — from ฿180/day. No booking fees.',
  alternates: { canonical: `${SITE_URL}/explore` },
  keywords: [
    'scooter rental phuket',
    'rent scooter phuket',
    'motorbike rental phuket',
    'scooter hire phuket',
    'honda click rental phuket',
    'yamaha nmax rental phuket',
    'pcx rental phuket',
    'automatic scooter phuket',
    'cheap scooter rental phuket',
  ],
  openGraph: {
    title: 'Scooter Rentals in Phuket — Browse All Available Scooters',
    description: 'Browse all scooters available for rent across Phuket. Compare models, prices, and rental shops — from ฿180/day.',
    url: `${SITE_URL}/explore`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scooter Rentals in Phuket — Browse All Available Scooters',
    description: 'Browse all scooters available for rent across Phuket — from ฿180/day.',
  },
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const scooters = await getScooters({ available: true })
  return (
    <>
      <h1 className="sr-only">Scooter Rentals in Phuket — Browse All Available Scooters</h1>
      <ExploreClient initialScooters={scooters} initialSearch={q ?? ''} />
    </>
  )
}
