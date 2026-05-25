import type { MetadataRoute } from 'next'
import { AREAS } from '@/constants/areas'
import { SITE_URL } from '@/constants'
import { getScooters } from '@/lib/supabase/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL,                  lastModified: now, changeFrequency: 'daily',   priority: 1    },
    { url: `${SITE_URL}/explore`,     lastModified: now, changeFrequency: 'hourly',  priority: 0.9  },
    { url: `${SITE_URL}/partner`,     lastModified: now, changeFrequency: 'monthly', priority: 0.7  },
    { url: `${SITE_URL}/bookings`,    lastModified: now, changeFrequency: 'always',  priority: 0.5  },
    { url: `${SITE_URL}/profile`,     lastModified: now, changeFrequency: 'monthly', priority: 0.3  },
  ]

  const areaRoutes: MetadataRoute.Sitemap = AREAS.map(a => ({
    url: `${SITE_URL}/phuket/${a.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }))

  // Only include real scooters from the database — never mock IDs
  let scooterRoutes: MetadataRoute.Sitemap = []
  try {
    const scooters = await getScooters({ available: true })
    scooterRoutes = scooters.map(s => ({
      url: `${SITE_URL}/scooter/${s.id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {
    // DB unavailable — emit no scooter URLs rather than mock ones
  }

  return [...staticRoutes, ...areaRoutes, ...scooterRoutes]
}
