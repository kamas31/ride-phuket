import type { MetadataRoute } from 'next'
import { AREAS } from '@/constants/areas'
import { MODELS } from '@/constants/models'
import { SITE_URL } from '@/constants'
import { getScooters, getShopSlugs } from '@/lib/supabase/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL,                lastModified: now, changeFrequency: 'daily',   priority: 1    },
    { url: `${SITE_URL}/explore`,   lastModified: now, changeFrequency: 'hourly',  priority: 0.9  },
    { url: `${SITE_URL}/partner`,   lastModified: now, changeFrequency: 'monthly', priority: 0.7  },
    { url: `${SITE_URL}/contact-us`, lastModified: now, changeFrequency: 'monthly', priority: 0.5  },
    { url: `${SITE_URL}/faq`,        lastModified: now, changeFrequency: 'monthly', priority: 0.7  },
    { url: `${SITE_URL}/locations`,  lastModified: now, changeFrequency: 'monthly', priority: 0.8  },
    { url: `${SITE_URL}/terms`,     lastModified: now, changeFrequency: 'yearly',  priority: 0.3  },
    { url: `${SITE_URL}/privacy`,   lastModified: now, changeFrequency: 'yearly',  priority: 0.3  },
  ]

  const areaRoutes: MetadataRoute.Sitemap = AREAS.map(a => ({
    url: `${SITE_URL}/phuket/${a.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }))

  const modelRoutes: MetadataRoute.Sitemap = MODELS.map(m => ({
    url: `${SITE_URL}/models/${m.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }))

  // Shop pages — indexed individually for local SEO
  let shopRoutes: MetadataRoute.Sitemap = []
  try {
    const slugs = await getShopSlugs()
    shopRoutes = slugs.map(slug => ({
      url: `${SITE_URL}/shop/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {
    // DB unavailable — emit no shop URLs rather than mock ones
  }

  // Only include real scooters from the database — never mock IDs
  let scooterRoutes: MetadataRoute.Sitemap = []
  try {
    const scooters = await getScooters({ available: true })
    scooterRoutes = scooters.map(s => ({
      url: `${SITE_URL}/scooter/${s.id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }))
  } catch {
    // DB unavailable — emit no scooter URLs rather than mock ones
  }

  return [...staticRoutes, ...areaRoutes, ...modelRoutes, ...shopRoutes, ...scooterRoutes]
}
