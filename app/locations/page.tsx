import Link from 'next/link'
import { ChevronRight, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import { AREAS } from '@/constants/areas'
import { SITE_URL, SITE_NAME } from '@/constants'
import { formatPrice } from '@/lib/utils'

export const metadata: Metadata = {
  title: `Scooter Rental Locations in Phuket | ${SITE_NAME}`,
  description: 'Browse all Phuket areas covered by Koh Ride. From Patong and Kata to Chalong, Nai Harn, and beyond — find scooter rentals across every major Phuket location.',
  alternates: { canonical: `${SITE_URL}/locations` },
  openGraph: {
    title: `Scooter Rental Locations in Phuket | ${SITE_NAME}`,
    description: 'All major Phuket areas covered. Find local scooter rental shops near your hotel.',
    url: `${SITE_URL}/locations`,
    type: 'website',
  },
}

export default function LocationsPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',      item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Locations', item: `${SITE_URL}/locations` },
    ],
  }

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Scooter Rental Locations in Phuket',
    description: `All Phuket areas where ${SITE_NAME} lists scooter rental shops.`,
    itemListElement: AREAS.map((area, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `Scooter Rental ${area.label}`,
      url: `${SITE_URL}/phuket/${area.slug}`,
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      <div className="min-h-screen bg-white">
        {/* Hero */}
        <section className="bg-[#0f0f0e] text-white">
          <div className="max-w-5xl mx-auto px-4 pt-28 pb-14">
            <nav className="flex items-center gap-2 text-xs text-white/50 mb-8">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <span className="text-white">Locations</span>
            </nav>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-[#FF6B35]" />
              <span className="text-[#FF6B35] text-sm font-semibold">All Areas — Phuket, Thailand</span>
            </div>
            <h1 className="text-[36px] md:text-[52px] font-bold leading-tight tracking-tight mb-5">
              Scooter Rental Locations
              <br />
              <span className="text-[#FF6B35]">in Phuket</span>
            </h1>
            <p className="text-white/65 text-[17px] leading-relaxed max-w-xl">
              Koh Ride covers all major areas of Phuket — from busy beach strips like Patong
              and Kata to quieter spots like Nai Harn, Cape Panwa, and Ko Sirey. Find a local
              rental shop near wherever you&apos;re staying.
            </p>
          </div>
        </section>

        {/* Grid of all 16 areas */}
        <section className="max-w-5xl mx-auto px-4 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AREAS.map(area => (
              <Link
                key={area.slug}
                href={`/phuket/${area.slug}`}
                className="group flex flex-col p-5 bg-white rounded-[18px] border border-[#e8e8e4] hover:border-[#FF6B35] hover:bg-[#fff4f0] transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#FF6B35] flex-shrink-0" />
                    <span className="font-bold text-[15px] text-[#0f0f0e] group-hover:text-[#FF6B35] transition-colors leading-tight">
                      {area.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#c8c8c4] group-hover:text-[#FF6B35] transition-colors flex-shrink-0 mt-0.5" />
                </div>
                <p className="text-[13px] text-[#5c5c58] leading-relaxed line-clamp-2 mb-3">
                  {area.description}
                </p>
                <div className="mt-auto">
                  <span className="text-xs font-semibold text-[#FF6B35]">
                    From {formatPrice(area.priceFrom)}/day
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="bg-[#0f0f0e] rounded-[24px] px-8 py-10 text-center">
            <h2 className="text-[22px] md:text-[28px] font-bold text-white mb-3 tracking-tight">
              Not sure which area?
            </h2>
            <p className="text-white/50 text-sm mb-7 max-w-sm mx-auto">
              Browse all available scooters across Phuket and filter by location, model, and price.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-all text-base"
            >
              Browse All Scooters
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
