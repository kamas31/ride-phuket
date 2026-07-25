import Link from 'next/link'
import { ChevronRight, Bike } from 'lucide-react'
import type { Metadata } from 'next'
import { MODELS } from '@/constants/models'
import { SITE_URL, SITE_NAME } from '@/constants'
import { formatPrice } from '@/lib/utils'
import { getScooters } from '@/lib/supabase/queries'

export const revalidate = 60

export const metadata: Metadata = {
  title: `Scooter Models in Phuket | ${SITE_NAME}`,
  description: 'Browse every scooter model Koh Ride lists in Phuket — Honda PCX, Yamaha NMAX, Honda ADV, and more. Compare real listings, prices, and availability.',
  keywords: 'scooter models Phuket, Honda PCX rental, Yamaha NMAX rental, Honda ADV rental, motorbike models Phuket',
  alternates: { canonical: `${SITE_URL}/models` },
  openGraph: {
    title: `Scooter Models in Phuket | ${SITE_NAME}`,
    description: 'Every scooter model Koh Ride lists in Phuket. Compare real listings, prices, and availability.',
    url: `${SITE_URL}/models`,
    siteName: SITE_NAME,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Scooter Models in Phuket | ${SITE_NAME}`,
    description: 'Browse every scooter model Koh Ride lists in Phuket.',
  },
}

export default async function ModelsPage() {
  const scooters = await getScooters({ available: true })
  const priceFromByModel = new Map<string, number>()
  for (const model of MODELS) {
    const matching = scooters.filter(s => s.model.toLowerCase() === model.modelQuery.toLowerCase())
    if (matching.length > 0) priceFromByModel.set(model.slug, Math.min(...matching.map(s => s.pricePerDay)))
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',   item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Models', item: `${SITE_URL}/models` },
    ],
  }

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Scooter Models in Phuket',
    description: `All scooter models ${SITE_NAME} lists for rent in Phuket.`,
    itemListElement: MODELS.map((model, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: model.name,
      url: `${SITE_URL}/models/${model.slug}`,
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
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-8">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <span className="text-white">Models</span>
            </nav>
            <div className="flex items-center gap-2 mb-4">
              <Bike className="w-4 h-4 text-[#FF6B35]" />
              <span className="text-[#FF6B35] text-sm font-semibold">All Models — Phuket, Thailand</span>
            </div>
            <h1 className="text-[36px] md:text-[52px] font-bold leading-tight tracking-tight mb-5">
              Scooter Models
              <br />
              <span className="text-[#FF6B35]">in Phuket</span>
            </h1>
            <p className="text-white/65 text-[17px] leading-relaxed max-w-xl">
              From everyday automatics like the Honda Click and PCX to bigger touring models like
              the Honda ADV and Yamaha TMAX — compare real listings for every model Koh Ride lists
              across Phuket.
            </p>
          </div>
        </section>

        {/* Grid of all models */}
        <section className="max-w-5xl mx-auto px-4 py-14">
          <h2 className="text-[22px] font-bold text-[#0f0f0e] tracking-tight mb-6">
            All Scooter Models
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODELS.map(model => {
              const priceFrom = priceFromByModel.get(model.slug)
              return (
                <Link
                  key={model.slug}
                  href={`/models/${model.slug}`}
                  className="group flex flex-col p-5 bg-white rounded-[18px] border border-[#e8e8e4] hover:border-[#FF6B35] hover:bg-[#fff4f0] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bike className="w-4 h-4 text-[#FF6B35] flex-shrink-0" />
                      <span className="font-bold text-[15px] text-[#0f0f0e] group-hover:text-[#FF6B35] transition-colors leading-tight">
                        {model.name}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#c8c8c4] group-hover:text-[#FF6B35] transition-colors flex-shrink-0 mt-0.5" />
                  </div>
                  <p className="text-[13px] text-[#5c5c58] leading-relaxed line-clamp-2 mb-3">
                    {model.description}
                  </p>
                  <div className="mt-auto">
                    <span className="text-xs font-semibold text-[#FF6B35]">
                      {priceFrom ? `From ${formatPrice(priceFrom)}/day` : 'No scooters available'}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="bg-[#0f0f0e] rounded-[24px] px-8 py-10 text-center">
            <h2 className="text-[22px] md:text-[28px] font-bold text-white mb-3 tracking-tight">
              Not sure which model?
            </h2>
            <p className="text-white/50 text-sm mb-7 max-w-sm mx-auto">
              Browse all available scooters across Phuket and filter by model, location, and price.
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
