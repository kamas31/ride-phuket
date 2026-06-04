import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/profile',
          '/messages',
          '/saved',
          '/rentals',
          '/bookings',
          '/checkout',
          '/feedback',
          '/partner/dashboard',
          '/partner/scooters',
          '/partner/shop',
          '/partner/bookings',
          '/partner/messages',
          '/partner/availability',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
