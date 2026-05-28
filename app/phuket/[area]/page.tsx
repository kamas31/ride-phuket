import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, MapPin, Shield, Zap, Check, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import { ScooterCard } from '@/components/ride/ScooterCard'
import { getScooters } from '@/lib/supabase/queries'
import { getArea, AREAS } from '@/constants/areas'
import { getLiveAreas, getAreaMinPrice } from '@/lib/live-areas'
import { formatPrice } from '@/lib/utils'
import { SITE_NAME, SITE_URL } from '@/constants'

interface PageProps {
  params: Promise<{ area: string }>
}

export async function generateStaticParams() {
  return AREAS.map(a => ({ area: a.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { area: slug } = await params
  const area = getArea(slug)
  if (!area) return {}

  // Use real DB price if available — getLiveAreas() is cached per request
  const liveAreas  = await getLiveAreas()
  const liveArea   = liveAreas.find(a => a.slug === slug)
  const priceLabel = liveArea ? ` — From ${formatPrice(liveArea.priceFrom)}/day` : ''
  const title      = `Scooter Rental ${area.label}, Phuket${priceLabel}`
  const description = area.description

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/phuket/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/phuket/${slug}`,
      type: 'website',
    },
    keywords: [
      `scooter rental ${area.name} phuket`,
      `motorbike rental ${area.name}`,
      `scooter hire ${area.name} phuket`,
      `rent scooter ${area.label}`,
      `motorcycle rental phuket ${area.name}`,
    ],
  }
}

export default async function AreaPage({ params }: PageProps) {
  const { area: slug } = await params
  const area = getArea(slug)
  if (!area) notFound()

  const [areaScooters, liveAreas] = await Promise.all([
    getScooters({ location: area.name.toLowerCase() }),
    getLiveAreas(),
  ])
  const realMinPrice = getAreaMinPrice(areaScooters, area.name)
  const otherAreas = liveAreas.filter(a => a.slug !== slug)

  // Schema.org LocalBusiness structured data (no mock data — omit offers if inventory is empty)
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${SITE_NAME} — ${area.label}`,
    description: area.description,
    url: `${SITE_URL}/phuket/${slug}`,
    areaServed: {
      '@type': 'City',
      name: 'Phuket',
      addressCountry: 'TH',
    },
    ...(realMinPrice !== null && { priceRange: `฿${realMinPrice}–฿2000` }),
    ...(areaScooters.length > 0 && {
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Scooter Rentals',
        itemListElement: areaScooters.slice(0, 3).map(s => ({
          '@type': 'Offer',
          name: s.name,
          price: s.pricePerDay,
          priceCurrency: 'THB',
        })),
      },
    }),
  }

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-white">
        {/* Hero */}
        <section className="relative bg-[#0f0f0e] text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/20 via-transparent to-transparent" />
          <div className="relative max-w-5xl mx-auto px-4 pt-28 pb-14">
            <nav className="flex items-center gap-2 text-xs text-white/50 mb-8">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
              <span>/</span>
              <span className="text-white">{area.label}</span>
            </nav>

            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-[#FF6B35]" />
                <span className="text-[#FF6B35] text-sm font-semibold">{area.label}, Phuket</span>
              </div>
              <h1 className="text-[36px] md:text-[52px] font-bold leading-tight tracking-tight mb-5">
                Scooter Rental
                <br />
                <span className="text-[#FF6B35]">{area.label}</span>
              </h1>
              <p className="text-white/65 text-[17px] leading-relaxed mb-8 max-w-xl">
                {area.longDescription}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/explore?location=${slug}`}
                  className="flex items-center gap-2 px-7 py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-all shadow-lg text-[15px]"
                >
                  See Available Scooters
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-2 px-5 py-4 text-white/60 text-sm">
                  {realMinPrice !== null && (
                    <>From <strong className="text-white">{formatPrice(realMinPrice)}/day</strong> · </>
                  )}
                  Contact directly
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <div className="bg-[#f8f8f6] border-b border-[#e8e8e4]">
          <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-8 gap-y-2">
            {[
              { icon: Shield, text: 'Local scooter shops' },
              { icon: MapPin, text: 'Direct shop contact' },
              { icon: Check, text: 'Flexible rental terms' },
              { icon: Zap, text: 'WhatsApp-first' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-sm text-[#5c5c58]">
                <Icon className="w-3.5 h-3.5 text-[#FF6B35]" />
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Scooters */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex items-end justify-between mb-7">
            <div>
              <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-widest mb-2">Available Now</p>
              <h2 className="text-[24px] font-bold text-[#0f0f0e] tracking-tight">
                Scooters in {area.label}
              </h2>
            </div>
            {areaScooters.length > 0 && (
              <Link
                href={`/explore?location=${slug}`}
                className="flex items-center gap-1 text-sm font-semibold text-[#FF6B35] hover:gap-2 transition-all"
              >
                All scooters <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          {areaScooters.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {areaScooters.slice(0, 4).map(scooter => (
                <ScooterCard key={scooter.id} scooter={scooter} />
              ))}
            </div>
          ) : (
            <div className="text-center py-14 bg-[#f8f8f6] rounded-[20px] border border-[#e8e8e4]">
              <p className="text-[#5c5c58] font-medium mb-1">No listings in {area.label} yet</p>
              <p className="text-[#9c9c98] text-sm mb-5">
                Browse all available scooters across Phuket.
              </p>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B35] text-white text-sm font-semibold rounded-full hover:bg-[#e85d29] transition-colors"
              >
                Explore all scooters
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>

        {/* Area highlights */}
        <section className="bg-[#f8f8f6] py-12">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Highlights */}
              <div>
                <h2 className="text-[20px] font-bold text-[#0f0f0e] mb-5">
                  Why rent in {area.name}?
                </h2>
                <div className="space-y-3">
                  {area.highlights.map(h => (
                    <div key={h} className="flex items-center gap-3 text-sm text-[#5c5c58]">
                      <div className="w-5 h-5 bg-[#f0fdf4] rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-[#22c55e]" />
                      </div>
                      {h}
                    </div>
                  ))}
                </div>
              </div>

              {/* Nearby attractions */}
              <div>
                <h2 className="text-[20px] font-bold text-[#0f0f0e] mb-5">
                  Explore from {area.name}
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {area.nearbyAttractions.map(attraction => (
                    <div key={attraction} className="flex items-center gap-2 text-sm text-[#5c5c58] py-2 border-b border-[#e8e8e4] last:border-0">
                      <MapPin className="w-3 h-3 text-[#9c9c98] flex-shrink-0" />
                      {attraction}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Other areas — only live zones with real inventory */}
        {otherAreas.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 py-12">
            <h2 className="text-[20px] font-bold text-[#0f0f0e] mb-6">Other areas in Phuket</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {otherAreas.map(other => (
                <Link
                  key={other.slug}
                  href={`/phuket/${other.slug}`}
                  className="flex items-center justify-between px-4 py-3.5 bg-[#f8f8f6] rounded-[14px] border border-[#e8e8e4] hover:border-[#FF6B35] hover:bg-[#fff4f0] group transition-all"
                >
                  <div>
                    <p className="font-semibold text-sm text-[#0f0f0e] group-hover:text-[#FF6B35] transition-colors">{other.label}</p>
                    <p className="text-xs text-[#9c9c98]">From {formatPrice(other.priceFrom)}/day</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9c9c98] group-hover:text-[#FF6B35] transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="bg-[#0f0f0e] rounded-[24px] px-8 py-10 text-center">
            <div className="absolute left-1/2 -translate-x-1/2 w-60 h-20 bg-[#FF6B35]/20 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-[24px] md:text-[32px] font-bold text-white mb-3 tracking-tight">
              Ready to explore {area.name}?
            </h2>
            <p className="text-white/50 text-sm mb-7 max-w-sm mx-auto">
              Find your scooter, contact the shop directly, and explore on your terms.
            </p>
            <Link
              href={`/explore?location=${slug}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-all text-base"
            >
              Find Your Scooter
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
