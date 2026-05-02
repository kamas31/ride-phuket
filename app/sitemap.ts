import type { MetadataRoute } from 'next'
import { SCOOTERS } from '@/data/scooters'
import { AREAS } from '@/constants/areas'
import { SITE_URL } from '@/constants'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/explore`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/partner`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/bookings`, lastModified: now, changeFrequency: 'always', priority: 0.5 },
    { url: `${SITE_URL}/profile`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ]

  const scooterRoutes: MetadataRoute.Sitemap = SCOOTERS.map(s => ({
    url: `${SITE_URL}/scooter/${s.id}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const areaRoutes: MetadataRoute.Sitemap = AREAS.map(a => ({
    url: `${SITE_URL}/phuket/${a.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }))

  return [...staticRoutes, ...areaRoutes, ...scooterRoutes]
}
